import { privacyMetadata,PrivacyRoute } from '@/app/_seo/privacy';

export const generateMetadata = () => privacyMetadata('en');

export default function Page() {
  return <PrivacyRoute locale="en" />;
}
