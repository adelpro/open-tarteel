/**
 * One AudioContext for the page, created on the first play. Cross-origin audio
 * without CORS is never connected: the browser would hand out zeroes and mute
 * the element, so the caller gates on `canUseAudioAnalyser`.
 */
type AudioContextCtor = typeof AudioContext;

let context: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
const connected = new WeakSet<HTMLMediaElement>();

function ensureContext(): AudioContext | null {
  if (context) return context;
  const Ctor: AudioContextCtor | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextCtor })
      .webkitAudioContext;
  if (!Ctor) return null;
  context = new Ctor();
  return context;
}

export function ensureAnalyser(audio: HTMLAudioElement): AnalyserNode | null {
  try {
    const audioContext = ensureContext();
    if (!audioContext) return null;

    if (!analyser) {
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.75;
    }

    if (!connected.has(audio)) {
      const source = audioContext.createMediaElementSource(audio);
      source.connect(analyser);
      source.connect(audioContext.destination);
      connected.add(audio);
    }

    void audioContext.resume?.();
    return analyser;
  } catch (error) {
    console.warn('analyser unavailable', error);
    return null;
  }
}

export function getAnalyser(): AnalyserNode | null {
  return analyser;
}
