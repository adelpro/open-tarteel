import { describe, expect, it } from 'vitest';

import { encodeTicket, PAIRING_TTL_MS, parseTicket } from './pairing-ticket';
import { migrateUserGraph } from './user-migrations';
import { CURRENT_USER_SCHEMA_VERSION } from './user-schema';

// Ported from Tilawa's test/gun-schema.test.ts.

const now = 1_700_000_000_000;
const ticket = {
  v: 2 as const,
  id: 'abc',
  epub: 'epub',
  epriv: 'epriv',
  exp: now + PAIRING_TTL_MS,
};

describe('parseTicket', () => {
  it('round-trips a v2 ticket', () => {
    expect(parseTicket(encodeTicket(ticket), now)).toEqual(ticket);
  });

  it('lives for 120 seconds', () => {
    expect(PAIRING_TTL_MS).toBe(120_000);
  });

  it('refuses an expired ticket', () => {
    expect(parseTicket(encodeTicket(ticket), ticket.exp + 1)).toBeNull();
  });

  it('refuses the old raw-pair format', () => {
    // v1 put the account key straight in the QR; it must never be redeemed.
    expect(
      parseTicket(JSON.stringify({ v: 1, pair: { pub: 'x', priv: 'y' } }), now)
    ).toBeNull();
    expect(
      parseTicket(JSON.stringify({ pub: 'x', priv: 'y' }), now)
    ).toBeNull();
  });

  it('refuses a ticket missing its throwaway key or id', () => {
    expect(
      parseTicket(JSON.stringify({ ...ticket, epriv: undefined }), now)
    ).toBeNull();
    expect(parseTicket(JSON.stringify({ ...ticket, id: '' }), now)).toBeNull();
  });

  it('never throws on garbage', () => {
    expect(parseTicket('not json', now)).toBeNull();
    expect(parseTicket('{}', now)).toBeNull();
    expect(parseTicket('null', now)).toBeNull();
  });
});

describe('migrateUserGraph', () => {
  it('lifts a snapshot with no version to the current schema', () => {
    const migrated = migrateUserGraph({ favorites: { 1: true } }, 0);
    expect(migrated._schemaVersion).toBe(CURRENT_USER_SCHEMA_VERSION);
    expect(migrated.favorites).toEqual({ 1: true });
  });

  it('keeps paths it does not understand', () => {
    expect(migrateUserGraph({ unknownPath: { a: 1 } }, 0).unknownPath).toEqual({
      a: 1,
    });
  });

  it('keeps the version of a snapshot from a newer client', () => {
    const ahead = CURRENT_USER_SCHEMA_VERSION + 5;
    expect(migrateUserGraph({ x: 1 }, ahead)._schemaVersion).toBe(ahead);
  });
});
