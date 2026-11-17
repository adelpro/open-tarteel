/**
 * The QR payload. Deliberately dependency-free: no gun import, so this can be
 * tested and reasoned about without a relay.
 *
 * v2 carries a throwaway key and an id pointing at a sealed envelope on the
 * relay. v1 (the account pair in the clear) is refused.
 */
export const PAIRING_TTL_MS = 2 * 60 * 1000;

/**
 * The receiving side gives the relay this long to answer before it gives up.
 * Without a deadline the "linking…" state waited on a `.once()` that a relay
 * which never saw the envelope would never call back, and the camera was
 * already off — a spinner with no way out.
 */
export const PAIRING_TIMEOUT_MS = 10_000;

/** Matched by `pairingErrorMessage`; thrown as an Error message. */
export const PAIRING_TIMEOUT_MESSAGE = 'pairing timeout';

export type PairingTicket = {
  v: 2;
  id: string;
  /** Ephemeral public key, needed to derive the decryption secret. */
  epub: string;
  /** Ephemeral private key. Useless once the envelope is deleted. */
  epriv: string;
  exp: number;
};

export function encodeTicket(ticket: PairingTicket): string {
  return JSON.stringify(ticket);
}

export function parseTicket(
  raw: string,
  now: number = Date.now()
): PairingTicket | null {
  try {
    const value = JSON.parse(raw);
    if (value?.v !== 2) return null;
    if (typeof value.id !== 'string' || !value.id) return null;
    if (typeof value.epub !== 'string' || !value.epub) return null;
    if (typeof value.epriv !== 'string' || !value.epriv) return null;
    if (typeof value.exp !== 'number' || value.exp < now) return null;
    return {
      v: 2,
      id: value.id,
      epub: value.epub,
      epriv: value.epriv,
      exp: value.exp,
    };
  } catch {
    return null;
  }
}
