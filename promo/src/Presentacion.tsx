import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Html5Audio,
  Img,
  interpolate,
  OffthreadVideo,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from 'remotion';
import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { Callout } from './Callout';
import { Laptop, Phone, Screen, Tv } from './devices';
import { Logo } from './Logo';
import { Colors, Fonts, TRANSITION } from './theme';

// Section lengths in frames (30 fps). Each section overlaps the next by TRANSITION frames.
const D = {
  intro: 150,
  problema: 177,
  autopedido: 332 + 145, // s3 (11.07 s) + s4 (4.83 s), back to back
  ordenes: 364, // s5 12.13 s
  catalogo: 305, // s6 11.67 s at 1.15x
  pantallas: 193 + 225 - 18, // s7a, slide, s7b
  cierre: 195,
  outro: 150,
};
export const DURATION = Object.values(D).reduce((a, b) => a + b, 0) - TRANSITION * (Object.keys(D).length - 1);

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const t = linearTiming({ durationInFrames: TRANSITION });

const useRise = (from: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - from, fps, config: { damping: 18, stiffness: 110 } });
  return { opacity: p, transform: `translateY(${(1 - p) * 40}px)` };
};

const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - 4, fps, config: { damping: 12 } });
  const glow = interpolate(frame, [0, 60], [0.6, 1], clamp);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 42%, ${Colors.primarySoft} 0%, ${Colors.bg} ${55 * glow}%)`,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 44,
      }}
    >
      <div style={{ transform: `scale(${0.7 + 0.3 * pop})`, opacity: pop }}>
        <Logo size={150} />
      </div>
      <div
        style={{
          ...useRise(40),
          fontFamily: Fonts.body,
          fontWeight: 500,
          fontSize: 46,
          color: Colors.muted,
        }}
      >
        Pedidos, menú y pantallas de tu local en un solo lugar
      </div>
    </AbsoluteFill>
  );
};

const Problema: React.FC = () => {
  const lines = ['Filas largas.', 'Menús desactualizados.', 'Carteles impresos.'];
  const rises = [useRise(25), useRise(60), useRise(95)];
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <OffthreadVideo
        src={staticFile('ai/apertura.mp4')}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        volume={(f) => interpolate(f, [0, 20, D.problema - 25, D.problema], [0, 0.25, 0.25, 0], clamp)}
      />
      <AbsoluteFill style={{ background: 'linear-gradient(90deg, rgba(28,25,23,0.85) 0%, rgba(28,25,23,0.45) 60%, rgba(28,25,23,0.25) 100%)' }} />
      <AbsoluteFill style={{ justifyContent: 'center', padding: '0 140px', gap: 18 }}>
        {lines.map((l, i) => (
          <div
            key={l}
            style={{
              ...rises[i],
              fontFamily: Fonts.title,
              fontWeight: 800,
              fontSize: 104,
              letterSpacing: -3,
              color: '#fff',
            }}
          >
            {l.slice(0, -1)}
            <span style={{ color: Colors.primary }}>.</span>
          </div>
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Label: React.FC<{ children: string; dark?: boolean }> = ({ children, dark }) => (
  <div
    style={{
      position: 'absolute',
      top: 56,
      left: 70,
      padding: '12px 28px',
      borderRadius: 999,
      background: dark ? 'rgba(255,255,255,0.12)' : Colors.primarySoft,
      color: dark ? '#fff' : Colors.primary,
      fontFamily: Fonts.title,
      fontWeight: 800,
      fontSize: 30,
      letterSpacing: 1,
      textTransform: 'uppercase',
    }}
  >
    {children}
  </div>
);

const lightBg = `radial-gradient(circle at 80% 20%, ${Colors.primarySoft} 0%, ${Colors.bg} 55%)`;

const Autopedido: React.FC = () => (
  <AbsoluteFill style={{ background: lightBg }}>
    <Label>Autopedido</Label>
    <div style={{ position: 'absolute', left: 330, top: 100 }}>
      <Phone height={900}>
        <Screen src="scenes/s3-autopedido.mp4" />
        <Sequence from={332} layout="none">
          <Screen src="scenes/s4-confirmar.mp4" />
        </Sequence>
      </Phone>
    </div>
    <div style={{ position: 'absolute', left: 1000, top: 270, width: 780, display: 'flex', flexDirection: 'column', gap: 34 }}>
      <Callout from={10} dimAt={95} step={1}>Escaneá el QR de la mesa</Callout>
      <Callout from={95} dimAt={340} step={2}>Armá tu pedido</Callout>
      <Callout from={340} step={3}>Confirmá sin esperar</Callout>
    </div>
  </AbsoluteFill>
);

const Estados: React.FC<{ at: number[] }> = ({ at }) => {
  const frame = useCurrentFrame();
  const names = ['Generada', 'En preparación', 'Lista'];
  const active = at.filter((a) => frame >= a).length - 1;
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 14, fontFamily: Fonts.body, fontWeight: 700, fontSize: 22 }}>
      {names.map((n, i) => (
        <span
          key={n}
          style={{
            padding: '6px 14px',
            borderRadius: 999,
            background: i === active ? (i === 2 ? Colors.successSoft : Colors.primarySoft) : Colors.bg,
            color: i === active ? (i === 2 ? Colors.success : Colors.primary) : Colors.muted,
          }}
        >
          {n}
        </span>
      ))}
    </div>
  );
};

const Desktop: React.FC<{ label: string; zoom: number | ((f: number) => number); src: string; rate?: number; children: React.ReactNode }> = ({
  label,
  zoom,
  src,
  rate,
  children,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: lightBg }}>
      <Label>{label}</Label>
      <div style={{ position: 'absolute', left: 50, top: 230 }}>
        <Laptop width={1160}>
          <Screen src={src} rate={rate} zoom={typeof zoom === 'number' ? zoom : zoom(frame)} />
        </Laptop>
      </div>
      <div style={{ position: 'absolute', left: 1390, top: 230, height: 700, width: 470, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 30 }}>
        {children}
      </div>
    </AbsoluteFill>
  );
};

const Ordenes: React.FC = () => (
  <Desktop label="Backoffice" src="scenes/s5-ordenes.mp4" zoom={1.9}>
    <Callout from={12} dimAt={150}>Los pedidos entran al instante</Callout>
    <Callout from={150}>
      <div>
        Seguí cada estado
        <Estados at={[0, 190, 280]} />
      </div>
    </Callout>
  </Desktop>
);

const Catalogo: React.FC = () => (
  <Desktop
    label="Backoffice"
    src="scenes/s6-catalogo.mp4"
    rate={1.15}
    zoom={(f) => interpolate(f, [30, 60], [1, 1.6], { ...clamp, easing: Easing.inOut(Easing.cubic) })}
  >
    <Callout from={12} dimAt={150}>Cambiá precios y fotos en segundos</Callout>
    <Callout from={150}>Sumá productos nuevos</Callout>
  </Desktop>
);

const PantallasLaptop: React.FC = () => (
  <Desktop label="Pantallas" src="scenes/s7a-contenido.mp4" zoom={1.7}>
    <Callout from={10} step={1}>Subí una promo</Callout>
  </Desktop>
);

// Slow push-in so the still promo doesn't feel frozen on the TV.
const PlayerImage: React.FC = () => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 225], [1, 1.06], { extrapolateRight: 'clamp' });
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#000' }}>
      <Img
        src={staticFile('ai/pantalla-player.png')}
        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${scale})` }}
      />
    </div>
  );
};

