export const DEBUG_SW = process.env.NEXT_PUBLIC_DEBUG_SW === 'true';

export const SW_LOG_CHANNEL = 'sw-debug-log';

export type SwLogLevel = 'log' | 'warn' | 'error';

export interface SwLogMessage {
  level: SwLogLevel;
  label: string;
  args: unknown[];
  ts: number; // Date.now() in the SW
}

// ── SW-side logger (call these inside sw.ts) ──────────────────────────────────

let _swChannel: BroadcastChannel | null = null;

function getSwChannel(): BroadcastChannel | null {
  if (!DEBUG_SW) return null;
  if (!_swChannel) {
    try {
      _swChannel = new BroadcastChannel(SW_LOG_CHANNEL);
    } catch {
      // BroadcastChannel not available (shouldn't happen in modern SW)
    }
  }
  return _swChannel;
}

function broadcast(level: SwLogLevel, label: string, args: unknown[]) {
  const ch = getSwChannel();
  if (!ch) return;
  const message: SwLogMessage = {
    level,
    label,
    args: serializeArguments(args),
    ts: Date.now(),
  };
  try {
    ch.postMessage(message);
  } catch {
    // Structured clone can fail on non-serializable values – degrade gracefully
    ch.postMessage({
      level,
      label,
      args: [String(args)],
      ts: message.ts,
    } satisfies SwLogMessage);
  }
}

/** Safely serialize args so structured-clone doesn't throw */
function serializeArguments(args: unknown[]): unknown[] {
  return args.map((a) => {
    if (a === null || a === undefined) return a;
    if (typeof a !== 'object' && typeof a !== 'function') return a;
    try {
      // Attempt structured-clone dry-run via JSON round-trip (fast path)
      return JSON.parse(JSON.stringify(a));
    } catch {
      return String(a);
    }
  });
}

export function swLog(label: string, ...args: unknown[]) {
  if (!DEBUG_SW) return;
  console.log(`[SW] ${label}`, ...args);
  broadcast('log', label, args);
}

export function swWarn(label: string, ...args: unknown[]) {
  if (!DEBUG_SW) return;
  console.warn(`[SW] ${label}`, ...args);
  broadcast('warn', label, args);
}

export function swError(label: string, ...args: unknown[]) {
  if (!DEBUG_SW) return;
  console.error(`[SW] ${label}`, ...args);
  broadcast('error', label, args);
}

// ── Client-side receiver (call once at app init or inside a hook) ─────────────

type UnsubscribeFunction = () => void;

export function subscribeSwLogs(): UnsubscribeFunction {
  if (!DEBUG_SW || globalThis.window === undefined) return () => {};

  let ch: BroadcastChannel;
  try {
    ch = new BroadcastChannel(SW_LOG_CHANNEL);
  } catch {
    return () => {};
  }

  ch.addEventListener('message', (e: MessageEvent<SwLogMessage>) => {
    const { level, label, args, ts } = e.data ?? {};
    if (!label) return;

    const time = new Date(ts).toISOString().slice(11, 23); // HH:MM:SS.mmm
    const prefix = `[SW→Client ${time}] ${label}`;

    switch (level) {
      case 'warn':
        console.warn(prefix, ...args);
        break;
      case 'error':
        console.error(prefix, ...args);
        break;
      default:
        console.log(prefix, ...args);
    }
  });

  return () => ch.close();
}
