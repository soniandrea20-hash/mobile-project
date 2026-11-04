import QRCode from 'qrcode';
import { useEffect, useState, type CSSProperties } from 'react';

import { Colors, Fonts, Radius } from '@/components/ui/mostrador/tokens';
import { resolveImageUrl } from '@/lib/api';
import { clampIndex, itemTimeoutMs, nextIndex, qrLabel, type PlaylistItem } from '@/lib/playlist-rules';

import type { PlayerStageProps } from './player-stage';

const ERROR_SKIP_MS = 1000;
const fill: CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' };

function Media({ item, onDone }: { item: PlaylistItem; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, itemTimeoutMs(item));
    return () => clearTimeout(timer);
  }, [item, onDone]);

  // A broken file waits a moment before skipping so an all-broken list does not spin.
  const skip = () => setTimeout(onDone, ERROR_SKIP_MS);
  const src = resolveImageUrl(item.url) ?? undefined;
  return item.type === 'video' ? (
    <video src={src} style={fill} autoPlay muted playsInline onEnded={onDone} onError={skip} />
  ) : (
    <img src={src} alt="" style={fill} onError={skip} />
  );
}

/** Keeps the next item downloaded so the change does not show a blank frame. */
function Preload({ item }: { item: PlaylistItem | undefined }) {
  const src = item ? (resolveImageUrl(item.url) ?? undefined) : undefined;
  const hidden: CSSProperties = { position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' };
  if (!item) return null;
  return item.type === 'video' ? (
    <video key={src} src={src} style={hidden} preload="auto" muted />
  ) : (
    <img key={src} src={src} alt="" style={hidden} />
  );
}

function Qr({ url }: { url: string }) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    // Level Q and the standard 4-module quiet zone, so it scans from a distance.
    QRCode.toString(url, { type: 'svg', errorCorrectionLevel: 'Q', margin: 4 })
      .then((markup) => active && setSvg(`data:image/svg+xml;utf8,${encodeURIComponent(markup)}`))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [url]);

  return (
    <div
      style={{
        position: 'absolute',
        right: '3.75vw',
        bottom: '6.7vh',
        padding: '1.4vh 1.4vh 1.8vh',
        background: Colors.surface,
        borderRadius: '3vh',
        textAlign: 'center',
        fontFamily: Fonts.body,
        color: Colors.ink,
      }}
    >
      {/* Side is 28% of the height, above the 8% the requirements ask for. */}
      {svg ? (
        <img src={svg} alt="Código QR" style={{ display: 'block', width: '28vh', height: '28vh' }} />
      ) : (
        <div style={{ width: '28vh', height: '28vh' }} />
      )}
      <div style={{ fontFamily: Fonts.bold, fontSize: '3vh', marginTop: '0.4vh' }}>Escaneá y pedí</div>
      <div style={{ color: Colors.muted, fontSize: '1.9vh', marginTop: '0.4vh' }}>{qrLabel(url)}</div>
    </div>
  );
}

function Progress({ count, active }: { count: number; active: number }) {
  if (count < 2) return null;
  return (
    <div style={{ position: 'absolute', left: '7.5vw', bottom: '6.7vh', display: 'flex', gap: '0.8vh' }}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          style={{
            height: '0.9vh',
            width: i === active ? '5.5vh' : '1.4vh',
            borderRadius: Radius.pill,
            background: Colors.surface,
            opacity: i === active ? 1 : 0.4,
          }}
        />
      ))}
    </div>
  );
}

export function PlayerStage({ items, storeName, index, cycle, qrUrl, onDone }: PlayerStageProps) {
  const active = clampIndex(index, items.length);
  const item = items[active];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        background: Colors.ink,
        cursor: 'none',
        fontFamily: Fonts.body,
      }}
    >
      {item ? (
        <Media key={`${cycle}-${item.media_id}`} item={item} onDone={onDone} />
      ) : (
        // Default panel for a screen without content.
        <div
          style={{
            ...fill,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '7.5vw',
            background: Colors.primary,
            color: Colors.surface,
            fontFamily: Fonts.title,
            fontSize: '9vh',
          }}
        >
          {storeName}
        </div>
      )}
      <Preload item={items[nextIndex(active, items.length)]} />
      <Progress count={items.length} active={active} />
      {qrUrl ? <Qr url={qrUrl} /> : null}
    </div>
  );
}
