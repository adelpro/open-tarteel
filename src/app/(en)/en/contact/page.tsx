import { contactMetadata,ContactRoute } from '@/app/_seo/contact';

export const generateMetadata = () => contactMetadata('en');

export default function Page() {
  return <ContactRoute locale="en" />;
}
