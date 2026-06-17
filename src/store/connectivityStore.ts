import NetInfo from '@react-native-community/netinfo';
import { create } from 'zustand';

interface ConnectivityState {
  isInitialized: boolean;
  isOnline: boolean;
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
}

let connectivitySubscriptionRegistered = false;

function toOnlineState(state: {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}): boolean {
  if (state.isConnected === false) {
    return false;
  }

  if (state.isInternetReachable === false) {
    return false;
  }

  return true;
}

export const useConnectivityStore = create<ConnectivityState>((set) => ({
  isInitialized: false,
  isOnline: true,

  initialize: async () => {
    if (!connectivitySubscriptionRegistered) {
      NetInfo.addEventListener((state) => {
        set({
          isInitialized: true,
          isOnline: toOnlineState(state),
        });
      });
      connectivitySubscriptionRegistered = true;
    }

    const currentState = await NetInfo.fetch();
    set({
      isInitialized: true,
      isOnline: toOnlineState(currentState),
    });
  },

  refresh: async () => {
    const currentState = await NetInfo.fetch();
    set({
      isInitialized: true,
      isOnline: toOnlineState(currentState),
    });
  },
}));
