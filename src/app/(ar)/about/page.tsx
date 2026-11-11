import { aboutMetadata, AboutRoute } from '@/app/_seo/about';

export const generateMetadata = () => aboutMetadata('ar');

export default function Page() {
  return <AboutRoute locale="ar" />;
}
