import { describe, expect, it } from 'vitest';

import { classifyCameraError, hasCameraApi } from './camera';

// Ported from Tilawa's test/camera.test.ts.

/**
 * The decoder rejects with strings, not Errors: `html5-qrcode` wraps every
 * getUserMedia failure as "Error getting userMedia, error = <name>: <message>".
 */
const wrapped = (name: string, message: string) =>
  `Error getting userMedia, error = ${name}: ${message}`;

describe('classifyCameraError', () => {
  it('reports a denied permission as blocked, not as a missing camera', () => {
    expect(
      classifyCameraError(wrapped('NotAllowedError', 'Permission denied'))
    ).toBe('blocked');
  });

  it('keeps the name of a DOMException', () => {
    expect(
      classifyCameraError(
        new DOMException('Permission denied', 'NotAllowedError')
      )
    ).toBe('blocked');
  });

  it('reports no matching device as a missing camera', () => {
    expect(
      classifyCameraError(
        wrapped('NotFoundError', 'Requested device not found')
      )
    ).toBe('no-device');
    expect(
      classifyCameraError(new DOMException('x', 'OverconstrainedError'))
    ).toBe('no-device');
  });

  it('reports a camera another app owns as busy, not blocked', () => {
    expect(
      classifyCameraError(
        wrapped('NotReadableError', 'Could not start video source')
      )
    ).toBe('busy');
  });

  it('reports a browser without mediaDevices as needing https', () => {
    expect(classifyCameraError('navigator.mediaDevices not supported')).toBe(
      'secure'
    );
    expect(
      classifyCameraError(
        'Camera access is only supported in secure context like https or localhost.'
      )
    ).toBe('secure');
  });

  it('calls anything unrecognised unknown, never a wrong diagnosis', () => {
    expect(classifyCameraError(new Error('boom'))).toBe('unknown');
    expect(classifyCameraError(undefined)).toBe('unknown');
    expect(classifyCameraError({})).toBe('unknown');
  });
});

describe('hasCameraApi', () => {
  it('is false when the API is absent, so scanning is never attempted', () => {
    expect(hasCameraApi(undefined)).toBe(false);
    expect(hasCameraApi(null)).toBe(false);
    expect(hasCameraApi({})).toBe(false);
    expect(hasCameraApi({ getUserMedia: () => undefined })).toBe(true);
  });
});
