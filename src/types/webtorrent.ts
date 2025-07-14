import type { WebTorrent } from 'webtorrent';

declare global {
  interface Window {
    WebTorrent?: WebTorrent;
  }
}

export {};
