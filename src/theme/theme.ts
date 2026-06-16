const palette = {
  black: '#000000',
  white: '#FFFFFF',
  orange: '#E75235',
  orangePressed: '#C9432B',
  orangeSoft: 'rgba(231, 82, 53, 0.16)',
  green: '#2ECC71',
  greenSoft: 'rgba(46, 204, 113, 0.14)',
  red: '#EF4D43',
  redSoft: 'rgba(239, 77, 67, 0.14)',
  yellow: '#F5B84B',
  yellowSoft: 'rgba(245, 184, 75, 0.14)',
  gray950: '#080C0E',
  gray925: '#0D1114',
  gray900: '#121418',
  gray850: '#181B20',
  gray800: '#20242A',
  gray700: '#2A2F36',
  gray600: '#707780',
  gray500: '#9CA3AF',
  gray400: '#A7ADB5',
  gray300: '#F5F7FA',
} as const;

const colors = {
  palette,
  brand: {
    black: palette.gray950,
    primary: '#D95032',
    primaryPressed: palette.orangePressed,
    primarySoft: 'rgba(217, 80, 50, 0.16)',
    white: '#F2F2F2',
  },
  gray: {
    50: '#F7F7F7',
    100: '#E8E8E8',
    200: '#D9D9D9',
    300: '#BFBFBF',
    400: '#9E9E9E',
    500: '#7A7A7A',
    600: '#5C5C5C',
    700: '#404040',
    800: '#262626',
    900: '#141414',
  },
  feedback: {
    success: '#2E8B57',
    successSoft: palette.greenSoft,
    error: '#C0392B',
    errorSoft: palette.redSoft,
    warning: palette.yellow,
    warningSoft: palette.yellowSoft,
  },
  background: {
    primary: '#0D0D0D',
    secondary: '#141414',
    tertiary: '#262626',
    elevated: palette.gray925,
    surface: palette.gray900,
    surfaceSoft: palette.gray850,
    surfaceMuted: palette.gray800,
    overlay: 'rgba(8, 12, 14, 0.88)',
  },
  text: {
    primary: '#F2F2F2',
    secondary: '#D9D9D9',
    muted: '#9E9E9E',
    inverse: '#0D0D0D',
    tertiary: palette.gray400,
    disabled: palette.gray600,
  },
  border: {
    subtle: '#262626',
    default: '#404040',
    strong: '#5C5C5C',
    soft: 'rgba(255,255,255,0.08)',
  },
  status: {
    success: '#2E8B57',
    successSoft: palette.greenSoft,
    error: '#C0392B',
    errorSoft: palette.redSoft,
    warning: palette.yellow,
    warningSoft: palette.yellowSoft,
    neutral: palette.gray500,
  },
  chart: {
    income: '#2E8B57',
    expense: '#D95032',
    neutral: '#7A7A7A',
  },
} as const;

const spacing = {
  none: 0,
  hairline: 2,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 56,
  screenX: 20,
  screenY: 24,
  bottomSafe: 96,
} as const;

const fonts = {
  family: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
  },
  lineHeight: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    '2xl': 40,
    '3xl': 48,
  },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

const typography = {
  screenTitle: {
    fontFamily: fonts.family.bold,
    fontSize: fonts.size['2xl'],
    lineHeight: fonts.lineHeight['2xl'],
    fontWeight: fonts.weight.bold,
  },
  sectionTitle: {
    fontFamily: fonts.family.semibold,
    fontSize: fonts.size.xl,
    lineHeight: fonts.lineHeight.xl,
    fontWeight: fonts.weight.semibold,
  },
  cardTitle: {
    fontFamily: fonts.family.semibold,
    fontSize: fonts.size.md,
    lineHeight: fonts.lineHeight.md,
    fontWeight: fonts.weight.semibold,
  },
  body: {
    fontFamily: fonts.family.regular,
    fontSize: fonts.size.sm,
    lineHeight: fonts.lineHeight.sm,
    fontWeight: fonts.weight.regular,
  },
  caption: {
    fontFamily: fonts.family.regular,
    fontSize: fonts.size.xs,
    lineHeight: fonts.lineHeight.xs,
    fontWeight: fonts.weight.regular,
  },
  label: {
    fontFamily: fonts.family.medium,
    fontSize: fonts.size.sm,
    lineHeight: fonts.lineHeight.sm,
    fontWeight: fonts.weight.medium,
  },
  amountLarge: {
    fontFamily: fonts.family.bold,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: fonts.weight.bold,
  },
  amountMedium: {
    fontFamily: fonts.family.bold,
    fontSize: fonts.size.xl,
    lineHeight: 30,
    fontWeight: fonts.weight.bold,
  },
} as const;

const radii = {
  none: 0,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  '2xl': 32,
  pill: 999,
} as const;

const borders = {
  width: {
    none: 0,
    hairline: 1,
    thin: 1,
    medium: 2,
  },
} as const;

const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  cardSoft: {
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  floating: {
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 12,
  },
} as const;

const layout = {
  screen: {
    paddingHorizontal: spacing.screenX,
    paddingTop: spacing.lg,
    paddingBottom: spacing.bottomSafe,
    gap: spacing.lg,
  },
  card: {
    padding: spacing.lg,
    gap: spacing.md,
    borderRadius: radii.xl,
  },
  control: {
    minHeight: 48,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
  },
} as const;

export const theme = {
  colors,
  spacing,
  fonts,
  typography,
  radii,
  borders,
  shadows,
  layout,
} as const;

export type AppTheme = typeof theme;
