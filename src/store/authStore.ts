import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import {
  claimLegacyLocalDataForUser,
  initDatabase,
  setCurrentDatabaseUserId,
} from '../database';
import { getSupabaseClient } from '../sync';
import { useFinanceStore } from './financeStore';

interface AuthState {
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

let authInitialized = false;

function mapAuthErrorMessage(message: string): string {
  if (message === 'Email not confirmed') {
    return 'Seu email ainda nao foi confirmado. Abra a mensagem enviada pelo Supabase e clique no link de confirmacao antes de entrar.';
  }

  if (message === 'Invalid login credentials') {
    return 'Email ou senha invalidos.';
  }

  return message;
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

    return 'Nao foi possivel preparar os dados locais para esta sessao.';
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isLoading: true,
  error: null,

  initialize: async () => {
    const client = getSupabaseClient();

    if (!client) {
      set({
        isLoading: false,
        error: 'Supabase is not configured. Add the project URL and anon key to .env.',
      });
      return;
    }

    if (authInitialized) {
      set({ isLoading: false });
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

    set({ session, isLoading: false, error: null });
    const sessionError = await applySessionSafely(session);
    if (sessionError) {
      set({ error: sessionError });
    }

    client.auth.onAuthStateChange((
      _: AuthChangeEvent,
      nextSession: Session | null,
    ) => {
      set({ session: nextSession, isLoading: false, error: null });
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
      throw new Error('Supabase is not configured.');
    }

    set({ isLoading: true, error: null });
    const { error } = await client.auth.signInWithPassword({ email, password });

    if (error) {
      set({ isLoading: false, error: mapAuthErrorMessage(error.message) });
      throw error;
    }

    set({ isLoading: false, error: null });
  },

  signUp: async (email, password) => {
    const client = getSupabaseClient();

    if (!client) {
      throw new Error('Supabase is not configured.');
    }

    set({ isLoading: true, error: null });
    const { error } = await client.auth.signUp({ email, password });

    if (error) {
      set({ isLoading: false, error: mapAuthErrorMessage(error.message) });
      throw error;
    }

    set({
      isLoading: false,
      error:
        'Conta criada. Se a confirmacao de email estiver ativada no Supabase, abra sua caixa de entrada e confirme antes de entrar.',
    });
  },

  signOut: async () => {
    const client = getSupabaseClient();

    if (!client) {
      setCurrentDatabaseUserId(null);
      useFinanceStore.getState().resetForSession();
      set({ session: null, isLoading: false, error: null });
      return;
    }

    set({ isLoading: true, error: null });
    const { error } = await client.auth.signOut();

    if (error) {
      set({ isLoading: false, error: mapAuthErrorMessage(error.message) });
      throw error;
    }

    set({ session: null, isLoading: false, error: null });
    const sessionError = await applySessionSafely(null);
    if (sessionError) {
      set({ error: sessionError });
    }
  },
}));
