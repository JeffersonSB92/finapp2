const colors = {
  brand: {
    black: '#0D0D0D',
    primary: '#D95032',
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
    error: '#C0392B',
  },
  background: {
    primary: '#0D0D0D',
    secondary: '#141414',
    tertiary: '#262626',
  },
  text: {
    primary: '#F2F2F2',
    secondary: '#D9D9D9',
    muted: '#9E9E9E',
    inverse: '#0D0D0D',
  },
  border: {
    subtle: '#262626',
    default: '#404040',
    strong: '#5C5C5C',
  },
  status: {
    success: '#2E8B57',
    error: '#C0392B',
  },
} as const;

const spacing = {
  none: 0,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
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

const radii = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
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
} as const;

export const theme = {
  colors,
  spacing,
  fonts,
  radii,
  shadows,
} as const;

export type AppTheme = typeof theme;

