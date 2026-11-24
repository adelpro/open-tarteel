'use client';

import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import type { QuranManifest } from '@/services/quran-text';

/**
 * The mode's about block. Digests come from the shipped manifest, so they can
 * never drift from the data; the coverage figures are the audited results and
 * carry the data version beside them for the same reason.
 */
export function FollowAlongAbout() {
  const [manifest, setManifest] = useState<QuranManifest | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/data/quran/manifest.json')
      .then((response) => (response.ok ? response.json() : null))
      .then((value: QuranManifest | null) => {
        if (!cancelled && value) setManifest(value);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="mt-6 space-y-3">
      <h2 className="mb-2 text-2xl font-bold">
        <FormattedMessage
          defaultMessage="تتبّع التلاوة"
          id="about.followAlong.title"
        />
      </h2>

      <p>
        <FormattedMessage
          defaultMessage="يُبرز هذا الوضع الكلمة التي تُتلى الآن، ويلوّن مواضع أحكام التجويد. الأداة للاستماع والتعلّم فقط، وليست لتصحيح التلاوة، ولا تستعمل الذكاء الاصطناعي، ولا تقيس الأداء."
          id="about.followAlong.description"
        />
      </p>

      <p>
        <FormattedMessage
          defaultMessage="يعمل مع التلاوات التي توفّر توقيتًا على مستوى الكلمة، وبرواية حفص عن عاصم فقط. اليوم يعني ذلك مؤسسة القرآن و168 تلاوة من MP3Quran v4 تحقّقنا من توقيت كلماتها بفحص عيّنة. وما عداها يُشغَّل عاديًا، لكن السطر لا يظهر."
          id="about.followAlong.hafs"
        />
      </p>

      <p>
        <FormattedMessage
          defaultMessage="الدقة ليست كاملة: توقيت الكلمات متاح لـ 99.45% من كلمات التلاوات المدعومة من مؤسسة القرآن. أمّا تلاوات MP3Quran v4 البالغ عددها 168 فقد تحقّقنا من توقيت كلماتها بفحص عشرة سور لا بمراجعة شاملة، ويُعاد فحص التغطية لكل آية أثناء التشغيل. وفي مجموعة مؤسسة القرآن، يقل التوقيت في 0.70% من الآيات عن 85% من كلمات الآية، فيتوقف تتبّع الكلمات في تلك الآية وتُضاء الآية كاملة حتى تبدأ الآية التالية، بدلًا من إضاءة كلمة خاطئة. التطبيق يقوم بالمزامنة مع الواجهة فقط، وأرقام مؤسسة القرآن محسوبة من البيانات المنشورة."
          id="about.followAlong.accuracy"
        />
      </p>

      <p>
        <FormattedMessage
          defaultMessage="التلوين يبيّن موضع الحكم في النص، لا صحة تطبيقه في التلاوة. الوضع لا يسجّل صوتك ولا يقارنه ولا يصدر تقييمًا."
          id="about.followAlong.method"
        />
      </p>


      <details className="text-sm">
        <summary className="cursor-pointer">
          <FormattedMessage
            defaultMessage="المصادر والبصمات"
            id="about.followAlong.sources"
          />
        </summary>

        <p dir="ltr" className="mt-2 break-all font-mono text-xs">
          {manifest
            ? `data ${manifest.dataVersion} · corpus ${manifest.corpusSha256}`
            : 'manifest…'}
        </p>

        {manifest ? (
          <ul dir="ltr" className="mt-2 space-y-2 font-mono text-xs">
            <li className="break-all">
              Tanzil Uthmani {manifest.text.version}: {manifest.text.sha256}
            </li>
            <li className="break-all">
              quran-tajweed {manifest.tajweed.commit.slice(0, 7)}:{' '}
              {manifest.tajweed.sha256}
            </li>
          </ul>
        ) : null}

        <p className="mt-2 text-xs">
          <FormattedMessage
            defaultMessage="النص بترخيص CC BY 3.0 وشروط تنزيل، والتجويد بترخيص CC BY 4.0، وعلامات الآيات بترخيص OFL."
            id="about.followAlong.licenseNote"
          />
        </p>
      </details>
    </section>
  );
}
