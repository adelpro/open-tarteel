import { describe, expect, it } from 'vitest';

import { PAIRING_TIMEOUT_MESSAGE } from '@/gun/pairing-ticket';

import { pairingErrorMessage } from './pairing-error';

// Ported from Tilawa's test/pairing-error.test.ts: the function returns the
// message key instead of the copy, so the assertions name keys.

describe('pairingErrorMessage', () => {
  it('asks for a new code when the code expired or was already used', () => {
    expect(pairingErrorMessage(new Error('Pairing code expired'))).toBe(
      'manualInvalid'
    );
    expect(
      pairingErrorMessage(new Error('Pairing code expired or already used'))
    ).toBe('manualInvalid');
  });

  it('calls a relay that never answered a network problem, not a bad code', () => {
    expect(pairingErrorMessage(new Error(PAIRING_TIMEOUT_MESSAGE))).toBe(
      'codeTimeout'
    );
  });

  it('reads a string rejection the same way', () => {
    expect(pairingErrorMessage(PAIRING_TIMEOUT_MESSAGE)).toBe('codeTimeout');
    expect(pairingErrorMessage('Pairing code could not be opened')).toBe(
      'codeFailed'
    );
  });

  it('treats an unknown failure as a retry, never an invented cause', () => {
    expect(pairingErrorMessage(new Error('boom'))).toBe('codeFailed');
    expect(pairingErrorMessage(null)).toBe('codeFailed');
    expect(pairingErrorMessage(undefined)).toBe('codeFailed');
  });
});
