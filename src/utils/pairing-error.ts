import { PAIRING_TIMEOUT_MESSAGE } from '@/gun/pairing-ticket';

export type PairingErrorKey = 'codeTimeout' | 'manualInvalid' | 'codeFailed';

/**
 * Why a redemption failed, as a key of the account messages.
 *
 * `pairing.ts` throws English messages for the console and for the test suite;
 * an Arabic screen showing "Pairing code expired or already used" is a bug the
 * listener cannot act on. Three outcomes need different advice: a dead code
 * means get a new one, a relay that did not answer means check the network,
 * and anything else is a retry.
 *
 * Tilawa returns the copy itself from a messages object; here the caller passes
 * the key to react-intl, so the function needs no locale.
 */
export function pairingErrorMessage(error: unknown): PairingErrorKey {
  const text =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : '';

  if (text.includes(PAIRING_TIMEOUT_MESSAGE)) return 'codeTimeout';
  if (/expired|already used/i.test(text)) return 'manualInvalid';
  return 'codeFailed';
}
