
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { EduKitColors, EduKitRadius, EduKitSpacing } from './tokens';

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

export function TextField({
  label,
  error,
  containerStyle,
  inputStyle,
  editable = true,
  accessibilityLabel,
  ...inputProps
}: TextFieldProps) {
  const hasError = Boolean(error);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={styles.label}>{label}</Text>
      ) : null}

      <TextInput
        {...inputProps}
        editable={editable}
        accessibilityLabel={accessibilityLabel ?? label ?? inputProps.placeholder}
        accessibilityState={{ disabled: !editable }}
        placeholderTextColor={EduKitColors.textMuted}
        style={[
          styles.input,
          hasError && styles.inputError,
          !editable && styles.inputDisabled,
          inputStyle,
        ]}
      />

      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: EduKitSpacing.xs,
  },
  label: {
    color: EduKitColors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: EduKitColors.border,
    borderRadius: EduKitRadius.md,
    backgroundColor: EduKitColors.surface,
    color: EduKitColors.text,
    fontSize: 16,
    paddingHorizontal: EduKitSpacing.lg,
    paddingVertical: EduKitSpacing.md,
  },
  inputError: {
    borderColor: EduKitColors.error,
  },
  inputDisabled: {
    backgroundColor: EduKitColors.background,
    opacity: 0.65,
  },
  error: {
    color: EduKitColors.error,
    fontSize: 12,
  },
});
