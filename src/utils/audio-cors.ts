/**
 * Whether an audio URL can be routed through WebAudio for the spectrum.
 *
 * Cross-origin media without `Access-Control-Allow-Origin` must not be given
 * `crossOrigin="anonymous"`: the browser blocks playback, and connecting it to
 * an `AudioContext` can silence it. Itqan's `storage.cms.itqan.dev` is the one
 * provider without CORS, so it plays without an analyser.
 */
const CORS_AUDIO_HOSTS = new Set(['quranhub.b-cdn.net']);

export const canUseAudioAnalyser = (
  url: string | null | undefined
): boolean => {
  if (!url || url.trim() === '' || /\s/.test(url)) return false;

  try {
    const base =
      typeof window === 'undefined' ? 'http://localhost' : window.location.href;
    const resolved = new URL(url, base);

    if (
      typeof window !== 'undefined' &&
      resolved.origin === window.location.origin
    ) {
      return true;
    }

    // MP3Quran (cdn + legacy server*), Quran Foundation audio CDN.
    if (
      resolved.hostname.endsWith('mp3quran.net') ||
      resolved.hostname.endsWith('quranicaudio.com')
    ) {
      return true;
    }

    return CORS_AUDIO_HOSTS.has(resolved.hostname);
  } catch {
    return false;
  }
};
