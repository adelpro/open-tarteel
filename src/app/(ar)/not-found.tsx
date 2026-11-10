import { NotFoundView } from '@/components/not-found-view';

export const metadata = {
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <NotFoundView locale="ar" />;
}
