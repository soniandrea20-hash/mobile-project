// Copies the (gitignored) media into public/ so Remotion can serve it via staticFile().
import { cpSync, existsSync, mkdirSync } from 'node:fs';

const files = [
  'ai/apertura.mp4',
  'ai/cierre.mp4',
  'ai/musica.mp3',
  'ai/pantalla-player.png',
  'scenes/s3-autopedido.mp4',
  'scenes/s4-confirmar.mp4',
  'scenes/s5-ordenes.mp4',
  'scenes/s6-catalogo.mp4',
  'scenes/s7a-lista.mp4',
  'scenes/s7c-horario.mp4',
];
for (const f of files) {
  if (!existsSync(f)) {
    console.log(`skip (missing): ${f}`);
    continue;
  }
  mkdirSync(`public/${f.split('/')[0]}`, { recursive: true });
  cpSync(f, `public/${f}`);
}
