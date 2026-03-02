import { SWTrackMeta, Track } from '@/types';

export async function getSW(): Promise<ServiceWorker | null> {
  if (globalThis.window === undefined || !('serviceWorker' in navigator))
    return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return navigator.serviceWorker.controller ?? reg.active;
  } catch {
    return null;
  }
}

export function openChannel(
  sw: ServiceWorker,
  payload: Record<string, unknown>
) {
  const ch = new MessageChannel();
  ch.port1.start();
  sw.postMessage(payload, [ch.port2]);
  return { port: ch.port1, cleanup: () => ch.port1.close() };
}

export function toSWTrackMeta(track: Track): SWTrackMeta {
  return {
    id: track.id,
    url: track.link,
    reciterId: track.reciterId ?? '',
    moshafId: track.moshafId ?? '',
    surahId: track.surahId ?? '',
    link: track.link,
    reciterName: track.reciterName ?? '',
    moshafName: track.moshafName ?? '',
    surahName: track.surahName ?? '',
    surahNameEn: track.surahNameEn ?? '',
    duration: track.duration ?? 0,
    addedAt: track.addedAt || Date.now(),
  };
}
