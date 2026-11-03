import { Pressable, StyleSheet, Text } from 'react-native';

import { Colors, Fonts, Layout, Radius, Spacing } from './tokens';

type ChipProps = {
  label: string;
  active?: boolean;
  onPress: () => void;
};

export function Chip({ label, active = false, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, active && styles.active]}
    >
      <Text style={[styles.text, active && styles.activeText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: Layout.minTouchTarget,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  text: { color: Colors.ink, fontFamily: Fonts.medium, fontSize: 14 },
  activeText: { color: Colors.surface },
});
