import { Platform } from 'react-native';

export const Colors = {
  ink: '#1C1917',
  primary: '#EA580C',
  primarySoft: '#FFEDD5',
  bg: '#FAF7F2',
  surface: '#FFFFFF',
  muted: '#78716C',
  border: '#E7E5E4',
  success: '#16A34A',
  successSoft: '#DCFCE7',
  whatsapp: '#25D366',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 18,
  pill: 999,
} as const;

export const Typography = {
  small: 12,
  body: 14,
  regular: 16,
  subtitle: 20,
  title: 28,
} as const;

// Values match the font names registered with useFonts in the root layout.
export const Fonts = {
  title: 'PlusJakartaSans_800ExtraBold',
  subtitle: 'PlusJakartaSans_700Bold',
  body: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  bold: 'DMSans_700Bold',
} as const;

export const Layout = {
  contentMaxWidth: 760,
  minTouchTarget: 44,
  screenPadding: Platform.select({ web: 24, default: 16 }) ?? 16,
} as const;
