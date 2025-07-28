import Gun from 'gun';

import { GUN_PEERS } from '@/constants';

const gun = Gun({
  peers: [GUN_PEERS],
  radisk: false,
});

export default gun;
