import { GUN_PEERS } from './gun-peers';

// Cloudflare Workers cannot open the outbound WebSocket to the Gun relay, and
// the relay is unreachable from some networks. With no peers Gun stays local,
// so favorites still work without console errors; global counts simply stay at
// zero until a relay is reachable again.
const peers = process.env.NEXT_PUBLIC_DISABLE_GUN === 'true' ? [] : [GUN_PEERS];

export const GUNCONFIG = {
  peers,
  localStorage: false,
  radisk: false,
  store: {
    put: function () {},
    get: function (_key: string, callback: (data: unknown) => void) {
      callback(null);
    },
  },
};
