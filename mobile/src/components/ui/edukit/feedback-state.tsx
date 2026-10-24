
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  EduKitColors,
  EduKitRadius,
  EduKitSpacing,
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
    title: 'CARGANDO...',
    message: 'ESPERÁ UN MOMENTO.',
  },
  empty: {
    title: 'NO HAY CONTENIDO',
    message: 'TODAVÍA NO HAY ELEMENTOS PARA MOSTRAR.',
  },
  error: {
    title: 'OCURRIÓ UN ERROR',
    message: 'NO SE PUDO COMPLETAR LA OPERACIÓN.',
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
          color={EduKitColors.primary}
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
    gap: EduKitSpacing.md,
    padding: EduKitSpacing.xxl,
    backgroundColor: EduKitColors.surface,
    borderWidth: 1,
    borderColor: EduKitColors.border,
    borderRadius: EduKitRadius.lg,
  },
  indicator: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: EduKitColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIndicator: {
    backgroundColor: '#FEE4E2',
  },
  indicatorText: {
    color: EduKitColors.primary,
    fontSize: 24,
    fontWeight: '700',
  },
  errorText: {
    color: EduKitColors.error,
  },
  title: {
    color: EduKitColors.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    color: EduKitColors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  action: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: EduKitSpacing.lg,
    borderRadius: EduKitRadius.md,
    backgroundColor: EduKitColors.primary,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
  },
});
