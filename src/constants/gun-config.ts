import { GUN_PEERS } from './gun-peers';

export const GUNCONFIG = {
  peers: [GUN_PEERS],
  localStorage: false,
  radisk: false,
  store: {
    put: function () {},
    get: function (_key: string, callback: (data: unknown) => void) {
      callback(null);
    },
  },
};
