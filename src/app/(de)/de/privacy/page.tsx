import { privacyMetadata,PrivacyRoute } from '@/app/_seo/privacy';

export const generateMetadata = () => privacyMetadata('de');

export default function Page() {
  return <PrivacyRoute locale="de" />;
}
