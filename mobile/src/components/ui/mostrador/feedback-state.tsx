
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Colors,
  Fonts,
  Radius,
  Spacing,
} from './tokens';

type FeedbackStateProps = {
  type: 'loading' | 'empty' | 'error';
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

const DEFAULT_CONTENT = {
  loading: {
    title: 'Cargando...',
    message: 'Esperá un momento.',
  },
  empty: {
    title: 'No hay contenido',
    message: 'Todavía no hay elementos para mostrar.',
  },
  error: {
    title: 'Ocurrió un error',
    message: 'No se pudo completar la operación.',
  },
};

export function FeedbackState({
  type,
  title,
  message,
  actionLabel,
  onAction,
}: FeedbackStateProps) {
  const content = DEFAULT_CONTENT[type];

  return (
    <View
      accessibilityRole="summary"
      style={styles.container}
    >
      {type === 'loading' ? (
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          accessibilityLabel="Cargando"
        />
      ) : (
        <View
          style={[
            styles.indicator,
            type === 'error' && styles.errorIndicator,
          ]}
        >
          <Text
            style={[
              styles.indicatorText,
              type === 'error' && styles.errorText,
            ]}
          >
            {type === 'empty' ? '—' : '!'}
          </Text>
        </View>
      )}

      <Text style={styles.title}>{title ?? content.title}</Text>

      <Text style={styles.message}>
        {message ?? content.message}
      </Text>

      {actionLabel && onAction && type !== 'loading' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={({ pressed }) => [
            styles.action,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xxl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
  },
  indicator: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIndicator: {
    backgroundColor: Colors.dangerSoft,
  },
  indicatorText: {
    color: Colors.primary,
    fontSize: 24,
    fontFamily: Fonts.bold,
  },
  errorText: {
    color: Colors.danger,
  },
  title: {
    color: Colors.ink,
    fontSize: 16,
    fontFamily: Fonts.bold,
    textAlign: 'center',
  },
  message: {
    color: Colors.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  action: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Fonts.medium,
  },
  pressed: {
    opacity: 0.8,
  },
});
