/**
 * One AudioContext for the page, created on the first play. Cross-origin audio
 * without CORS is never connected: the browser would hand out zeroes and mute
 * the element, so the caller gates on `canUseAudioAnalyser`.
 *
 * Two analysers share the same source: the spectrum uses 1024 bins with
 * smoothing, the pitch contour uses 2048 bins without smoothing because 1024
 * gives roughly 43 Hz per bin at 44.1 kHz, too coarse for a voice.
 */
type AudioContextCtor = typeof AudioContext;

let context: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let pitchAnalyser: AnalyserNode | null = null;
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

function ensureNodes(audioContext: AudioContext): void {
  if (!analyser) {
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.75;
  }
  if (!pitchAnalyser) {
    pitchAnalyser = audioContext.createAnalyser();
    pitchAnalyser.fftSize = 2048;
    pitchAnalyser.smoothingTimeConstant = 0;
  }
}

function connectSource(
  audio: HTMLAudioElement,
  audioContext: AudioContext
): void {
  if (connected.has(audio)) return;
  // One MediaElementSource per element is all the platform allows.
  const source = audioContext.createMediaElementSource(audio);
  source.connect(analyser as AnalyserNode);
  source.connect(pitchAnalyser as AnalyserNode);
  source.connect(audioContext.destination);
  connected.add(audio);
}

export function ensureAnalyser(audio: HTMLAudioElement): AnalyserNode | null {
  try {
    const audioContext = ensureContext();
    if (!audioContext) return null;
    ensureNodes(audioContext);
    connectSource(audio, audioContext);
    void audioContext.resume?.();
    return analyser;
  } catch (error) {
    console.warn('analyser unavailable', error);
    return null;
  }
}

/** Higher resolution, no smoothing: for pitch detection, not for drawing bars. */
export function ensurePitchAnalyser(
  audio: HTMLAudioElement
): AnalyserNode | null {
  try {
    const audioContext = ensureContext();
    if (!audioContext) return null;
    ensureNodes(audioContext);
    connectSource(audio, audioContext);
    void audioContext.resume?.();
    return pitchAnalyser;
  } catch (error) {
    console.warn('pitch analyser unavailable', error);
    return null;
  }
}

export function getAnalyser(): AnalyserNode | null {
  return analyser;
}

export function getPitchAnalyser(): AnalyserNode | null {
  return pitchAnalyser;
}
