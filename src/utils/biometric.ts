import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_EMAIL_KEY = 'biometric_email';
const BIOMETRIC_PASSWORD_KEY = 'biometric_password';

export interface BiometricAvailability {
  isAvailable: boolean;
  label: string;
}

export interface StoredBiometricCredentials {
  email: string;
  password: string;
}

function getAuthenticationLabel(
  types: LocalAuthentication.AuthenticationType[],
): string {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'Biometria';
  }

  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'Biometria digital';
  }

  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return 'Biometria';
  }

  return 'Biometria';
}

export async function getBiometricAvailability(): Promise<BiometricAvailability> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  if (!hasHardware || !isEnrolled) {
    return {
      isAvailable: false,
      label: 'Biometria',
    };
  }

  const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

  return {
    isAvailable: true,
    label: getAuthenticationLabel(supportedTypes),
  };
}

export async function requestBiometricAuthentication(
  promptMessage: string,
): Promise<void> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: 'Cancelar',
    fallbackLabel: 'Usar bloqueio do aparelho',
    disableDeviceFallback: false,
  });

  if (!result.success) {
    throw new Error('A autenticação biométrica não foi concluída.');
  }
}

export async function getBiometricLoginEnabled(): Promise<boolean> {
  return (await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY)) === 'true';
}

export async function setBiometricLoginEnabled(enabled: boolean): Promise<void> {
  if (!enabled) {
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
    return;
  }

  await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
}

export async function saveBiometricCredentials(
  email: string,
  password: string,
): Promise<void> {
  await SecureStore.setItemAsync(BIOMETRIC_EMAIL_KEY, email);
  await SecureStore.setItemAsync(BIOMETRIC_PASSWORD_KEY, password);
}

export async function getBiometricCredentials(): Promise<StoredBiometricCredentials | null> {
  const [email, password] = await Promise.all([
    SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY),
    SecureStore.getItemAsync(BIOMETRIC_PASSWORD_KEY),
  ]);

  if (!email || !password) {
    return null;
  }

  return { email, password };
}

export async function updateBiometricCredentialEmail(email: string): Promise<void> {
  const credentials = await getBiometricCredentials();

  if (!credentials) {
    return;
  }

  await saveBiometricCredentials(email, credentials.password);
}

export async function clearBiometricCredentials(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY),
    SecureStore.deleteItemAsync(BIOMETRIC_EMAIL_KEY),
    SecureStore.deleteItemAsync(BIOMETRIC_PASSWORD_KEY),
  ]);
}
