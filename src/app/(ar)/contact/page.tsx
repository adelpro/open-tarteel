import { contactMetadata,ContactRoute } from '@/app/_seo/contact';

export const generateMetadata = () => contactMetadata('ar');

export default function Page() {
  return <ContactRoute locale="ar" />;
}
