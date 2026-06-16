import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import {
  claimLegacyLocalDataForUser,
  initDatabase,
  setCurrentDatabaseUserId,
} from '../database';
import { getSupabaseClient } from '../sync';
import { useFinanceStore } from './financeStore';

export interface UserProfile {
  email: string;
  fullName: string;
  displayName: string;
}

interface AuthState {
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isProfileSaving: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (input: UserProfile) => Promise<void>;
}

let authInitialized = false;

function mapAuthErrorMessage(message: string): string {
  if (message === 'Email not confirmed') {
    return 'Seu e-mail ainda não foi confirmado. Abra a mensagem enviada pelo Supabase e clique no link de confirmação antes de entrar.';
  }

  if (message === 'Invalid login credentials') {
    return 'E-mail ou senha inválidos.';
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

async function applySession(session: Session | null): Promise<void> {
  const userId = session?.user.id ?? null;
  setCurrentDatabaseUserId(userId);
  useFinanceStore.getState().resetForSession();

  if (userId) {
    await initDatabase();
    await claimLegacyLocalDataForUser(userId);
  }
}

async function applySessionSafely(session: Session | null): Promise<string | null> {
  try {
    await applySession(session);
    return null;
  } catch (error) {
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return 'Não foi possível preparar os dados locais para esta sessão.';
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  isLoading: true,
  isProfileSaving: false,
  error: null,

  initialize: async () => {
    const client = getSupabaseClient();

    if (!client) {
      set({
        profile: null,
        isLoading: false,
        error: 'O Supabase não está configurado. Adicione a URL do projeto e a chave anônima ao arquivo .env.',
      });
      return;
    }

    if (authInitialized) {
      set({ isLoading: false, profile: buildUserProfile(useAuthStore.getState().session) });
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

    set({ session, profile: buildUserProfile(session), isLoading: false, error: null });
    const sessionError = await applySessionSafely(session);
    if (sessionError) {
      set({ error: sessionError });
    }

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
      void applySessionSafely(nextSession).then((sessionError) => {
        if (sessionError) {
          set({ error: sessionError });
        }
      });
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

    set({ session, profile: buildUserProfile(session), isLoading: false, error: null });

    const sessionError = await applySessionSafely(session);
    if (sessionError) {
      set({ error: sessionError });
    }
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
      set({ session, profile: buildUserProfile(session), isLoading: false, error: null });
      const sessionError = await applySessionSafely(session);
      if (sessionError) {
        set({ error: sessionError });
      }
      return;
    }

    set({
      isLoading: false,
      error:
        user
          ? 'Conta criada. Se a confirmação de e-mail estiver ativada no Supabase, abra sua caixa de entrada e confirme antes de entrar.'
          : 'Não foi possível concluir o cadastro.',
    });
  },

  signOut: async () => {
    const client = getSupabaseClient();

    if (!client) {
      setCurrentDatabaseUserId(null);
      useFinanceStore.getState().resetForSession();
      set({ session: null, profile: null, isLoading: false, isProfileSaving: false, error: null });
      return;
    }

    set({ isLoading: true, error: null });
    const { error } = await client.auth.signOut();

    if (error) {
      set({ isLoading: false, error: mapAuthErrorMessage(error.message) });
      throw error;
    }

    set({ session: null, profile: null, isLoading: false, isProfileSaving: false, error: null });
    const sessionError = await applySessionSafely(null);
    if (sessionError) {
      set({ error: sessionError });
    }
  },

  updateProfile: async (input) => {
    const client = getSupabaseClient();
    const currentSession = useAuthStore.getState().session;

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
  },
}));
