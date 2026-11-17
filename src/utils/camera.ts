/**
 * Why the camera did not open.
 *
 * Each cause has a different way out, so the panel names it rather than showing
 * one generic "camera unavailable": a blocked permission is fixed in the
 * browser's settings, a device without a camera has nothing to fix, and http has
 * no scanner at all until it is served over https.
 */
export type CameraFault =
  'blocked' | 'no-device' | 'busy' | 'secure' | 'unknown';

/** `getUserMedia` is missing on plain http and on older browsers. */
export function hasCameraApi(
  devices: { getUserMedia?: unknown } | null | undefined
): boolean {
  return typeof devices?.getUserMedia === 'function';
}

/**
 * `html5-qrcode` rejects with strings, not Errors: every `getUserMedia` failure
 * arrives as `"Error getting userMedia, error = NotAllowedError: Permission
 * denied"`, so `error.name` is undefined and the cause has to be read from the
 * text. An unrecognised error stays `unknown` — a wrong diagnosis sends the
 * listener to a settings screen that will not help.
 */
const CAUSES: [CameraFault, RegExp][] = [
  ['secure', /mediadevices not supported|only supported in secure context/i],
  ['blocked', /notallowederror|permission denied|permission dismissed/i],
  [
    'no-device',
    /notfounderror|overconstrainederror|requested device not found/i,
  ],
  ['busy', /notreadableerror|could not start video source|track starterror/i],
];

function describe(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const { name, message } = error as { name?: unknown; message?: unknown };
    return [
      typeof name === 'string' ? name : '',
      typeof message === 'string' ? message : '',
    ]
      .join(' ')
      .trim();
  }
  return error == null ? '' : String(error);
}

export function classifyCameraError(error: unknown): CameraFault {
  const text = describe(error);
  for (const [cause, pattern] of CAUSES) {
    if (pattern.test(text)) return cause;
  }
  return 'unknown';
}
