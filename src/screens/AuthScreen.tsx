import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { FormField } from '../components/form';
import { useAuthStore } from '../store/authStore';
import { theme } from '../theme/theme';

type AuthMode = 'sign-in' | 'sign-up';

function getTitle(mode: AuthMode): string {
  return mode === 'sign-in' ? 'Entrar na conta' : 'Criar conta';
}

function getActionLabel(mode: AuthMode): string {
  return mode === 'sign-in' ? 'Entrar' : 'Cadastrar';
}

export function AuthScreen(): React.JSX.Element {
  const signIn = useAuthStore((state) => state.signIn);
  const signUp = useAuthStore((state) => state.signUp);
  const isLoading = useAuthStore((state) => state.isLoading);
  const storeError = useAuthStore((state) => state.error);

  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const helperText = useMemo(() => {
    if (mode === 'sign-in') {
      return 'Entre com email e senha para sincronizar seus dados com isolamento por usuario.';
    }

    return 'Crie uma conta para ativar sincronizacao segura entre dispositivos.';
  }, [mode]);

  async function handleSubmit(): Promise<void> {
    if (!email.trim() || !password.trim()) {
      setLocalError('Preencha email e senha.');
      return;
    }

    if (password.trim().length < 6) {
      setLocalError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    setLocalError(null);

    try {
      if (mode === 'sign-in') {
        await signIn(email.trim(), password);
        return;
      }

      await signUp(email.trim(), password);
    } catch {
      return;
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Supabase Auth</Text>
        <Text style={styles.title}>{getTitle(mode)}</Text>
        <Text style={styles.subtitle}>{helperText}</Text>

        <View style={styles.form}>
          <FormField
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            label="Email"
            onChangeText={setEmail}
            placeholder="voce@exemplo.com"
            value={email}
          />
          <FormField
            autoCapitalize="none"
            autoComplete="password"
            label="Senha"
            onChangeText={setPassword}
            placeholder="Sua senha"
            secureTextEntry
            value={password}
          />
        </View>

        {localError ? <Text style={styles.error}>{localError}</Text> : null}
        {!localError && storeError ? <Text style={styles.error}>{storeError}</Text> : null}

        <Pressable
          disabled={isLoading}
          onPress={() => {
            void handleSubmit();
          }}
          style={[styles.primaryButton, isLoading ? styles.buttonDisabled : null]}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.colors.brand.white} />
          ) : (
            <Text style={styles.primaryButtonText}>{getActionLabel(mode)}</Text>
          )}
        </Pressable>

        <Pressable
          disabled={isLoading}
          onPress={() => {
            setLocalError(null);
            setMode((current) => (current === 'sign-in' ? 'sign-up' : 'sign-in'));
          }}
          style={styles.secondaryAction}
        >
          <Text style={styles.secondaryActionText}>
            {mode === 'sign-in'
              ? 'Nao tem conta? Criar agora'
              : 'Ja tem conta? Fazer login'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  card: {
    ...theme.shadows.card,
    backgroundColor: theme.colors.background.secondary,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    gap: theme.spacing.md,
    maxWidth: 440,
    padding: theme.spacing.xl,
    width: '100%',
  },
  eyebrow: {
    color: theme.colors.brand.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size['2xl'],
    lineHeight: theme.fonts.lineHeight['2xl'],
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  form: {
    gap: theme.spacing.md,
  },
  error: {
    color: theme.colors.status.error,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.brand.primary,
    borderRadius: theme.radii.pill,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: theme.spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: theme.colors.brand.white,
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  secondaryAction: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  secondaryActionText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
});
