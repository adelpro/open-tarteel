import LocalizedLink from '@/components/localized-link';
import { SURAHS } from '@/constants';
import type { SeoLocale } from '@/lib/seo/routes';
import type { Reciter } from '@/types';

const surahName = (surah: (typeof SURAHS)[number], locale: SeoLocale) =>
  locale === 'ar'
    ? surah.name
    : locale === 'de'
      ? surah.germanName
      : surah.englishName;

/**
 * The crawlable half of a reciter page: a real H1, the riwaya, and the 114
 * surah links. The player below is hydrated separately.
 */
export default function ReciterSeo({
  reciter,
  locale,
}: {
  reciter: Reciter;
  locale: SeoLocale;
}) {
  return (
    <section className="mx-auto w-full max-w-3xl px-2">
      <h1 className="text-center text-2xl font-bold text-ink sm:text-3xl">
        {reciter.name}
      </h1>
      <p className="mt-1 text-center text-[13px] text-ink-muted">
        {reciter.moshaf.name}
      </p>

      <h2 className="mt-6 text-[1rem] font-bold text-ink">
        {locale === 'ar' ? 'السور' : locale === 'de' ? 'Suren' : 'Surahs'}
      </h2>
      <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
        {SURAHS.map((surah) => (
          <li key={surah.id}>
            <LocalizedLink
              href={`/reciter/${reciter.id}?moshafId=${reciter.moshaf.id}&surah=${surah.id}`}
              className="text-ink-secondary text-[13px] hover:text-primary"
            >
              {surah.id}. {surahName(surah, locale)}
            </LocalizedLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
