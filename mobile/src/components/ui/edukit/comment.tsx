
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { EduKitColors, EduKitRadius, EduKitSpacing } from './tokens';

type CommentProps = {
  author: string;
  message: string;
  date?: string;
  style?: StyleProp<ViewStyle>;
};

export function Comment({
  author,
  message,
  date,
  style,
}: CommentProps) {
  const initial = author.trim().charAt(0).toUpperCase() || '?';

  return (
    <View style={[styles.container, style]}>
      <View style={styles.avatar}>
        <Text style={styles.initial}>{initial}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.author}>{author}</Text>
          {date ? <Text style={styles.date}>{date}</Text> : null}
        </View>

        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: EduKitSpacing.md,
    padding: EduKitSpacing.lg,
    backgroundColor: EduKitColors.surface,
    borderWidth: 1,
    borderColor: EduKitColors.border,
    borderRadius: EduKitRadius.lg,
    width: '100%',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: EduKitColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: EduKitColors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    gap: EduKitSpacing.xs,
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: EduKitSpacing.xs,
  },
  author: {
    color: EduKitColors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  date: {
    color: EduKitColors.textMuted,
    fontSize: 12,
  },
  message: {
    color: EduKitColors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
});
