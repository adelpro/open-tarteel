import { ComponentPropsWithoutRef } from 'react';

import BackwardButton from '../player-controls/backward-button';
import ForwardButton from '../player-controls/forward-button';
import PlayButton from '../player-controls/play-button';
type Props = ComponentPropsWithoutRef<'div'>;
export default function CorePlayControls(props: Readonly<Props>) {
  return (
    <div {...props}>
      <ForwardButton />
      <PlayButton />
      <BackwardButton />
    </div>
  );
}
