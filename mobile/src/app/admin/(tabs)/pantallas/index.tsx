import * as Clipboard from 'expo-clipboard';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/mostrador/button';
import { FeedbackState } from '@/components/ui/mostrador/feedback-state';
import { ListRow } from '@/components/ui/mostrador/list-row';
import { TextField } from '@/components/ui/mostrador/text-field';
import { TopBar } from '@/components/ui/mostrador/top-bar';
import { narrowBlock, useWide, wideGrid } from '@/components/ui/mostrador/use-wide';
import { Colors, Fonts, Radius, Spacing } from '@/components/ui/mostrador/tokens';
import { useSession } from '@/context/SessionContext';
import { createScreen, listScreens, type Screen } from '@/lib/admin-api';
import { screenErrorMessage, validateScreenName } from '@/lib/content-rules';
import { createSubmitLock } from '@/lib/submit-lock';

type Result = { key: string; screens?: Screen[] };

export default function ScreensTab() {
  const router = useRouter();
  const wide = useWide();
  const { store, me } = useSession();
  const [focused, setFocused] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const lock = useRef(createSubmitLock()).current;

  const can = (code: string) => Boolean(me?.permissions.includes(code));
  const key = `${store?.store_id}:${attempt}:${focused}`;

  useEffect(() => {
    if (!store || !focused) return;
    let active = true;
    listScreens(store.store_id)
      .then((screens) => active && setResult({ key, screens }))
      .catch(() => active && setResult({ key }));
    return () => {
      active = false;
    };
  }, [store, focused, key]);

  async function addScreen() {
    const invalid = validateScreenName(newName);
    if (!store || invalid) return setAddError(invalid);
    if (!lock.acquire()) return;
    setSending(true);
    setAddError(null);
    try {
      const created = await createScreen(store.store_id, newName.trim());
      setSelectedId(created.screen_id);
      setAdding(false);
      setNewName('');
      setAttempt((a) => a + 1);
    } catch (e) {
      setAddError(screenErrorMessage(e));
    } finally {
      lock.release();
      setSending(false);
    }
  }

  async function copy(url: string) {
    try {
      await Clipboard.setStringAsync(url);
      setCopied(url);
    } catch {
      setCopied(null);
    }
  }

  const loaded = result?.key === key ? result : null;
  const screens = loaded?.screens;
  const selected = screens?.find((s) => s.screen_id === selectedId) ?? screens?.[0];

  let body;
  if (!loaded) {
    body = <FeedbackState type="loading" title="Cargando pantallas..." message="Un momento." />;
  } else if (!screens) {
    body = (
      <FeedbackState
        type="error"
        title="No pudimos cargar las pantallas"
        message="Revisá la conexión e intentá nuevamente."
        actionLabel="Reintentar"
        onAction={() => setAttempt((a) => a + 1)}
      />
    );
  } else if (screens.length === 0) {
    body = (
      <FeedbackState
        type="empty"
        title="Aún no hay pantallas"
        message={can('screens:create') ? 'Agregá la primera con "+ Nueva pantalla".' : 'Todavía no hay pantallas en este local.'}
      />
    );
  } else {
    body = (
      <>
        <View style={[styles.list, wide && wideGrid(320)]}>
          {screens.map((s) => (
            <View key={s.screen_id} style={[styles.pick, s.screen_id === selected?.screen_id && styles.picked]}>
              <ListRow
                title={s.name}
                detail={s.is_active ? 'Activa' : 'Inactiva'}
                trailing={<View style={[styles.dot, s.is_active && styles.dotOn]} />}
                onPress={() => {
                  setSelectedId(s.screen_id);
                  setCopied(null);
                }}
              />
            </View>
          ))}
        </View>
        {selected ? (
          <View style={[styles.link, wide && narrowBlock]}>
            <Text style={styles.linkHint}>Abrí este enlace en el navegador del televisor</Text>
            <Text selectable style={styles.linkUrl}>{selected.player_url}</Text>
            <Text style={styles.linkHint}>El token identifica a la pantalla; no requiere login.</Text>
          </View>
        ) : null}
        {selected ? <Button title="Copiar enlace" variant="secondary" onPress={() => void copy(selected.player_url)} fullWidth style={wide && narrowBlock} /> : null}
        {selected && copied === selected.player_url ? (
          <Text accessibilityRole="alert" style={styles.ok}>Enlace copiado</Text>
        ) : null}
        {can('content:read') ? (
          <Button title="Contenido de pantalla" variant="secondary" onPress={() => router.push('/admin/pantallas/contenido')} fullWidth style={wide && narrowBlock} />
        ) : null}
      </>
    );
  }

  return (
    <View style={styles.screen}>
      <TopBar title="Pantallas" store={store?.name} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {body}
        {adding ? (
          <View style={[styles.adding, wide && narrowBlock]}>
            <TextField label="Nombre de la pantalla" value={newName} onChangeText={setNewName} editable={!sending} maxLength={80} onSubmitEditing={addScreen} />
            {addError ? <Text accessibilityRole="alert" style={styles.error}>{addError}</Text> : null}
            <Button title="Agregar pantalla" onPress={addScreen} loading={sending} fullWidth />
          </View>
        ) : null}
        {loaded && can('screens:create') && !adding ? <Button title="+ Nueva pantalla" onPress={() => setAdding(true)} fullWidth style={wide && narrowBlock} /> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 20, gap: Spacing.md },
  list: { gap: Spacing.md },
  pick: { borderRadius: Radius.lg + 2, borderWidth: 2, borderColor: 'transparent' },
  picked: { borderColor: Colors.primary },
  dot: { width: 10, height: 10, borderRadius: Radius.pill, borderWidth: 1.5, borderColor: Colors.muted },
  dotOn: { backgroundColor: Colors.success, borderColor: Colors.success },
  link: { gap: Spacing.xs, padding: Spacing.lg, borderRadius: Radius.lg, backgroundColor: Colors.ink },
  linkHint: { color: Colors.muted, fontFamily: Fonts.body, fontSize: 11 },
  linkUrl: { color: Colors.surface, fontFamily: Fonts.bold, fontSize: 14 },
  ok: { color: Colors.success, fontFamily: Fonts.medium, fontSize: 13 },
  adding: { gap: Spacing.sm },
  error: { color: Colors.danger, fontFamily: Fonts.body, fontSize: 12 },
});
