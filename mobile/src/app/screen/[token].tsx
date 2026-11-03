import { useLocalSearchParams } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { PlayerStage } from '@/components/player/player-stage';
import { usePlayer } from '@/components/player/use-player';
import { Colors, Fonts } from '@/components/ui/mostrador/tokens';

function Message({ text }: { text: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

function WebPlayer({ token }: { token: string }) {
  const { status, state, qrUrl, next } = usePlayer(token);

  if (status === 'invalid') return <Message text="Pantalla no válida" />;
  if (status === 'waiting') return <Message text="Esperando conexión para cargar el contenido…" />;
  if (status === 'loading' || !state.current) return <View style={styles.center} />;
  return <PlayerStage playlist={state.current} index={state.index} cycle={state.cycle} qrUrl={qrUrl} onDone={next} />;
}

export default function ScreenPlayer() {
  const { token } = useLocalSearchParams<{ token: string }>();
  if (Platform.OS !== 'web') return <Message text="El reproductor se abre desde un navegador web." />;
  return <WebPlayer token={token} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.ink, padding: 24 },
  text: { color: Colors.surface, fontFamily: Fonts.title, fontSize: 32, textAlign: 'center' },
});
