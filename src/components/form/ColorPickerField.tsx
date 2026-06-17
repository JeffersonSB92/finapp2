import React, { useEffect, useMemo, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { theme } from '../../theme/theme';
import {
  buildColorSpectrum,
  hexToHsl,
  hslToHex,
  normalizeHexColor,
} from '../../utils/colors';
import { AppButton, AppModalSheet } from '../ui';

const DEFAULT_COLOR = '#D95032';
const QUICK_COLORS = [
  '#D95032',
  '#2E8B57',
  '#3B82F6',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#EF4444',
] as const;
const SLIDER_SEGMENTS = 24;

interface ColorPickerFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
}

interface ColorSliderProps {
  label: string;
  colors: string[];
  value: number;
  onChange: (value: number) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function ColorSlider({
  colors,
  label,
  onChange,
  value,
}: ColorSliderProps): React.JSX.Element {
  const [width, setWidth] = useState(1);

  function updateValue(locationX: number): void {
    const ratio = clamp(locationX / width, 0, 1);
    onChange(ratio);
  }

  return (
    <View style={styles.sliderBlock}>
      <Text style={styles.sliderLabel}>{label}</Text>
      <View
        onLayout={(event) => {
          setWidth(event.nativeEvent.layout.width || 1);
        }}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(event) => updateValue(event.nativeEvent.locationX)}
        onResponderMove={(event) => updateValue(event.nativeEvent.locationX)}
        onStartShouldSetResponder={() => true}
        style={styles.sliderTrack}
      >
        {colors.map((color, index) => (
          <View
            key={`${label}-${index}`}
            style={[styles.sliderSegment, { backgroundColor: color }]}
          />
        ))}
        <View
          pointerEvents="none"
          style={[
            styles.sliderThumb,
            { left: `${value * 100}%` },
          ]}
        />
      </View>
    </View>
  );
}

