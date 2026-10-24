
import type { ReactNode } from 'react';

import {
  View,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  EduKitColors,
  EduKitRadius,
  EduKitSpacing,
} from './tokens';

type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
};

export function Card({
  children,
  style,
  padding = EduKitSpacing.lg,
}: CardProps) {
  return (
    <View style={[styles.card, { padding }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: EduKitColors.surface,
    borderWidth: 1,
    borderColor: EduKitColors.border,
    borderRadius: EduKitRadius.lg,
    gap: EduKitSpacing.md,
    width: '100%',
    overflow: 'hidden',
  },
});
