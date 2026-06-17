import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton, AppCard } from '../components';
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
  const pendingInviteToken = useAuthStore((state) => state.pendingInviteToken);
  const setPendingInviteToken = useAuthStore((state) => state.setPendingInviteToken);
  const clearPendingInvite = useAuthStore((state) => state.clearPendingInvite);
  const isLoading = useAuthStore((state) => state.isLoading);
  const storeError = useAuthStore((state) => state.error);

  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteInput, setInviteInput] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const helperText = useMemo(() => {
    if (mode === 'sign-in') {
      return pendingInviteToken
        ? 'Entre com sua conta para aceitar o convite e acessar o espaco financeiro compartilhado.'
        : 'Entre com e-mail e senha para acessar seu espaco financeiro e sincronizar seus dados.';
    }

    return pendingInviteToken
      ? 'Crie sua conta para aceitar o convite e entrar no espaco financeiro compartilhado.'
      : 'Crie uma conta para ativar sincronização segura entre dispositivos.';
  }, [mode, pendingInviteToken]);

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
      <AppCard style={styles.card}>
        <Text style={styles.eyebrow}>Supabase Auth</Text>
        <Text style={styles.title}>{getTitle(mode)}</Text>
        <Text style={styles.subtitle}>{helperText}</Text>

        {pendingInviteToken ? (
          <View style={styles.inviteBanner}>
            <Text style={styles.inviteBannerTitle}>Convite detectado</Text>
            <Text style={styles.inviteBannerText}>
              Depois do login ou cadastro, sua conta sera vinculada ao espaco compartilhado do proprietario.
            </Text>
            <AppButton
              label="Remover convite"
              onPress={clearPendingInvite}
              size="sm"
              variant="ghost"
            />
          </View>
        ) : null}

        <View style={styles.form}>
          <FormField
            autoCapitalize="none"
            label="Link ou token de convite"
            onChangeText={(value) => {
              setInviteInput(value);
              setPendingInviteToken(value);
            }}
            placeholder="finapp://invite?token=..."
            value={inviteInput}
          />
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

        <AppButton
          label={getActionLabel(mode)}
          loading={isLoading}
          onPress={() => {
            void handleSubmit();
          }}
        />

        <AppButton
          disabled={isLoading}
          label={
            mode === 'sign-in'
              ? 'Não tem conta? Criar agora'
              : 'Já tem conta? Fazer login'
          }
          onPress={() => {
            setLocalError(null);
            setMode((current) => (current === 'sign-in' ? 'sign-up' : 'sign-in'));
          }}
          size="sm"
          style={styles.secondaryAction}
          variant="ghost"
        />
      </AppCard>
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
    gap: theme.spacing.md,
    maxWidth: 440,
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
  inviteBanner: {
    backgroundColor: theme.colors.brand.primarySoft,
    borderColor: theme.colors.brand.primary,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  inviteBannerTitle: {
    color: theme.colors.brand.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
    textTransform: 'uppercase',
  },
  inviteBannerText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
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
  secondaryAction: {
    alignSelf: 'center',
  },
});
