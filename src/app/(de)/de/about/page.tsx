import { aboutMetadata, AboutRoute } from '@/app/_seo/about';

export const generateMetadata = () => aboutMetadata('de');

export default function Page() {
  return <AboutRoute locale="de" />;
}