const PantallasTv: React.FC = () => (
  <AbsoluteFill style={{ background: `radial-gradient(circle at 35% 40%, #44403c 0%, ${Colors.ink} 70%)` }}>
    <Label dark>Pantallas</Label>
    <div style={{ position: 'absolute', left: 60, top: 200 }}>
      <Tv width={1200}>
        <PlayerImage />
      </Tv>
    </div>
    <div style={{ position: 'absolute', left: 1330, top: 330, width: 520 }}>
      <Callout from={10} step={2}>Aparece en todas tus pantallas</Callout>
    </div>
  </AbsoluteFill>
);

const Pantallas: React.FC = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={193}>
      <PantallasLaptop />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({ direction: 'from-right' })} timing={linearTiming({ durationInFrames: 18 })} />
    <TransitionSeries.Sequence durationInFrames={225}>
      <PantallasTv />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);

const Cierre: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <OffthreadVideo
      src={staticFile('ai/cierre.mp4')}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      volume={(f) => interpolate(f, [0, 20, D.cierre - 25, D.cierre], [0, 0.3, 0.3, 0], clamp)}
    />
    <AbsoluteFill style={{ background: 'linear-gradient(0deg, rgba(28,25,23,0.8) 0%, rgba(28,25,23,0) 55%)' }} />
    <div
      style={{
        ...useRise(30),
        position: 'absolute',
        left: 120,
        bottom: 110,
        fontFamily: Fonts.title,
        fontWeight: 800,
        fontSize: 120,
        letterSpacing: -4,
        color: '#fff',
      }}
    >
      Tu local, más ágil<span style={{ color: Colors.primary }}>.</span>
    </div>
  </AbsoluteFill>
);

