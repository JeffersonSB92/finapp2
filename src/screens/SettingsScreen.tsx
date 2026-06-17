import React, { useEffect, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { FormField } from '../components/form';
import { AppButton, AppCard } from '../components/ui';
import { isSupabaseConfigured } from '../sync';
import { useConnectivityStore, useFinanceStore } from '../store';
import { UserProfile, useAuthStore } from '../store/authStore';
import { theme } from '../theme/theme';

interface SettingsFormValues {
  email: string;
  fullName: string;
  displayName: string;
}

interface SettingsFormErrors {
  email?: string;
  fullName?: string;
  displayName?: string;
}

interface PreferenceRowProps {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  description: string;
  value?: string;
  onPress?: () => void;
  tone?: 'default' | 'danger';
}

interface SettingsScreenProps {
  onOpenPeople?: () => void;
}

function validate(values: SettingsFormValues): SettingsFormErrors {
  const errors: SettingsFormErrors = {};

  if (!values.email.trim()) {
    errors.email = 'Informe seu e-mail.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Informe um e-mail válido.';
  }

  if (!values.fullName.trim()) {
    errors.fullName = 'Informe seu nome completo.';
  }

  if (!values.displayName.trim()) {
    errors.displayName = 'Informe o nome que deve aparecer na dashboard.';
  }

  return errors;
}

function toFormValues(profile: UserProfile | null): SettingsFormValues {
  return {
    email: profile?.email ?? '',
    fullName: profile?.fullName ?? '',
    displayName: profile?.displayName ?? '',
  };
}

function SectionTitle({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function PreferenceRow({
  description,
  icon,
  onPress,
  title,
  tone = 'default',
  value,
}: PreferenceRowProps): React.JSX.Element {
  const content = (
    <View style={styles.preferenceRow}>
      <View
        style={[
          styles.preferenceIcon,
          tone === 'danger' ? styles.preferenceIconDanger : null,
        ]}
      >
        <Feather
          color={tone === 'danger' ? theme.colors.status.error : theme.colors.brand.primary}
          name={icon}
          size={16}
        />
      </View>

      <View style={styles.preferenceContent}>
        <View style={styles.preferenceTopRow}>
          <Text
            style={[
              styles.preferenceTitle,
              tone === 'danger' ? styles.preferenceTitleDanger : null,
            ]}
          >
            {title}
          </Text>
          {value ? <Text style={styles.preferenceValue}>{value}</Text> : null}
        </View>
        <Text style={styles.preferenceDescription}>{description}</Text>
      </View>

      {onPress ? (
        <Feather color={theme.colors.text.muted} name="chevron-right" size={18} />
      ) : null}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable onPress={onPress} style={styles.preferencePressable}>
      {content}
    </Pressable>
  );
}

export function SettingsScreen({
  onOpenPeople,
}: SettingsScreenProps): React.JSX.Element {
  const profile = useAuthStore((state) => state.profile);
  const session = useAuthStore((state) => state.session);
  const household = useAuthStore((state) => state.household);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const signOut = useAuthStore((state) => state.signOut);
  const createInviteLink = useAuthStore((state) => state.createInviteLink);
  const isBiometricAvailable = useAuthStore((state) => state.isBiometricAvailable);
  const biometricLabel = useAuthStore((state) => state.biometricLabel);
  const isBiometricEnabled = useAuthStore((state) => state.isBiometricEnabled);
  const isBiometricProcessing = useAuthStore((state) => state.isBiometricProcessing);
  const disableBiometricLogin = useAuthStore((state) => state.disableBiometricLogin);
  const isProfileSaving = useAuthStore((state) => state.isProfileSaving);
  const isCreatingInvite = useAuthStore((state) => state.isCreatingInvite);
  const storeError = useAuthStore((state) => state.error);
  const isOnline = useConnectivityStore((state) => state.isOnline);
  const pendingSyncCount = useFinanceStore((state) => state.pendingSyncCount);
  const lastSyncAt = useFinanceStore((state) => state.lastSyncAt);
  const isSyncing = useFinanceStore((state) => state.isSyncing);
  const syncError = useFinanceStore((state) => state.syncError);
  const syncNow = useFinanceStore((state) => state.syncNow);

  const [values, setValues] = useState<SettingsFormValues>(toFormValues(profile));
  const [errors, setErrors] = useState<SettingsFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    setValues(toFormValues(profile));
  }, [profile]);

  async function handleSubmit(): Promise<void> {
    const currentEmail = profile?.email.trim() ?? '';
    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitError(null);
    setSuccessMessage(null);

    try {
      await updateProfile({
        email: values.email.trim(),
        fullName: values.fullName.trim(),
        displayName: values.displayName.trim(),
      });
      setSuccessMessage(
        values.email.trim() !== currentEmail
          ? 'Perfil salvo. Se o Supabase exigir confirmação para trocar o e-mail, confirme na sua caixa de entrada.'
          : 'Perfil salvo com sucesso.',
      );
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : storeError);
    }
  }

  async function handleSignOut(): Promise<void> {
    setIsSigningOut(true);

    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  }

  async function handleShareInvite(): Promise<void> {
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      const inviteLink = await createInviteLink();

      await Share.share({
        message: `Use este link para entrar no meu espaco financeiro no FinApp: ${inviteLink}`,
      });

      setSuccessMessage('Convite gerado. Compartilhe o link com a pessoa que vai entrar na sua conta compartilhada.');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : storeError);
    }
  }

  async function handleDisableBiometrics(): Promise<void> {
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      await disableBiometricLogin();
      setSuccessMessage('Biometria desativada neste aparelho.');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : storeError);
    }
  }

  async function handleSyncNow(): Promise<void> {
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      await syncNow();
      setSuccessMessage('Sincronização concluída.');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : syncError);
    }
  }

  const syncEnabled = isSupabaseConfigured();
  const syncStatusValue = !syncEnabled
    ? 'Local'
    : isOnline
      ? isSyncing
        ? 'Sincronizando'
        : 'Online'
      : 'Offline';
  const lastSyncLabel = lastSyncAt
    ? new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(lastSyncAt))
    : 'Ainda não sincronizou';

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Mais</Text>
        <Text style={styles.title}>Ajustes e configurações</Text>
        <Text style={styles.subtitle}>
          Atualize seu perfil, acompanhe o estado da conta e revise preferências do app.
        </Text>
      </View>

      <SectionTitle>Perfil</SectionTitle>
      <AppCard style={styles.sectionCard}>
        <FormField
          error={errors.fullName}
          label="Nome completo"
          onChangeText={(fullName) => setValues((current) => ({ ...current, fullName }))}
          placeholder="Seu nome completo"
          value={values.fullName}
        />

        <FormField
          error={errors.displayName}
          hint="Este nome substitui o e-mail no topo da dashboard."
          label="Nome de exibição"
          onChangeText={(displayName) =>
            setValues((current) => ({ ...current, displayName }))
          }
          placeholder="Como você quer aparecer no app"
          value={values.displayName}
        />

        <FormField
          autoCapitalize="none"
          error={errors.email}
          keyboardType="email-address"
          label="Email"
          onChangeText={(email) => setValues((current) => ({ ...current, email }))}
          placeholder="voce@exemplo.com"
          value={values.email}
        />

        <AppButton
          disabled={isProfileSaving}
          label="Salvar perfil"
          loading={isProfileSaving}
          onPress={() => {
            void handleSubmit();
          }}
          style={styles.submitButton}
        />

        {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}
        {submitError ? <Text style={styles.error}>{submitError}</Text> : null}
      </AppCard>

      <SectionTitle>Notificações</SectionTitle>
      <AppCard style={styles.preferenceCard}>
        <PreferenceRow
          description="O app ainda não possui preferências de alerta configuráveis nesta versão, então o comportamento atual permanece inalterado."
          icon="bell"
          title="Central de alertas"
          value="Padrão"
        />
      </AppCard>

      <SectionTitle>Segurança</SectionTitle>
      <AppCard style={styles.sectionCard}>
        <PreferenceRow
          description={
            session?.user.email
              ? `Sessão autenticada com ${session.user.email}. O acesso continua sendo controlado pela conta conectada no Supabase.`
              : 'Nenhuma sessão ativa no momento.'
          }
          icon="shield"
          title="Sessão e acesso"
          value={session ? 'Ativa' : 'Inativa'}
        />

        <PreferenceRow
          description={
            isBiometricAvailable
              ? isBiometricEnabled
                ? `${biometricLabel} está ativa neste aparelho para desbloqueio e login rápido.`
                : `${biometricLabel} está disponível, mas ainda não foi configurada.`
              : 'Nenhuma biometria cadastrada ou disponível neste aparelho.'
          }
          icon="smartphone"
          title="Biometria"
          value={isBiometricEnabled ? 'Ativa' : 'Inativa'}
        />

        {isBiometricEnabled ? (
          <AppButton
            disabled={isBiometricProcessing}
            label={isBiometricProcessing ? 'Desativando...' : 'Desativar biometria'}
            onPress={() => {
              void handleDisableBiometrics();
            }}
            variant="secondary"
          />
        ) : (
          <Text style={styles.memberHint}>
            Para ativar a biometria, saia e entre novamente marcando a opção na tela de login.
          </Text>
        )}
      </AppCard>

      <SectionTitle>Espaço compartilhado</SectionTitle>
      <AppCard style={styles.sectionCard}>
        <PreferenceRow
          description={
            household
              ? `Você está usando o espaço "${household.name}". ${household.role === 'owner' ? 'Você é o proprietário e pode convidar outras pessoas.' : 'Você participa como membro convidado.'}`
              : 'Ainda não foi possível identificar o espaço financeiro desta conta.'
          }
          icon="home"
          title="Household ativo"
          value={household ? household.role : 'Indefinido'}
        />

        {household?.role === 'owner' ? (
          <AppButton
            disabled={isCreatingInvite}
            label="Gerar link de convite"
            loading={isCreatingInvite}
            onPress={() => {
              void handleShareInvite();
            }}
          />
        ) : (
          <Text style={styles.memberHint}>
            Somente o proprietário pode gerar novos links de convite.
          </Text>
        )}
      </AppCard>

      <SectionTitle>Backup e dados</SectionTitle>
      <AppCard style={styles.sectionCard}>
        <PreferenceRow
          description={
            syncEnabled
              ? isOnline
                ? 'O app salva primeiro no SQLite e sincroniza com o Supabase assim que houver conexão.'
                : 'Você está offline. O app continua salvando localmente e enviará a fila quando a internet voltar.'
              : 'Os dados continuam salvos localmente em SQLite até que as variáveis do Supabase sejam configuradas.'
          }
          icon="database"
          title="Armazenamento"
          value={syncEnabled ? 'Sync habilitado' : 'Somente local'}
        />
        <PreferenceRow
          description={`Fila pendente: ${pendingSyncCount} item${pendingSyncCount === 1 ? '' : 'ns'}. Última sync: ${lastSyncLabel}.`}
          icon="refresh-cw"
          title="Estado da sincronização"
          value={syncStatusValue}
        />
        {syncEnabled ? (
          <AppButton
            disabled={isSyncing || !isOnline}
            label={isSyncing ? 'Sincronizando...' : 'Sincronizar agora'}
            onPress={() => {
              void handleSyncNow();
            }}
            variant="secondary"
          />
        ) : null}
        <PreferenceRow
          description="Cadastre quem participa do controle financeiro para identificar titularidade das contas e responsabilidade das movimentações."
          icon="users"
          onPress={onOpenPeople}
          title="Pessoas"
          value="Gerenciar"
        />
      </AppCard>

      <SectionTitle>Sobre o app</SectionTitle>
      <AppCard style={styles.preferenceCard}>
        <PreferenceRow
          description="FinApp mantém tema escuro, persistência local e a mesma base funcional do fluxo financeiro atual."
          icon="info"
          title="Visão geral"
          value="FinApp"
        />
      </AppCard>

      <SectionTitle>Sair</SectionTitle>
      <AppCard style={styles.preferenceCard}>
        <PreferenceRow
          description="Encerra a sessão atual sem alterar seus dados locais ou a configuração existente."
          icon="log-out"
          onPress={() => {
            void handleSignOut();
          }}
          title={isSigningOut ? 'Saindo...' : 'Sair da conta'}
          tone="danger"
        />
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
  },
  content: {
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.bottomSafe + theme.spacing['2xl'],
  },
  header: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
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
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  sectionTitle: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.xs,
    lineHeight: theme.fonts.lineHeight.xs,
    marginTop: theme.spacing.sm,
    textTransform: 'uppercase',
  },
  sectionCard: {
    gap: theme.spacing.md,
  },
  preferenceCard: {
    gap: theme.spacing.none,
    paddingVertical: theme.spacing.sm,
  },
  submitButton: {
    marginTop: theme.spacing.xs,
  },
  success: {
    color: theme.colors.status.success,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  error: {
    color: theme.colors.status.error,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  memberHint: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  preferencePressable: {
    borderRadius: theme.radii.lg,
  },
  preferenceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    minHeight: 68,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  preferenceIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.brand.primarySoft,
    borderRadius: theme.radii.lg,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  preferenceIconDanger: {
    backgroundColor: theme.colors.status.errorSoft,
  },
  preferenceContent: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  preferenceTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  preferenceTitle: {
    color: theme.colors.text.primary,
    flex: 1,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  preferenceTitleDanger: {
    color: theme.colors.status.error,
  },
  preferenceValue: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.xs,
    lineHeight: theme.fonts.lineHeight.xs,
    textTransform: 'uppercase',
  },
  preferenceDescription: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
});
