
import { Platform } from 'react-native';

export const EduKitColors = {
  primary: '#2457C5',
  primaryDark: '#183153',
  primarySoft: '#E5EDFF',
  primarySubtle: '#EEF3FF',

  background: '#F4F7FB',
  surface: '#FFFFFF',
  border: '#E1E8F0',

  text: '#183153',
  textSecondary: '#5B687A',
  textMuted: '#6B7788',

  success: '#218653',
  warning: '#A86608',
  error: '#B42318',
  info: '#2457C5',

  disabled: '#D8DEE8',
  disabledText: '#6B7788',
} as const;

export const EduKitSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const EduKitRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
} as const;

export const EduKitTypography = {
  small: 12,
  body: 14,
  regular: 16,
  subtitle: 21,
  title: 30,
} as const;

export const EduKitLayout = {
  contentMaxWidth: 760,
  screenPadding: Platform.select({
    web: 24,
    default: 16,
  }) ?? 16,
} as const;