const Outro: React.FC = () => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const pop = spring({ frame: frame - 4, fps, config: { damping: 12 } });
  const cta = spring({ frame: frame - 50, fps, config: { damping: 12 } });
  return (
    <AbsoluteFill style={{ background: Colors.ink, alignItems: 'center', justifyContent: 'center', gap: 36 }}>
      <div style={{ transform: `scale(${0.7 + 0.3 * pop})`, opacity: pop }}>
        <Logo size={130} dark />
      </div>
      <div style={{ ...useRise(25), fontFamily: Fonts.title, fontWeight: 700, fontSize: 64, color: Colors.primary }}>
        mostrador.io
      </div>
      <div
        style={{
          opacity: cta,
          transform: `scale(${0.85 + 0.15 * cta})`,
          marginTop: 20,
          padding: '24px 64px',
          borderRadius: 999,
          background: Colors.primary,
          color: '#fff',
          fontFamily: Fonts.title,
          fontWeight: 800,
          fontSize: 46,
        }}
      >
        Probalo en tu local
      </div>
    </AbsoluteFill>
  );
};

const fadeP = fade();
const slideP = slide({ direction: 'from-right' });

const SECTIONS: { d: number; el: React.FC; into?: ReturnType<typeof fade> | ReturnType<typeof slide> }[] = [
  { d: D.intro, el: Intro },
  { d: D.problema, el: Problema, into: fadeP },
  { d: D.autopedido, el: Autopedido, into: fadeP },
  { d: D.ordenes, el: Ordenes, into: slideP },
  { d: D.catalogo, el: Catalogo, into: slideP },
  { d: D.pantallas, el: Pantallas, into: fadeP },
  { d: D.cierre, el: Cierre, into: fadeP },
  { d: D.outro, el: Outro, into: fadeP },
];

export const Presentacion: React.FC<{ hasMusic: boolean }> = ({ hasMusic }) => (
  <AbsoluteFill style={{ background: Colors.bg }}>
    <TransitionSeries>
      {SECTIONS.map(({ d, el: El, into }, i) => (
        <React.Fragment key={i}>
          {into && <TransitionSeries.Transition presentation={into} timing={t} />}
          <TransitionSeries.Sequence durationInFrames={d}>
            <El />
          </TransitionSeries.Sequence>
        </React.Fragment>
      ))}
    </TransitionSeries>
    {hasMusic && (
      <Html5Audio
        src={staticFile('ai/musica.mp3')}
        volume={(f) => interpolate(f, [0, 15, DURATION - 15, DURATION], [0, 0.6, 0.6, 0], clamp)}
      />
    )}
  </AbsoluteFill>
);
