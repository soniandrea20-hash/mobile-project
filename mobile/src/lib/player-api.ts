import { API_URL } from '@/lib/api';
import { parseCachedPlaylist, parsePlaylist, serializePlaylist, type Playlist, type PollResult } from '@/lib/playlist-rules';
import { resolveTenantSlug } from '@/lib/tenant';

/** Public endpoint: the token in the path is the credential, so no session and no bearer header. */
export async function fetchPlaylist(token: string, version: string | null): Promise<PollResult> {
  const tenant = resolveTenantSlug();
  try {
    const response = await fetch(`${API_URL}/player/${encodeURIComponent(token)}/playlist`, {
      headers: {
        ...(version ? { 'If-None-Match': `"${version}"` } : {}),
        ...(tenant ? { 'X-Tenant-Slug': tenant } : {}),
      },
    });
    if (response.status === 304) return { status: 304 };
    if (response.status === 404) return { status: 404 };
    if (!response.ok) return { status: 'error' };
    const playlist = parsePlaylist(await response.json());
    return playlist ? { status: 200, playlist } : { status: 'error' };
  } catch {
    return { status: 'error' };
  }
}

const cacheKey = (token: string) => `player:${resolveTenantSlug() ?? '-'}:${token}`;

export function loadCachedPlaylist(token: string): Playlist | null {
  try {
    return parseCachedPlaylist(window.localStorage.getItem(cacheKey(token)));
  } catch {
    return null;
  }
}

export function saveCachedPlaylist(token: string, playlist: Playlist) {
  try {
    window.localStorage.setItem(cacheKey(token), serializePlaylist(playlist));
  } catch {}
}

export function clearCachedPlaylist(token: string) {
  try {
    window.localStorage.removeItem(cacheKey(token));
  } catch {}
}
