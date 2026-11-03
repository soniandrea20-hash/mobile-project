import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/mostrador/button';
import { FeedbackState } from '@/components/ui/mostrador/feedback-state';
import { ListRow } from '@/components/ui/mostrador/list-row';
import { TextField } from '@/components/ui/mostrador/text-field';
import { TopBar } from '@/components/ui/mostrador/top-bar';
import { narrowBlock, useWide, wideGrid } from '@/components/ui/mostrador/use-wide';
import { Colors, Fonts, Radius, Spacing } from '@/components/ui/mostrador/tokens';
import { useSession } from '@/context/SessionContext';
import {
  deleteContent,
  listContent,
  reorderContent,
  updateContent,
  uploadContent,
  type ContentItem,
} from '@/lib/admin-api';
import { checkMedia, contentErrorMessage, contentSubtitle, contentTitle, moveItem, parseDuration } from '@/lib/content-rules';
import { createSubmitLock } from '@/lib/submit-lock';

type Result = { key: string; items?: ContentItem[] };

export default function ContentScreen() {
  const { store, me } = useSession();
  const wide = useWide();
  const [focused, setFocused] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [duration, setDuration] = useState('');
  const [durationError, setDurationError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(createSubmitLock()).current;

  const can = (code: string) => Boolean(me?.permissions.includes(code));
  const key = `${store?.store_id}:${attempt}:${focused}`;

  useEffect(() => {
    if (!store || !focused) return;
    let active = true;
    listContent(store.store_id)
      .then((list) => {
        if (!active) return;
        setItems(list);
        setResult({ key, items: list });
      })
      .catch(() => active && setResult({ key }));
    return () => {
      active = false;
    };
  }, [store, focused, key]);

  async function refetch() {
    if (store) setItems(await listContent(store.store_id).catch(() => items));
  }

  async function upload() {
    if (!store || !lock.acquire()) return;
    setError(null);
    setUploading(true);
    try {
      // On web the picker rejects unsupported files by throwing.
      const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'] }).catch(() => null);
      if (!picked) return setError('Elegí una imagen o un video MP4.');
      if (picked.canceled) return;
      const asset = picked.assets[0];
      const check = checkMedia({ mimeType: asset.mimeType ?? asset.file?.type, fileSize: asset.fileSize ?? asset.file?.size });
      if (check.error) return setError(check.error);
      await uploadContent(store.store_id, asset);
      await refetch();
    } catch (e) {
      setError(contentErrorMessage(e));
    } finally {
      lock.release();
      setUploading(false);
    }
  }

  async function move(index: number, direction: -1 | 1) {
    if (!store || !lock.acquire()) return;
    const before = items;
    const next = moveItem(items, index, direction);
    setError(null);
    setItems(next);
    try {
      await reorderContent(store.store_id, next.map((i) => i.content_id));
    } catch (e) {
      setItems(before);
      setError(contentErrorMessage(e));
    } finally {
      lock.release();
    }
  }

  function toggle(item: ContentItem) {
    setConfirmingId(null);
    setDurationError(null);
    setError(null);
    setDuration(String(item.duration_seconds));
    setExpandedId(expandedId === item.content_id ? null : item.content_id);
  }

  async function saveDuration(item: ContentItem) {
    const parsed = parseDuration(duration);
    if ('error' in parsed) return setDurationError(parsed.error);
    if (!lock.acquire()) return;
    setDurationError(null);
    try {
      const updated = await updateContent(item.content_id, { duration_seconds: parsed.seconds });
      setItems((list) => list.map((i) => (i.content_id === item.content_id ? updated : i)));
    } catch (e) {
      setDurationError(contentErrorMessage(e));
    } finally {
      lock.release();
    }
  }

  async function remove(item: ContentItem) {
    if (!lock.acquire()) return;
    try {
      await deleteContent(item.content_id);
      setExpandedId(null);
      setConfirmingId(null);
    } catch (e) {
      setError(contentErrorMessage(e));
    } finally {
      await refetch();
      lock.release();
    }
  }

  const loaded = result?.key === key ? result : null;

  let body;
  if (!loaded) {
    body = <FeedbackState type="loading" title="Cargando contenido..." message="Un momento." />;
  } else if (!loaded.items) {
    body = (
      <FeedbackState
        type="error"
        title="No pudimos cargar el contenido"
        message="Revisá la conexión e intentá nuevamente."
        actionLabel="Reintentar"
        onAction={() => setAttempt((a) => a + 1)}
      />
    );
  } else if (items.length === 0) {
    body = <FeedbackState type="empty" title="Aún no hay contenido" message="Subí una imagen o un video para las pantallas." />;
  } else {
    body = (
      <View style={[styles.list, wide && wideGrid(360)]}>
        {items.map((item, index) => {
          const open = expandedId === item.content_id;
          const first = index === 0;
          const last = index === items.length - 1;
          return (
            <View key={item.content_id} style={styles.item}>
              <View style={styles.line}>
                <View style={styles.row}>
                  <ListRow
                    title={contentTitle(item, index)}
                    detail={contentSubtitle(item) + (item.is_visible ? '' : ' · Oculto')}
                    image={item.type === 'image' ? item.url : null}
                    onPress={can('content:update') || can('content:delete') ? () => toggle(item) : undefined}
                  />
                </View>
                {can('content:update') ? (
                  <View style={styles.arrows}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Subir ${contentTitle(item, index)}`}
                      disabled={first}
                      onPress={() => void move(index, -1)}
                      style={[styles.arrow, first && styles.off]}
                    >
                      <Ionicons name="chevron-up" size={18} color={Colors.ink} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Bajar ${contentTitle(item, index)}`}
                      disabled={last}
                      onPress={() => void move(index, 1)}
                      style={[styles.arrow, last && styles.off]}
                    >
                      <Ionicons name="chevron-down" size={18} color={Colors.ink} />
                    </Pressable>
                  </View>
                ) : null}
              </View>
              {open ? (
                <View style={styles.panel}>
                  {item.type === 'image' && can('content:update') ? (
                    <>
                      <TextField
                        label="Segundos en pantalla"
                        value={duration}
                        onChangeText={setDuration}
                        keyboardType="number-pad"
                        error={durationError ?? undefined}
                        maxLength={2}
                      />
                      <Button title="Guardar duración" variant="secondary" onPress={() => void saveDuration(item)} fullWidth />
                    </>
                  ) : null}
                  {can('content:delete') ? (
                    confirmingId === item.content_id ? (
                      <>
                        <Button title="Sí, eliminar" onPress={() => void remove(item)} fullWidth />
                        <Button title="No, volver" variant="secondary" onPress={() => setConfirmingId(null)} fullWidth />
                      </>
                    ) : (
                      <Button title="Eliminar" variant="secondary" onPress={() => setConfirmingId(item.content_id)} fullWidth />
                    )
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <TopBar title="Contenido" store={store?.name} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.hint}>Se reproduce en este orden en todas las pantallas del local.</Text>
        {body}
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {loaded && can('content:create') ? (
          <Button title="Subir imagen o video" onPress={() => void upload()} loading={uploading} fullWidth style={wide && narrowBlock} />
        ) : null}
        <Text style={styles.hint}>Imagen hasta 5 MB · video hasta 50 MB y 60 s</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 20, gap: Spacing.md },
  list: { gap: Spacing.md },
  item: { gap: Spacing.sm },
  line: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  row: { flex: 1 },
  arrows: { gap: Spacing.xs },
  arrow: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  off: { opacity: 0.35 },
  panel: {
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  hint: { color: Colors.muted, fontFamily: Fonts.body, fontSize: 11 },
  error: { color: Colors.danger, fontFamily: Fonts.body, fontSize: 12 },
});
