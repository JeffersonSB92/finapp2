import 'react-native-url-polyfill/auto';

import { AppState, Platform } from 'react-native';
import { createClient, processLock, SupabaseClient } from '@supabase/supabase-js';

import 'expo-sqlite/localStorage/install';

import { getSupabaseConfig } from './config';

let client: SupabaseClient | null = null;
let appStateSubscriptionRegistered = false;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();

  if (!config) {
    return null;
  }

  if (!client) {
    client = createClient(config.url, config.anonKey, {
      auth: {
        storage: localStorage,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        persistSession: true,
        lock: processLock,
      },
    });

    if (!appStateSubscriptionRegistered && Platform.OS !== 'web') {
      AppState.addEventListener('change', (state) => {
        if (!client) {
          return;
        }

        if (state === 'active') {
          client.auth.startAutoRefresh();
        } else {
          client.auth.stopAutoRefresh();
        }
      });
      appStateSubscriptionRegistered = true;
    }
  }

  return client;
}
