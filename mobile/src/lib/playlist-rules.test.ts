import {
  advance,
  clampIndex,
  initialPlayerState,
  itemTimeoutMs,
  nextIndex,
  parseCachedPlaylist,
  parsePlaylist,
  pollOutcome,
  qrLabel,
  receivePlaylist,
  serializePlaylist,
  type Playlist,
} from '@/lib/playlist-rules';

const item = (id: string, type: 'image' | 'video' = 'image', duration = 10) => ({
  content_id: id,
  type,
  url: `/media/${id}`,
  duration_seconds: duration,
});

const playlist = (version: string, ids: string[]): Playlist => ({
  version,
  poll_interval_seconds: 30,
  store: { name: 'Palermo', slug: 'palermo' },
  qr_url: 'https://local1.mostrador.io/palermo?src=abc',
  items: ids.map((id) => item(id)),
});

describe('nextIndex / clampIndex', () => {
  it('da la vuelta al llegar al final y tolera listas vacías', () => {
    expect(nextIndex(0, 3)).toBe(1);
    expect(nextIndex(2, 3)).toBe(0);
    expect(nextIndex(0, 1)).toBe(0);
    expect(nextIndex(5, 0)).toBe(0);
  });

  it('acota el índice cuando la lista se achica', () => {
    expect(clampIndex(4, 2)).toBe(1);
    expect(clampIndex(-1, 2)).toBe(0);
    expect(clampIndex(1, 2)).toBe(1);
    expect(clampIndex(3, 0)).toBe(0);
  });
});

describe('receivePlaylist / advance', () => {
  it('la primera playlist se aplica al instante', () => {
    const s = receivePlaylist(initialPlayerState(null), playlist('v1', ['a', 'b']));
    expect(s.current?.version).toBe('v1');
    expect(s.pending).toBeNull();
  });

  it('una playlist nueva espera al próximo cambio sin interrumpir el elemento actual', () => {
    let s = receivePlaylist(initialPlayerState(null), playlist('v1', ['a', 'b', 'c']));
    s = receivePlaylist(s, playlist('v2', ['x', 'y']));
    expect(s.current?.version).toBe('v1');
    expect(s.pending?.version).toBe('v2');
    expect(s.index).toBe(0);

    s = advance(s);
    expect(s.current?.version).toBe('v2');
    expect(s.pending).toBeNull();
    expect(s.index).toBe(0);
  });

  it('con la misma versión descarta lo pendiente', () => {
    let s = receivePlaylist(initialPlayerState(null), playlist('v1', ['a', 'b']));
    s = receivePlaylist(s, playlist('v2', ['x']));
    s = receivePlaylist(s, playlist('v1', ['a', 'b']));
    expect(s.pending).toBeNull();
  });

  it('si la lista se achica, el índice da la vuelta y nunca queda fuera de rango', () => {
    let s = receivePlaylist(initialPlayerState(null), playlist('v1', ['a', 'b', 'c', 'd']));
    s = { ...s, index: 3 };
    s = receivePlaylist(s, playlist('v2', ['x', 'y']));
    s = advance(s);
    expect(s.index).toBe(0);
    expect(s.current?.items).toHaveLength(2);
  });

  it('una lista sin elementos se reemplaza al instante porque no hay nada que interrumpir', () => {
    let s = receivePlaylist(initialPlayerState(null), playlist('v1', []));
    s = receivePlaylist(s, playlist('v2', ['a']));
    expect(s.current?.version).toBe('v2');
    expect(s.index).toBe(0);
  });

  it('un solo elemento sigue en bucle y cambia el ciclo para remontar', () => {
    let s = receivePlaylist(initialPlayerState(null), playlist('v1', ['a']));
    const first = s.cycle;
    s = advance(s);
    expect(s.index).toBe(0);
    expect(s.cycle).toBe(first + 1);
  });

  it('avanzar sin playlist no hace nada', () => {
    const s = initialPlayerState(null);
    expect(advance(s)).toBe(s);
  });
});

describe('pollOutcome', () => {
  const p = { ...playlist('v2', ['a']), poll_interval_seconds: 20 };

  it('200 aplica y reprograma con el intervalo de la playlist', () => {
    expect(pollOutcome({ status: 200, playlist: p }, 30)).toEqual({
      kind: 'apply',
      playlist: p,
      delayMs: 20000,
    });
  });

  it('304 mantiene y espera el intervalo vigente', () => {
    expect(pollOutcome({ status: 304 }, 30)).toEqual({ kind: 'keep', delayMs: 30000 });
  });

  it('404 es token no válido y no reprograma', () => {
    expect(pollOutcome({ status: 404 }, 30)).toEqual({ kind: 'invalid' });
  });

  it('falla de red o 5xx reintenta en el próximo ciclo', () => {
    expect(pollOutcome({ status: 'error' }, 30)).toEqual({ kind: 'retry', delayMs: 30000 });
  });
});

describe('caché de playlist', () => {
  it('serializa y vuelve a leer lo mismo', () => {
    const p = playlist('v1', ['a', 'b']);
    expect(parseCachedPlaylist(serializePlaylist(p))).toEqual(p);
  });

  it.each([
    ['nulo', null],
    ['vacío', ''],
    ['no JSON', '{no'],
    ['sin items', JSON.stringify({ version: 'v', poll_interval_seconds: 30 })],
    ['item inválido', JSON.stringify({ ...playlist('v', ['a']), items: [{ content_id: 'a', type: 'gif' }] })],
    ['sin qr_url', JSON.stringify({ ...playlist('v', ['a']), qr_url: undefined })],
    ['duración cero', JSON.stringify({ ...playlist('v', []), items: [item('a', 'image', 0)] })],
  ])('tolera datos corruptos: %s', (_name, raw) => {
    expect(parseCachedPlaylist(raw as string | null)).toBeNull();
  });

  it('parsePlaylist acepta el cuerpo del API y rechaza lo que no es objeto', () => {
    expect(parsePlaylist(playlist('v1', ['a']))?.version).toBe('v1');
    expect(parsePlaylist('texto')).toBeNull();
  });
});

describe('itemTimeoutMs', () => {
  it('imagen dura lo indicado y el video suma una gracia para que gane ended', () => {
    expect(itemTimeoutMs(item('a', 'image', 10))).toBe(10000);
    expect(itemTimeoutMs(item('b', 'video', 42))).toBeGreaterThan(42000);
  });
});

describe('qrLabel', () => {
  it('muestra host y ruta sin query', () => {
    expect(qrLabel('https://local1.mostrador.io/palermo?src=abc')).toBe('local1.mostrador.io/palermo');
    expect(qrLabel('http://local1.localhost:8081/palermo?src=abc')).toBe('local1.localhost:8081/palermo');
  });

  it('con una URL inválida devuelve el texto tal cual', () => {
    expect(qrLabel('no es url')).toBe('no es url');
  });
});
