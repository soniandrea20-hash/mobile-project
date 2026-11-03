import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { View } from 'react-native';

import { TabBar, type TabItem } from '@/components/ui/mostrador/tab-bar';
import { Colors } from '@/components/ui/mostrador/tokens';
import { useWide } from '@/components/ui/mostrador/use-wide';
import { useSession } from '@/context/SessionContext';

const TABS: (TabItem & { permission?: string })[] = [
  { key: 'catalogo', label: 'Catálogo', icon: 'grid-outline' },
  { key: 'pantallas', label: 'Pantallas', icon: 'tv-outline', permission: 'screens:read' },
  { key: 'ordenes', label: 'Órdenes', icon: 'receipt-outline' },
  { key: 'ajustes', label: 'Ajustes', icon: 'settings-outline' },
];

export default function TabsLayout() {
  const { status, me } = useSession();
  const wide = useWide();
  if (status === 'loading') return null;
  if (status === 'out') return <Redirect href="/admin/login" />;

  const visible = TABS.filter((t) => !t.permission || me?.permissions.includes(t.permission));

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={{ flex: 1, width: '100%', maxWidth: wide ? undefined : 480, alignSelf: 'center' }}>
        <Tabs
          screenOptions={{ headerShown: false, tabBarPosition: wide ? 'left' : 'bottom' }}
          tabBar={({ state, navigation }) => (
            <TabBar
              items={visible}
              vertical={wide}
              activeKey={state.routes[state.index].name}
              onSelect={(key) => navigation.navigate(key)}
            />
          )}
        >
          {TABS.map((t) => (
            <Tabs.Screen key={t.key} name={t.key} options={visible.includes(t) ? {} : { href: null }} />
          ))}
        </Tabs>
      </View>
    </View>
  );
}
