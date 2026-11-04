import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Layout, Radius } from './tokens';

type ProductCardProps = {
  name: string;
  description?: string;
  price: string;
  imageUrl?: string | null;
  onAdd: () => void;
  onPress?: () => void;
};

const ADD_SIZE = 32;

export function ProductCard({
  name,
  description,
  price,
  imageUrl,
  onAdd,
  onPress,
}: ProductCardProps) {
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ver ${name}`}
        onPress={onPress}
        disabled={!onPress}
        style={styles.content}
      >
        <View style={styles.image}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              accessibilityLabel={name}
              style={styles.fill}
              contentFit="cover"
            />
          ) : (
            <Ionicons name="image-outline" size={32} color={Colors.primary} />
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {description ? (
            <Text style={styles.description} numberOfLines={2}>
              {description}
            </Text>
          ) : null}
          <View style={styles.row}>
            <Text style={styles.price}>{price}</Text>
          </View>
        </View>
      </Pressable>

      {/* Sibling, not a child: a <button> cannot nest inside another <button> on web. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Agregar ${name}`}
        onPress={onAdd}
        hitSlop={(Layout.minTouchTarget - ADD_SIZE) / 2}
        style={styles.add}
      >
        <Ionicons name="add" size={20} color={Colors.surface} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    width: '100%',
  },
  content: { flexDirection: 'row', gap: 14, padding: 12 },
  image: {
    width: 88,
    height: 88,
    borderRadius: Radius.md,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fill: { width: '100%', height: '100%' },
  info: { flex: 1, gap: 4, minWidth: 0 },
  name: { color: Colors.ink, fontFamily: Fonts.subtitle, fontSize: 16 },
  description: { color: Colors.muted, fontFamily: Fonts.body, fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ADD_SIZE,
    marginTop: 'auto',
  },
  price: { color: Colors.primary, fontFamily: Fonts.bold, fontSize: 16 },
  add: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: ADD_SIZE,
    height: ADD_SIZE,
    borderRadius: Radius.pill,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
