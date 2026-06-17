import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ColorPickerField, FormField } from '../components/form';
import { AppButton, AppCard, EmptyState } from '../components/ui';
import { useFinanceStore } from '../store';
import { useAuthStore } from '../store/authStore';
import { theme } from '../theme/theme';

interface PersonFormValues {
  name: string;
  color: string;
}

interface PersonFormErrors {
  name?: string;
}

function validate(values: PersonFormValues): PersonFormErrors {
  const errors: PersonFormErrors = {};

  if (!values.name.trim()) {
    errors.name = 'Informe o nome da pessoa.';
  }

  return errors;
}

export function PeopleScreen(): React.JSX.Element {
  const initialize = useFinanceStore((state) => state.initialize);
  const people = useFinanceStore((state) => state.people);
  const addPerson = useFinanceStore((state) => state.addPerson);
  const removePerson = useFinanceStore((state) => state.removePerson);
  const isLoading = useFinanceStore((state) => state.isLoading);
  const storeError = useFinanceStore((state) => state.error);
  const session = useAuthStore((state) => state.session);

  const [values, setValues] = useState<PersonFormValues>({
    name: '',
    color: '',
  });
  const [errors, setErrors] = useState<PersonFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const activePeople = useMemo(
    () => people.filter((person) => person.is_active),
    [people],
  );

  async function handleSubmit(): Promise<void> {
    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await addPerson({
        name: values.name.trim(),
        color: values.color.trim() || null,
        is_active: true,
      });
      setValues({ name: '', color: '' });
      setErrors({});
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : storeError);
    } finally {
      setIsSubmitting(false);
    }
  }

  function confirmRemove(id: number, name: string): void {
    Alert.alert(
      'Remover pessoa',
      `Remover ${name}? Se essa pessoa estiver vinculada a contas ou transações, a remoção será bloqueada.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            void handleRemove(id);
          },
        },
      ],
    );
  }

  async function handleRemove(id: number): Promise<void> {
    setRemovingId(id);
    setSubmitError(null);

    try {
      await removePerson(id);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : storeError);
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Pessoas</Text>
        <Text style={styles.title}>Quem usa este controle financeiro</Text>
        <Text style={styles.subtitle}>
          Cadastre cada pessoa para identificar de quem foi o gasto e quem é o titular da conta.
        </Text>
      </View>

      <AppCard style={styles.formCard}>
        <FormField
          error={errors.name}
          label="Nome"
          onChangeText={(name) => setValues((current) => ({ ...current, name }))}
          placeholder="Ex.: Jefferson"
          value={values.name}
        />

        <ColorPickerField
          hint="Opcional"
          label="Cor"
          onChange={(color) => setValues((current) => ({ ...current, color }))}
          value={values.color}
        />

        <AppButton
          disabled={isSubmitting}
          label="Adicionar pessoa"
          loading={isSubmitting}
          onPress={() => {
            void handleSubmit();
          }}
        />

        {submitError ? <Text style={styles.error}>{submitError}</Text> : null}
      </AppCard>

      {isLoading ? (
        <AppCard style={styles.feedbackCard}>
          <ActivityIndicator color={theme.colors.brand.primary} />
          <Text style={styles.feedbackText}>Carregando pessoas...</Text>
        </AppCard>
      ) : null}

      {!isLoading ? (
        <View style={styles.list}>
          {activePeople.length === 0 ? (
            <EmptyState
              description="Adicione pelo menos uma pessoa para começar a marcar titularidade de contas e responsabilidade das transações."
              eyebrow="Sem pessoas"
              icon="users"
              title="Nenhuma pessoa cadastrada"
            />
          ) : (
            activePeople.map((person) => (
              <AppCard key={person.id} style={styles.personCard}>
                <View style={styles.personInfo}>
                  <View
                    style={[
                      styles.personBadge,
                      person.color ? { backgroundColor: person.color } : null,
                    ]}
                  >
                    <Text style={styles.personBadgeText}>
                      {person.name.trim().slice(0, 2).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.personText}>
                    <Text style={styles.personName}>{person.name}</Text>
                    <Text style={styles.personMeta}>
                      {person.auth_user_id === session?.user.id
                        ? 'Este perfil representa você no espaço compartilhado'
                        : 'Disponível para contas e transações'}
                    </Text>
                  </View>
                </View>

                {person.auth_user_id ? (
                  <Text style={styles.linkedBadge}>Vinculado</Text>
                ) : (
                  <AppButton
                    disabled={removingId === person.id}
                    label={removingId === person.id ? 'Removendo...' : 'Remover'}
                    onPress={() => confirmRemove(person.id, person.name)}
                    size="sm"
                    variant="secondary"
                  />
                )}
              </AppCard>
            ))
          )}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
    flex: 1,
  },
  content: {
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.bottomSafe + theme.spacing['3xl'],
  },
  header: {
    gap: theme.spacing.xs,
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
  formCard: {
    gap: theme.spacing.md,
  },
  error: {
    color: theme.colors.status.error,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  feedbackCard: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  feedbackText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  list: {
    gap: theme.spacing.md,
  },
  personCard: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  personInfo: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    minWidth: 0,
  },
  personBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.brand.primary,
    borderRadius: theme.radii.lg,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  personBadgeText: {
    color: theme.colors.brand.white,
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  personText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  personName: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  personMeta: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  linkedBadge: {
    color: theme.colors.brand.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.xs,
    lineHeight: theme.fonts.lineHeight.xs,
    textTransform: 'uppercase',
  },
});
