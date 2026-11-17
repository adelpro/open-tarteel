import { STORAGE_KEYS } from '@/utils/storage/storage-keys';

const KEY = STORAGE_KEYS.deviceName;

function browserVersion(agent: string): string {
  const named: [string, RegExp][] = [
    ['Edge', /Edg\/([\d.]+)/],
    ['Opera', /(?:OPR|Opera)\/([\d.]+)/],
    ['Firefox', /Firefox\/([\d.]+)/],
    ['Chrome', /Chrome\/([\d.]+)/],
  ];
  for (const [name, pattern] of named) {
    const match = agent.match(pattern);
    if (match) return `${name} ${match[1]}`;
  }
  if (agent.includes('Safari/')) {
    const match = agent.match(/Version\/([\d.]+)/);
    return match ? `Safari ${match[1]}` : 'Safari';
  }
  return '';
}

function operatingSystem(agent: string, platform: string): string {
  if (/Windows/i.test(agent) || /Win/i.test(platform)) {
    const match = agent.match(/Windows NT ([\d.]+)/);
    return match ? `Windows ${match[1]}` : 'Windows';
  }
  if (/Android/i.test(agent)) {
    const match = agent.match(/Android ([\d.]+)/);
    return match ? `Android ${match[1]}` : 'Android';
  }
  if (/iPhone|iPad|iPod/i.test(agent)) {
    const match = agent.match(/OS ([\d_]+)/);
    return match ? `iOS ${match[1].replaceAll('_', '.')}` : 'iOS';
  }
  if (/Macintosh|Mac OS X/i.test(agent) || /Mac/i.test(platform)) {
    const match = agent.match(/Mac OS X ([\d_]+)/);
    return match ? `macOS ${match[1].replaceAll('_', '.')}` : 'macOS';
  }
  if (/Linux/i.test(agent)) return 'Linux';
  return '';
}

/** "Windows 10.0 • Chrome 131.0.0.0" — the default name of a new row. */
function systemInfo(): string {
  if (typeof navigator === 'undefined') return '';
  const agent = navigator.userAgent || '';
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } })
      .userAgentData?.platform ||
    navigator.platform ||
    '';
  return [operatingSystem(agent, platform), browserVersion(agent)]
    .filter(Boolean)
    .join(' • ');
}

/**
 * The name this device gives its own row.
 *
 * Tilawa also rewrites a stored name that differs from `systemInfo()` — a
 * one-off migration of its older naming scheme. Open Tarteel has no older
 * names, and keeping that branch would undo a rename of this device on the
 * next heartbeat, so a stored name is returned as is.
 */
export function getOrCreateDeviceName(): string {
  if (typeof window === 'undefined') return 'Device';
  try {
    const existing = window.localStorage.getItem(KEY);
    if (existing) return existing;
    const name = systemInfo() || 'Browser';
    window.localStorage.setItem(KEY, name);
    return name;
  } catch {
    return systemInfo() || 'Browser';
  }
}

export function setDeviceName(name: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, name.trim() || systemInfo() || 'Browser');
  } catch {
    // ignore
  }
}
