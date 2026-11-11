import { privacyMetadata, PrivacyRoute } from '@/app/_seo/privacy';

export const generateMetadata = () => privacyMetadata('ar');

export default function Page() {
  return <PrivacyRoute locale="ar" />;
}
