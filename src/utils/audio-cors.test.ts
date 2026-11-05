import { describe, expect, it } from 'vitest';

import { canUseAudioAnalyser } from './audio-cors';

describe('canUseAudioAnalyser', () => {
  it('allows MP3Quran CDN and legacy server hosts', () => {
    expect(
      canUseAudioAnalyser(
        'https://cdn.mp3quran.net/audio/ibrahim-akhdar/r1/001.mp3'
      )
    ).toBe(true);
    expect(
      canUseAudioAnalyser('https://server15.mp3quran.net/audio/001.mp3')
    ).toBe(true);
  });

  it('allows Qurani.ai and Quran Foundation audio', () => {
    expect(
      canUseAudioAnalyser(
        'https://quranhub.b-cdn.net/quran/audio/surah/48/ar.ibrahimakhdar.hafs/1.mp3'
      )
    ).toBe(true);
    expect(
      canUseAudioAnalyser(
        'https://download.quranicaudio.com/quran/yasser_ad-dussary/001.mp3'
      )
    ).toBe(true);
  });

  it('rejects Itqan audio, which has no CORS headers', () => {
    expect(
      canUseAudioAnalyser(
        'https://storage.cms.itqan.dev/media/uploads/assets/11/recitations/001.mp3?c=open-tarteel-d0a6'
      )
    ).toBe(false);
  });

  it('allows same-origin audio', () => {
    expect(canUseAudioAnalyser('/audio/001.mp3')).toBe(true);
  });

  it('rejects empty and malformed URLs', () => {
    expect(canUseAudioAnalyser(undefined)).toBe(false);
    expect(canUseAudioAnalyser('not a url')).toBe(false);
  });
});
