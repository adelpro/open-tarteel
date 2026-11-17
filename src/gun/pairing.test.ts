import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PAIRING_TIMEOUT_MESSAGE, PAIRING_TTL_MS } from './pairing-ticket';

/**
 * An in-memory relay: `get(root).get(id)` reads and writes one envelope.
 * Enough to watch what `redeemTicket` leaves behind.
 */
const relay = vi.hoisted(() => {
  const envelopes = new Map<string, unknown>();
  const puts: { id: string; value: unknown }[] = [];
  let silent = false;
  const node = (id: string) => ({
    once: (listener: (data: unknown) => void) => {
      if (!silent) listener(envelopes.get(id));
    },
    put: (value: unknown) => {
      puts.push({ id, value });
      if (value === null) envelopes.delete(id);
      else envelopes.set(id, value);
    },
  });
  return {
    envelopes,
    puts,
    setSilent: (value: boolean) => {
      silent = value;
    },
    gun: { get: () => ({ get: node }) },
  };
});

const sea = vi.hoisted(() => ({
  decrypt: vi.fn(),
}));

vi.mock('./index', () => ({ gun: relay.gun, SEA: sea }));

const { redeemTicket } = await import('./pairing');

const ticket = (overrides: Partial<{ exp: number; epriv: string }> = {}) => ({
  v: 2 as const,
  id: 'envelope-1',
  epub: 'epub',
  epriv: 'epriv',
  exp: Date.now() + PAIRING_TTL_MS,
  ...overrides,
});

const accountPair = { pub: 'P', priv: 'p', epub: 'E', epriv: 'e' };

describe('redeemTicket', () => {
  beforeEach(() => {
    relay.envelopes.clear();
    relay.puts.length = 0;
    relay.setSilent(false);
    sea.decrypt.mockReset();
    relay.envelopes.set('envelope-1', {
      sealed: 'sealed-pair',
      exp: Date.now() + PAIRING_TTL_MS,
    });
  });

  it('opens the envelope and burns it', async () => {
    sea.decrypt.mockResolvedValue(JSON.stringify(accountPair));

    await expect(redeemTicket(ticket())).resolves.toEqual(accountPair);
    expect(relay.envelopes.has('envelope-1')).toBe(false);
  });

  it('burns the envelope even when it cannot be opened', async () => {
    // A wrong or corrupted epriv: SEA.decrypt resolves undefined.
    sea.decrypt.mockResolvedValue(undefined);

    await expect(redeemTicket(ticket({ epriv: 'wrong' }))).rejects.toThrow(
      'could not be opened'
    );
    expect(relay.puts).toContainEqual({ id: 'envelope-1', value: null });
    expect(relay.envelopes.has('envelope-1')).toBe(false);
  });

  it('burns the envelope when its payload is not JSON', async () => {
    sea.decrypt.mockResolvedValue('not json');

    await expect(redeemTicket(ticket())).rejects.toThrow();
    expect(relay.envelopes.has('envelope-1')).toBe(false);
  });

  it('refuses a second redemption of the same code', async () => {
    sea.decrypt.mockResolvedValue(undefined);
    await expect(redeemTicket(ticket({ epriv: 'wrong' }))).rejects.toThrow();

    // The right key, too late: the first read already burned it.
    sea.decrypt.mockResolvedValue(JSON.stringify(accountPair));
    await expect(redeemTicket(ticket())).rejects.toThrow('already used');
  });

  it('burns and refuses an envelope whose own expiry has passed', async () => {
    relay.envelopes.set('envelope-1', {
      sealed: 'sealed-pair',
      exp: Date.now() - 1,
    });

    await expect(redeemTicket(ticket())).rejects.toThrow('expired');
    expect(relay.envelopes.has('envelope-1')).toBe(false);
    expect(sea.decrypt).not.toHaveBeenCalled();
  });

  it('refuses an expired ticket without asking the relay', async () => {
    await expect(redeemTicket(ticket({ exp: Date.now() - 1 }))).rejects.toThrow(
      'expired'
    );
    expect(relay.puts).toHaveLength(0);
  });

  it('gives up after ten seconds of relay silence instead of spinning', async () => {
    vi.useFakeTimers();
    relay.setSilent(true);
    const pending = redeemTicket(ticket());
    const assertion = expect(pending).rejects.toThrow(PAIRING_TIMEOUT_MESSAGE);
    await vi.advanceTimersByTimeAsync(10_000);
    await assertion;
    vi.useRealTimers();
  });
});
