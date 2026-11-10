import Image from 'next/image';

import LocalizedLink from '@/components/localized-link';
import type { SeoLocale } from '@/lib/seo/routes';
import failSVG from '@/svgs/fail.svg';

const COPY = {
  ar: {
    title: 'صفحة غير موجودة',
    body: 'عذرًا، هذه الصفحة غير موجودة. يرجى التحقق من عنوان URL.',
    home: 'العودة إلى الصفحة الرئيسية',
  },
  en: {
    title: 'Page not found',
    body: 'Sorry, this page does not exist. Please check the URL.',
    home: 'Back to home',
  },
  de: {
    title: 'Seite nicht gefunden',
    body: 'Entschuldigung, diese Seite existiert nicht. Bitte prüfen Sie die URL.',
    home: 'Zurück zur Startseite',
  },
} as const;

export function NotFoundView({ locale }: { locale: SeoLocale }) {
  const copy = COPY[locale];

  return (
    <div className="mt-4 flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-lg">
        <h1 className="mt-4 text-2xl font-bold">{copy.title}</h1>
        <Image
          src={failSVG}
          alt="Fail"
          width={200}
          height={200}
          className="mx-auto"
        />
        <p className="mt-4 text-gray-600">{copy.body}</p>

        <div className="mt-6">
          <LocalizedLink
            href="/"
            className="hover:from-brand-CTA-blue-700 inline-block w-full rounded-md bg-gradient-to-r from-brand-CTA-blue-600 to-brand-CTA-blue-500 px-4 py-2 font-medium text-white hover:to-brand-CTA-blue-600"
          >
            {copy.home}
          </LocalizedLink>
        </div>
      </div>
    </div>
  );
}
