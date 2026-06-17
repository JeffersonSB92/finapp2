import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { Linking } from 'react-native';
import { create } from 'zustand';

import {
  claimLegacyLocalDataForScope,
  initDatabase,
  PersonRepository,
  setCurrentAuthenticatedUserId,
  setCurrentDatabaseUserId,
} from '../database';
import { getSupabaseClient, syncService } from '../sync';
import {
  clearBiometricCredentials,
  getBiometricAvailability,
  getBiometricCredentials,
  getBiometricLoginEnabled,
  requestBiometricAuthentication,
  saveBiometricCredentials,
  setBiometricLoginEnabled,
  updateBiometricCredentialEmail,
} from '../utils/biometric';
import { useFinanceStore } from './financeStore';

export interface UserProfile {
  email: string;
  fullName: string;
  displayName: string;
}

export type HouseholdRole = 'owner' | 'member';

export interface HouseholdContext {
  id: string;
  name: string;
  role: HouseholdRole;
  ownerUserId: string;
}

interface AuthState {
  session: Session | null;
  profile: UserProfile | null;
  household: HouseholdContext | null;
  isBiometricAvailable: boolean;
  biometricLabel: string;
  isBiometricEnabled: boolean;
  isBiometricUnlocked: boolean;
  isBiometricProcessing: boolean;
  pendingInviteToken: string | null;
  isLoading: boolean;
  isProfileSaving: boolean;
  isCreatingInvite: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (input: UserProfile) => Promise<void>;
  createInviteLink: () => Promise<string>;
  enableBiometricLogin: (email: string, password: string) => Promise<void>;
  disableBiometricLogin: () => Promise<void>;
  signInWithBiometrics: () => Promise<void>;
  unlockWithBiometrics: () => Promise<void>;
  lockBiometricSession: () => void;
  setPendingInviteToken: (token: string | null) => void;
  clearPendingInvite: () => void;
}

interface HouseholdMembershipRow {
  role: HouseholdRole;
  household: {
    id: string;
    name: string;
    owner_user_id: string;
  } | Array<{
    id: string;
    name: string;
    owner_user_id: string;
  }> | null;
}

let authInitialized = false;
let deepLinkSubscriptionRegistered = false;
const personRepository = new PersonRepository();

function mapAuthErrorMessage(message: string): string {
  if (message === 'Email not confirmed') {
    return 'Seu e-mail ainda não foi confirmado. Abra a mensagem enviada pelo Supabase e clique no link de confirmação antes de entrar.';
  }

  if (message === 'Invalid login credentials') {
    return 'E-mail ou senha inválidos.';
  }

  if (message === 'INVITE_NOT_FOUND') {
    return 'Esse convite não foi encontrado.';
  }

  if (message === 'INVITE_EXPIRED') {
    return 'Esse convite expirou.';
  }

  if (message === 'INVITE_ALREADY_ACCEPTED') {
    return 'Esse convite já foi utilizado.';
  }

  return message;
}

function buildUserProfile(session: Session | null): UserProfile | null {
  const user = session?.user;

  if (!user) {
    return null;
  }

  return {
    email: user.email ?? '',
    fullName: String(user.user_metadata.full_name ?? '').trim(),
    displayName: String(user.user_metadata.display_name ?? '').trim(),
  };
}

