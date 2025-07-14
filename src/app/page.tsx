import ReciterPage from '@/app/reciter/[id]/reciter-page';
import UnderConstruction from '@/components/under-construction';

import Logo from './logo';

export default function Home() {
  return (
    <div className="flex w-full flex-col items-center justify-center bg-background text-foreground">
      <Logo />
      <ReciterPage id={undefined} />
      <UnderConstruction />
    </div>
  );
}
