import { contactMetadata,ContactRoute } from '@/app/_seo/contact';

export const generateMetadata = () => contactMetadata('de');

export default function Page() {
  return <ContactRoute locale="de" />;
}
