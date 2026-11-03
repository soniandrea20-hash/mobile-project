import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/mostrador/button';
import { Chip } from '@/components/ui/mostrador/chip';
import { FeedbackState } from '@/components/ui/mostrador/feedback-state';
import { ListRow } from '@/components/ui/mostrador/list-row';
import { TextField } from '@/components/ui/mostrador/text-field';
import { TopBar } from '@/components/ui/mostrador/top-bar';
import { narrowBlock, useWide, wideGrid } from '@/components/ui/mostrador/use-wide';
import { Colors, Fonts, Spacing } from '@/components/ui/mostrador/tokens';
import { useSession } from '@/context/SessionContext';
import { createCategory, listCategories, listProducts, type Category, type Product } from '@/lib/admin-api';
import { formatPrice } from '@/lib/format-price';
import { categoryErrorMessage } from '@/lib/product-rules';
import { createSubmitLock } from '@/lib/submit-lock';

type Result = { key: string; data?: { categories: Category[]; products: Product[] } };

export default function CatalogTab() {
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const lock = useRef(createSubmitLock()).current;

  const can = (code: string) => Boolean(me?.permissions.includes(code));
  // Loading is derived from the key; refocusing (after saving a product) refetches.
  const key = `${store?.store_id}:${attempt}:${focused}`;

  useEffect(() => {
    if (!store || !focused) return;
    let active = true;
    Promise.all([listCategories(store.store_id), listProducts(store.store_id)])
      .then(([categories, products]) => active && setResult({ key, data: { categories, products } }))
      .catch(() => active && setResult({ key }));
    return () => {
      active = false;
    };
  }, [store, focused, key]);

  async function addCategory() {
    const name = newName.trim();
    if (!store || !name) return setAddError('Ingresá el nombre.');
    if (!lock.acquire()) return;
    setSending(true);
    setAddError(null);
    try {
      const created = await createCategory(store.store_id, name, result?.data?.categories.length ?? 0);
      setActiveId(created.category_id);
      setAdding(false);
      setNewName('');
      setAttempt((a) => a + 1);
    } catch (e) {
      setAddError(categoryErrorMessage(e));
    } finally {
      lock.release();
      setSending(false);
    }
  }

  const loaded = result?.key === key ? result : null;
  const data = loaded?.data;
  const products = data?.products.filter((p) => !activeId || p.category_id === activeId) ?? [];

  let body;
  if (!loaded) {
    body = <FeedbackState type="loading" title="Cargando catálogo..." message="Un momento." />;
  } else if (!data) {
    body = (
      <FeedbackState
        type="error"
        title="No pudimos cargar el catálogo"
        message="Revisá la conexión e intentá nuevamente."
        actionLabel="Reintentar"
        onAction={() => setAttempt((a) => a + 1)}
      />
    );
  } else if (products.length === 0) {
    body = (
      <FeedbackState
        type="empty"
        title="No hay productos"
        message={can('products:create') ? 'Agregá el primero con "+ Nuevo producto".' : 'Todavía no hay productos en esta categoría.'}
      />
    );
  } else {
    body = (
      <View style={[styles.list, wide && wideGrid(320)]}>
        {products.map((p) => (
          <ListRow
            key={p.product_id}
            title={p.name}
            detail={p.is_available ? 'Disponible' : 'No disponible'}
            value={formatPrice(p.price)}
            image={p.image_url}
            onPress={can('products:update') ? () => router.push(`/admin/catalogo/${p.product_id}`) : undefined}
          />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <TopBar title="Catálogo" store={store?.name} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {data ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            <Chip label="Todas" active={!activeId} onPress={() => setActiveId(null)} />
            {data.categories.map((c) => (
              <Chip key={c.category_id} label={c.name} active={activeId === c.category_id} onPress={() => setActiveId(c.category_id)} />
            ))}
            {can('categories:create') ? <Chip label="+ Categoría" onPress={() => setAdding((v) => !v)} /> : null}
          </ScrollView>
        ) : null}
        {adding ? (
          <View style={[styles.adding, wide && narrowBlock]}>
            <TextField label="Nueva categoría" value={newName} onChangeText={setNewName} editable={!sending} maxLength={80} onSubmitEditing={addCategory} />
            {addError ? <Text accessibilityRole="alert" style={styles.error}>{addError}</Text> : null}
            <Button title="Agregar categoría" onPress={addCategory} loading={sending} fullWidth />
          </View>
        ) : null}
        {body}
        {data && can('products:create') ? (
          <Button title="+ Nuevo producto" onPress={() => router.push('/admin/catalogo/nuevo')} fullWidth style={wide && narrowBlock} />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 20, gap: Spacing.md },
  chips: { gap: Spacing.sm },
  list: { gap: Spacing.md },
  adding: { gap: Spacing.sm },
  error: { color: Colors.danger, fontFamily: Fonts.body, fontSize: 12 },
});
