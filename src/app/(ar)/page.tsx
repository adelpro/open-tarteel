import { homeMetadata,HomeRoute } from '@/app/_seo/home';

export const generateMetadata = () => homeMetadata('ar');

export default function Page() {
  return <HomeRoute />;
}
