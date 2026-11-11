import { homeMetadata, HomeRoute } from '@/app/_seo/home';

export const generateMetadata = () => homeMetadata('de');

export default function Page() {
  return <HomeRoute />;
}