function parseInviteToken(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const tokenMatch = trimmed.match(/[?&]token=([^&]+)/i);

  if (tokenMatch?.[1]) {
    return decodeURIComponent(tokenMatch[1]);
  }

  const pathMatch = trimmed.match(/\/invite\/([^/?#]+)/i);

  if (pathMatch?.[1]) {
    return decodeURIComponent(pathMatch[1]);
  }

  if (/^[a-zA-Z0-9_-]{16,}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

function buildInviteLink(token: string): string {
  return `finapp://invite?token=${encodeURIComponent(token)}`;
}

function generateInviteToken(): string {
  const randomSegment = () => Math.random().toString(36).slice(2, 12);
  return `inv_${randomSegment()}${randomSegment()}${Date.now().toString(36)}`;
}

function getDefaultHouseholdName(session: Session): string {
  const profile = buildUserProfile(session);

  if (profile?.displayName) {
    return `Espaco de ${profile.displayName}`;
  }

  if (profile?.fullName) {
    return `Espaco de ${profile.fullName}`;
  }

  if (session.user.email) {
    return `Espaco de ${session.user.email}`;
  }

  return 'Meu espaco financeiro';
}

async function applyLocalScope(
  session: Session | null,
  household: HouseholdContext | null,
): Promise<void> {
  setCurrentAuthenticatedUserId(session?.user.id ?? null);
  setCurrentDatabaseUserId(household?.id ?? null);
  useFinanceStore.getState().resetForSession();

  if (session?.user.id && household?.id) {
    await initDatabase();
    await claimLegacyLocalDataForScope(household.id, [session.user.id]);
  }
}

function getDefaultPersonName(session: Session): string {
  const profile = buildUserProfile(session);

  if (profile?.displayName) {
    return profile.displayName;
  }

  if (profile?.fullName) {
    return profile.fullName;
  }

  if (session.user.email) {
    return session.user.email.split('@')[0];
  }

  return 'Usuário';
}

async function applySessionSafely(
  session: Session | null,
  household: HouseholdContext | null,
): Promise<string | null> {
  try {
    await applyLocalScope(session, household);
    return null;
  } catch (error) {
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return 'Não foi possível preparar os dados locais para esta sessão.';
  }
}

async function refreshBiometricState(session: Session | null): Promise<void> {
  const availability = await getBiometricAvailability();
  const isEnabled = availability.isAvailable
    ? await getBiometricLoginEnabled()
    : false;

  useAuthStore.setState({
    isBiometricAvailable: availability.isAvailable,
    biometricLabel: availability.label,
    isBiometricEnabled: isEnabled,
    isBiometricUnlocked: !session || !isEnabled,
  });
}

function mapMembershipRow(row: HouseholdMembershipRow): HouseholdContext | null {
  const household = Array.isArray(row.household)
    ? row.household[0] ?? null
    : row.household;

  if (!household) {
    return null;
  }

  return {
    id: household.id,
    name: household.name,
    role: row.role,
    ownerUserId: household.owner_user_id,
  };
}

async function getPrimaryHouseholdForUser(userId: string): Promise<HouseholdContext | null> {
  const client = getSupabaseClient();

  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from('household_members')
    .select(
      'role, household:households!inner(id, name, owner_user_id)',
    )
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as HouseholdMembershipRow[];
  const households = rows.map(mapMembershipRow).filter(Boolean) as HouseholdContext[];

  if (households.length === 0) {
    return null;
  }

  const ownerHousehold = households.find((item) => item.role === 'owner');
  return ownerHousehold ?? households[0];
}

async function ensurePersonalHousehold(session: Session): Promise<HouseholdContext> {
  const client = getSupabaseClient();

  if (!client) {
    throw new Error('O Supabase não está configurado.');
  }

  const existing = await getPrimaryHouseholdForUser(session.user.id);

  if (existing) {
    return existing;
  }

  const { data: household, error: householdError } = await client
    .from('households')
    .insert({
      owner_user_id: session.user.id,
      name: getDefaultHouseholdName(session),
    })
    .select('id, name, owner_user_id')
    .single();

  if (householdError || !household) {
    throw householdError ?? new Error('Não foi possível criar o espaço financeiro principal.');
  }

  const { error: membershipError } = await client.from('household_members').upsert(
    {
      household_id: household.id,
      user_id: session.user.id,
      role: 'owner',
      invited_by_user_id: session.user.id,
      accepted_at: new Date().toISOString(),
    },
    { onConflict: 'household_id,user_id' },
  );

  if (membershipError) {
    throw membershipError;
  }

  return {
    id: household.id,
    name: household.name,
    role: 'owner',
    ownerUserId: household.owner_user_id,
  };
}

async function acceptInviteToken(token: string): Promise<HouseholdContext> {
  const client = getSupabaseClient();

  if (!client) {
    throw new Error('O Supabase não está configurado.');
  }

  const { data, error } = await client.rpc('accept_household_invite', {
    p_token: token,
  });

  if (error) {
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : data;

  if (!row?.household_id) {
    throw new Error('Não foi possível vincular esta conta ao convite.');
  }

  return {
    id: String(row.household_id),
    name: String(row.household_name ?? 'Espaco compartilhado'),
    role: String(row.role ?? 'member') as HouseholdRole,
    ownerUserId: String(row.owner_user_id ?? ''),
  };
}

async function resolveHouseholdContext(
  session: Session,
  pendingInviteToken: string | null,
): Promise<{
  error: string | null;
  household: HouseholdContext;
  pendingInviteToken: string | null;
}> {
  try {
    if (pendingInviteToken) {
      const household = await acceptInviteToken(pendingInviteToken);
      return {
        error: null,
        household,
        pendingInviteToken: null,
      };
    }

    const household =
      (await getPrimaryHouseholdForUser(session.user.id)) ??
      (await ensurePersonalHousehold(session));

    return {
      error: null,
      household,
      pendingInviteToken: null,
    };
  } catch (error) {
    const fallbackHousehold =
      (await getPrimaryHouseholdForUser(session.user.id)) ??
      (await ensurePersonalHousehold(session));

    return {
      error:
        error instanceof Error
          ? mapAuthErrorMessage(error.message)
          : 'Não foi possível resolver o espaço financeiro desta sessão.',
      household: fallbackHousehold,
      pendingInviteToken: null,
    };
  }
}

async function syncSessionContext(session: Session | null): Promise<void> {
  if (!session) {
    const sessionError = await applySessionSafely(null, null);
    useAuthStore.setState({
      household: null,
      error: sessionError,
    });
    return;
  }

  const pendingInviteToken = useAuthStore.getState().pendingInviteToken;
  const result = await resolveHouseholdContext(session, pendingInviteToken);
  const sessionError = await applySessionSafely(session, result.household);

  if (!sessionError) {
    try {
      const nextName = getDefaultPersonName(session).trim();
      const existingPerson = await personRepository.findByAuthUserId(session.user.id);
      const matchingUnlinkedPerson =
        nextName.length > 0
          ? await personRepository.findFirstUnlinkedByName(nextName)
          : null;
      let personChanged = false;

      if (!existingPerson && matchingUnlinkedPerson) {
        const linkedPerson = await personRepository.update(matchingUnlinkedPerson.id, {
          auth_user_id: session.user.id,
          name: nextName,
        });
        await syncService.queueUpsert('people', linkedPerson.sync_id);
        personChanged = true;
      } else if (!existingPerson) {
        const createdPerson = await personRepository.create({
          auth_user_id: session.user.id,
          name: nextName,
          is_active: true,
        });
        await syncService.queueUpsert('people', createdPerson.sync_id);
        personChanged = true;
      } else if (
        existingPerson.name.trim() !== nextName &&
        nextName.length > 0
      ) {
        const updatedPerson = await personRepository.update(existingPerson.id, {
          auth_user_id: session.user.id,
          name: nextName,
        });
        await syncService.queueUpsert('people', updatedPerson.sync_id);
        personChanged = true;
      } else if (existingPerson.auth_user_id !== session.user.id) {
        const updatedPerson = await personRepository.update(existingPerson.id, {
          auth_user_id: session.user.id,
        });
        await syncService.queueUpsert('people', updatedPerson.sync_id);
        personChanged = true;
      }

      if (
        existingPerson &&
        matchingUnlinkedPerson &&
        matchingUnlinkedPerson.id !== existingPerson.id
      ) {
        const mergeResult = await personRepository.mergePeople(
          matchingUnlinkedPerson.id,
          existingPerson.id,
        );

        if (mergeResult) {
          for (const accountSyncId of mergeResult.accountSyncIds) {
            await syncService.queueUpsert('accounts', accountSyncId);
          }

          for (const transactionSyncId of mergeResult.transactionSyncIds) {
            await syncService.queueUpsert('transactions', transactionSyncId);
          }

          await syncService.queueDelete('people', mergeResult.sourcePerson);
        }

        personChanged = true;
      }

      if (personChanged && useFinanceStore.getState().isInitialized) {
        await useFinanceStore.getState().loadPeople();
        await useFinanceStore.getState().loadAccounts();
        await useFinanceStore.getState().loadTransactions();
        void useFinanceStore.getState().syncNow();
      }
    } catch (error) {
      useAuthStore.setState({
        error:
          error instanceof Error
            ? error.message
            : 'Não foi possível garantir a pessoa vinculada ao usuário autenticado.',
      });
    }
  }

  useAuthStore.setState({
    household: result.household,
    pendingInviteToken: result.pendingInviteToken,
    error: sessionError ?? result.error,
  });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  household: null,
  isBiometricAvailable: false,
  biometricLabel: 'Biometria',
  isBiometricEnabled: false,
  isBiometricUnlocked: true,
  isBiometricProcessing: false,
  pendingInviteToken: null,
  isLoading: true,
  isProfileSaving: false,
  isCreatingInvite: false,
  error: null,

  initialize: async () => {
    const client = getSupabaseClient();

    if (!client) {
      await refreshBiometricState(null);
      set({
        profile: null,
        household: null,
        isLoading: false,
        error: 'O Supabase não está configurado. Adicione a URL do projeto e a chave anônima ao arquivo .env.',
      });
      return;
    }

    if (!deepLinkSubscriptionRegistered) {
      const handleIncomingUrl = (url: string) => {
        const inviteToken = parseInviteToken(url);

        if (!inviteToken) {
          return;
        }

        set({ pendingInviteToken: inviteToken, error: null });

        const activeSession = useAuthStore.getState().session;

        if (activeSession) {
          void syncSessionContext(activeSession);
        }
      };

      Linking.addEventListener('url', ({ url }) => {
        handleIncomingUrl(url);
      });
      deepLinkSubscriptionRegistered = true;

      const initialUrl = await Linking.getInitialURL();
      const inviteToken = parseInviteToken(initialUrl);

      if (inviteToken) {
        set({ pendingInviteToken: inviteToken });
      }
    }

    if (authInitialized) {
      const currentSession = useAuthStore.getState().session;
      await refreshBiometricState(currentSession);
      set({
        isLoading: false,
        profile: buildUserProfile(currentSession),
      });

      if (currentSession) {
        await syncSessionContext(currentSession);
      }
      return;
    }

    set({ isLoading: true, error: null });

    const {
      data: { session },
      error,
    } = await client.auth.getSession();

    if (error) {
      set({ isLoading: false, error: mapAuthErrorMessage(error.message) });
      return;
    }

    set({
      session,
      profile: buildUserProfile(session),
      isLoading: false,
      error: null,
    });
    await refreshBiometricState(session);
    await syncSessionContext(session);

    client.auth.onAuthStateChange((
      _: AuthChangeEvent,
      nextSession: Session | null,
    ) => {
      set({
        session: nextSession,
        profile: buildUserProfile(nextSession),
        isLoading: false,
        error: null,
      });
      void refreshBiometricState(nextSession);
      void syncSessionContext(nextSession);
    });

    authInitialized = true;
  },

  signIn: async (email, password) => {
    const client = getSupabaseClient();

    if (!client) {
      throw new Error('O Supabase não está configurado.');
    }

    set({ isLoading: true, error: null });
    const {
      data: { session },
      error,
    } = await client.auth.signInWithPassword({ email, password });

    if (error) {
      set({ isLoading: false, error: mapAuthErrorMessage(error.message) });
      throw error;
    }

    set({
      session,
      profile: buildUserProfile(session),
      isLoading: false,
      error: null,
    });
    await refreshBiometricState(session);
    await syncSessionContext(session);
  },

  signUp: async (email, password) => {
    const client = getSupabaseClient();

    if (!client) {
      throw new Error('O Supabase não está configurado.');
    }

    set({ isLoading: true, error: null });
    const {
      data: { session, user },
      error,
    } = await client.auth.signUp({ email, password });

    if (error) {
      set({ isLoading: false, error: mapAuthErrorMessage(error.message) });
      throw error;
    }

    if (session) {
      set({
        session,
        profile: buildUserProfile(session),
        isLoading: false,
        error: null,
      });
      await refreshBiometricState(session);
      await syncSessionContext(session);
      return;
    }

    set({
      isLoading: false,
      error:
        user
          ? 'Conta criada. Se a confirmação de e-mail estiver ativada no Supabase, abra sua caixa de entrada e confirme antes de entrar. Se você veio por convite, o vínculo será concluído no primeiro login.'
          : 'Não foi possível concluir o cadastro.',
    });
  },

  signOut: async () => {
    const client = getSupabaseClient();

    if (!client) {
      setCurrentAuthenticatedUserId(null);
      setCurrentDatabaseUserId(null);
      useFinanceStore.getState().resetForSession();
      await refreshBiometricState(null);
      set({
        session: null,
        profile: null,
        household: null,
        isLoading: false,
        isProfileSaving: false,
        isCreatingInvite: false,
        error: null,
      });
      return;
    }

    set({ isLoading: true, error: null });
    const { error } = await client.auth.signOut();

    if (error) {
      set({ isLoading: false, error: mapAuthErrorMessage(error.message) });
      throw error;
    }

    set({
      session: null,
      profile: null,
      household: null,
      isLoading: false,
      isProfileSaving: false,
      isCreatingInvite: false,
      error: null,
    });
    await refreshBiometricState(null);
    await syncSessionContext(null);
  },

  updateProfile: async (input) => {
    const client = getSupabaseClient();
    const currentSession = get().session;

    if (!client || !currentSession) {
      throw new Error('Não existe uma sessão ativa para atualizar o perfil.');
    }

    set({ isProfileSaving: true, error: null });

    const { data, error } = await client.auth.updateUser({
      email: input.email.trim(),
      data: {
        full_name: input.fullName.trim(),
        display_name: input.displayName.trim(),
      },
    });

    if (error) {
      set({ isProfileSaving: false, error: mapAuthErrorMessage(error.message) });
      throw error;
    }

    const nextSession = {
      ...currentSession,
      user: data.user ?? currentSession.user,
    };

    set({
      session: nextSession,
      profile: buildUserProfile(nextSession),
      isProfileSaving: false,
      error: null,
    });

    if (get().isBiometricEnabled) {
      await updateBiometricCredentialEmail(input.email.trim());
    }
  },

  createInviteLink: async () => {
    const client = getSupabaseClient();
    const session = get().session;
    const household = get().household;

    if (!client || !session || !household) {
      throw new Error('É preciso estar com uma sessão ativa para criar convites.');
    }

    if (household.role !== 'owner') {
      throw new Error('Somente o proprietário do espaço pode gerar convites.');
    }

    set({ isCreatingInvite: true, error: null });

    try {
      const token = generateInviteToken();
      const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

      const { error } = await client.from('household_invites').insert({
        household_id: household.id,
        created_by_user_id: session.user.id,
        token,
        expires_at: expiresAt,
      });

      if (error) {
        throw error;
      }

      set({ isCreatingInvite: false });
      return buildInviteLink(token);
    } catch (error) {
      const message =
        error instanceof Error
          ? mapAuthErrorMessage(error.message)
          : 'Não foi possível criar o convite.';

      set({ isCreatingInvite: false, error: message });
      throw new Error(message);
    }
  },

  enableBiometricLogin: async (email, password) => {
    const availability = await getBiometricAvailability();

    if (!availability.isAvailable) {
      throw new Error('Nenhuma biometria está disponível neste aparelho.');
    }

    set({ isBiometricProcessing: true, error: null });

    try {
      await requestBiometricAuthentication(`Autorize o uso de ${availability.label}`);
      await saveBiometricCredentials(email.trim(), password);
      await setBiometricLoginEnabled(true);
      await refreshBiometricState(get().session);
      set({ isBiometricProcessing: false, error: null });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível ativar a biometria neste aparelho.';

      set({ isBiometricProcessing: false, error: message });
      throw new Error(message);
    }
  },

  disableBiometricLogin: async () => {
    set({ isBiometricProcessing: true, error: null });

    try {
      await clearBiometricCredentials();
      await refreshBiometricState(get().session);
      set({ isBiometricProcessing: false, error: null });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível desativar a biometria.';

      set({ isBiometricProcessing: false, error: message });
      throw new Error(message);
    }
  },

  signInWithBiometrics: async () => {
    const availability = await getBiometricAvailability();

    if (!availability.isAvailable) {
      throw new Error('Nenhuma biometria está disponível neste aparelho.');
    }

    set({ isBiometricProcessing: true, error: null });

    try {
      await requestBiometricAuthentication(`Entre com ${availability.label}`);
      const credentials = await getBiometricCredentials();

      if (!credentials) {
        throw new Error('Nenhum login biométrico foi configurado neste aparelho.');
      }

      await get().signIn(credentials.email, credentials.password);
      set({ isBiometricProcessing: false, error: null });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível entrar com biometria.';

      set({ isBiometricProcessing: false, error: message });
      throw new Error(message);
    }
  },

  unlockWithBiometrics: async () => {
    const session = get().session;
    const availability = await getBiometricAvailability();

    if (!session) {
      set({ isBiometricUnlocked: true });
      return;
    }

    if (!availability.isAvailable) {
      throw new Error('Nenhuma biometria está disponível neste aparelho.');
    }

    set({ isBiometricProcessing: true, error: null });

    try {
      await requestBiometricAuthentication(`Desbloqueie com ${availability.label}`);
      set({
        isBiometricUnlocked: true,
        isBiometricProcessing: false,
        error: null,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível desbloquear o app com biometria.';

      set({ isBiometricProcessing: false, error: message });
      throw new Error(message);
    }
  },

  lockBiometricSession: () => {
    if (get().session && get().isBiometricEnabled) {
      set({ isBiometricUnlocked: false });
    }
  },

  setPendingInviteToken: (token) => {
    set({ pendingInviteToken: parseInviteToken(token), error: null });
  },

  clearPendingInvite: () => {
    set({ pendingInviteToken: null });
  },
}));