export function ColorPickerField({
  error,
  hint,
  label,
  onChange,
  value,
}: ColorPickerFieldProps): React.JSX.Element {
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState<string>(normalizeHexColor(value) ?? DEFAULT_COLOR);
  const [hexInput, setHexInput] = useState(normalizeHexColor(value) ?? DEFAULT_COLOR);

  const currentValue = normalizeHexColor(value);
  const currentHsl = hexToHsl(draft) ?? hexToHsl(DEFAULT_COLOR)!;

  useEffect(() => {
    if (!visible) {
      return;
    }

    const nextValue = normalizeHexColor(value) ?? DEFAULT_COLOR;
    setDraft(nextValue);
    setHexInput(nextValue);
  }, [value, visible]);

  const hueColors = useMemo(
    () =>
      buildColorSpectrum(SLIDER_SEGMENTS, (_, ratio) =>
        hslToHex(ratio * 360, 100, 50),
      ),
    [],
  );

  const saturationColors = useMemo(
    () =>
      buildColorSpectrum(SLIDER_SEGMENTS, (_, ratio) =>
        hslToHex(currentHsl.h, ratio * 100, currentHsl.l),
      ),
    [currentHsl.h, currentHsl.l],
  );

  const lightnessColors = useMemo(
    () =>
      buildColorSpectrum(SLIDER_SEGMENTS, (_, ratio) =>
        hslToHex(currentHsl.h, currentHsl.s, ratio * 100),
      ),
    [currentHsl.h, currentHsl.s],
  );

  function updateDraft(nextValue: string): void {
    setDraft(nextValue);
    setHexInput(nextValue);
  }

  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        onPress={() => setVisible(true)}
        style={[styles.trigger, error ? styles.triggerError : null]}
      >
        <View style={styles.triggerContent}>
          <View
            style={[
              styles.swatch,
              { backgroundColor: currentValue ?? theme.colors.background.surfaceSoft },
              !currentValue ? styles.swatchEmpty : null,
            ]}
          />
          <View style={styles.triggerTextWrap}>
            <Text style={styles.triggerText}>
              {currentValue ?? 'Selecionar cor'}
            </Text>
            <Text style={styles.triggerHint}>
              {currentValue
                ? 'Toque para ajustar com precisão'
                : 'Abra a paleta e escolha qualquer tom'}
            </Text>
          </View>
        </View>
        <Feather color={theme.colors.text.muted} name="chevron-down" size={18} />
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!error && hint ? <Text style={styles.hint}>{hint}</Text> : null}

      <AppModalSheet
        onClose={() => setVisible(false)}
        title={label}
        visible={visible}
      >
        <View style={styles.modalPreviewCard}>
          <View style={[styles.modalPreviewSwatch, { backgroundColor: draft }]} />
          <View style={styles.modalPreviewText}>
            <Text style={styles.modalPreviewLabel}>Cor selecionada</Text>
            <Text style={styles.modalPreviewValue}>{draft}</Text>
          </View>
        </View>

        <View style={styles.quickColorsRow}>
          {QUICK_COLORS.map((quickColor) => (
            <Pressable
              key={quickColor}
              onPress={() => updateDraft(quickColor)}
              style={[
                styles.quickColor,
                { backgroundColor: quickColor },
                draft === quickColor ? styles.quickColorSelected : null,
              ]}
            />
          ))}
        </View>

        <View style={styles.manualInputBlock}>
          <Text style={styles.manualInputLabel}>Hexadecimal</Text>
          <TextInput
            autoCapitalize="characters"
            autoCorrect={false}
            onChangeText={(nextValue) => {
              setHexInput(nextValue);
              const normalized = normalizeHexColor(nextValue);

              if (normalized) {
                setDraft(normalized);
              }
            }}
            placeholder="#D95032"
            placeholderTextColor={theme.colors.text.muted}
            style={styles.manualInput}
            value={hexInput}
          />
          <Text style={styles.manualInputHint}>
            Digite um valor exato em `#RRGGBB` ou ajuste os controles abaixo.
          </Text>
        </View>

        <ColorSlider
          colors={hueColors}
          label={`Matiz: ${Math.round(currentHsl.h)}`}
          onChange={(ratio) => updateDraft(hslToHex(ratio * 360, currentHsl.s, currentHsl.l))}
          value={currentHsl.h / 360}
        />

        <ColorSlider
          colors={saturationColors}
          label={`Saturação: ${Math.round(currentHsl.s)}%`}
          onChange={(ratio) => updateDraft(hslToHex(currentHsl.h, ratio * 100, currentHsl.l))}
          value={currentHsl.s / 100}
        />

        <ColorSlider
          colors={lightnessColors}
          label={`Luminosidade: ${Math.round(currentHsl.l)}%`}
          onChange={(ratio) => updateDraft(hslToHex(currentHsl.h, currentHsl.s, ratio * 100))}
          value={currentHsl.l / 100}
        />

        <View style={styles.actionsRow}>
          <AppButton
            label="Limpar"
            onPress={() => {
              onChange('');
              setVisible(false);
            }}
            variant="secondary"
          />
          <AppButton
            label="Aplicar"
            onPress={() => {
              onChange(draft);
              setVisible(false);
            }}
          />
        </View>
      </AppModalSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldContainer: {
    gap: theme.spacing.xs,
  },
  label: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  trigger: {
    alignItems: 'center',
    backgroundColor: theme.colors.background.surface,
    borderColor: theme.colors.border.soft,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 58,
    paddingHorizontal: theme.spacing.md,
  },
  triggerError: {
    borderColor: theme.colors.status.error,
  },
  triggerContent: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    minWidth: 0,
  },
  swatch: {
    borderColor: theme.colors.border.soft,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    height: 26,
    width: 26,
  },
  swatchEmpty: {
    backgroundColor: theme.colors.background.surfaceSoft,
  },
  triggerTextWrap: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  triggerText: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  triggerHint: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.xs,
    lineHeight: theme.fonts.lineHeight.xs,
  },
  error: {
    color: theme.colors.status.error,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  hint: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  modalPreviewCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.background.surface,
    borderColor: theme.colors.border.soft,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  modalPreviewSwatch: {
    borderRadius: theme.radii.lg,
    height: 56,
    width: 56,
  },
  modalPreviewText: {
    flex: 1,
    gap: 2,
  },
  modalPreviewLabel: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.xs,
    lineHeight: theme.fonts.lineHeight.xs,
    textTransform: 'uppercase',
  },
  modalPreviewValue: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.lg,
    lineHeight: theme.fonts.lineHeight.lg,
  },
  quickColorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  quickColor: {
    borderColor: theme.colors.border.soft,
    borderRadius: theme.radii.pill,
    borderWidth: 2,
    height: 28,
    width: 28,
  },
  quickColorSelected: {
    borderColor: theme.colors.brand.white,
  },
  manualInputBlock: {
    gap: theme.spacing.xs,
  },
  manualInputLabel: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  manualInput: {
    backgroundColor: theme.colors.background.surface,
    borderColor: theme.colors.border.soft,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
    minHeight: 50,
    paddingHorizontal: theme.spacing.md,
  },
  manualInputHint: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.xs,
    lineHeight: theme.fonts.lineHeight.xs,
  },
  sliderBlock: {
    gap: theme.spacing.xs,
  },
  sliderLabel: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  sliderTrack: {
    alignItems: 'center',
    borderColor: theme.colors.border.soft,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    height: 22,
    overflow: 'hidden',
    position: 'relative',
  },
  sliderSegment: {
    flex: 1,
    height: '100%',
  },
  sliderThumb: {
    backgroundColor: theme.colors.brand.white,
    borderColor: theme.colors.background.primary,
    borderRadius: theme.radii.pill,
    borderWidth: 2,
    height: 22,
    marginLeft: -11,
    position: 'absolute',
    top: -1,
    width: 22,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'flex-end',
    marginTop: theme.spacing.sm,
  },
});
