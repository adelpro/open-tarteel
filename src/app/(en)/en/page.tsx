import { homeMetadata, HomeRoute } from '@/app/_seo/home';

export const generateMetadata = () => homeMetadata('en');

export default function Page() {
  return <HomeRoute />;
}
