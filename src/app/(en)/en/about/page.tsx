import { aboutMetadata,AboutRoute } from '@/app/_seo/about';

export const generateMetadata = () => aboutMetadata('en');

export default function Page() {
  return <AboutRoute locale="en" />;
}
