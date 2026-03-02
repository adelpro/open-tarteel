'use client';

import React from 'react';
import { FormattedMessage } from 'react-intl';

import packageJson from '@/../package.json';

export default function AboutPage() {
  const currentYear = new Date().getFullYear();
  const version = packageJson.version;

  return (
    <div className="mt-10 flex w-full flex-col items-center justify-center bg-background text-foreground">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="mb-6 text-center text-3xl font-bold">
          <FormattedMessage
            defaultMessage="حول تطبيق Quran.us.kg"
            id="about.title"
          />
        </h1>

        <div className="m-1 space-y-4 rounded p-2 ps-4 text-lg md:m-2 md:border md:border-gray-200 md:p-8 md:shadow-sm md:dark:border-gray-700">
          <p>
            <FormattedMessage
              defaultMessage="Quran.us.kg هو تطبيق قرآن مفتوح المصدر صمم لتوفير تجربة استماع مثالية عبر مختلف المنصات. بُني التطبيق باستخدام تقنيات ويب حديثة لضمان:"
              id="about.description"
            />
          </p>

          <ul className="list-outside list-disc space-y-3 ps-8">
            <li className="ps-2">
              <FormattedMessage
                defaultMessage="أداء عالي السرعة واستجابة سريعة"
                id="about.feature.performance"
              />
            </li>
            <li className="ps-2">
              <FormattedMessage
                defaultMessage="تصميم سريع الاستجابة لجميع أحجام الشاشات"
                id="about.feature.responsive"
              />
            </li>
            <li className="ps-2">
              <FormattedMessage
                defaultMessage="تحديثات وتطوير مستمر من المجتمع المفتوح"
                id="about.feature.community"
              />
            </li>
          </ul>

          <p className="mt-4">
            <FormattedMessage
              defaultMessage="يسعى التطبيق إلى توفير مصدر متاح للجميع ودائم للقرآن الكريم، مع الحفاظ على أعلى معايير الجودة التقنية والتصميمية."
              id="about.mission"
            />
          </p>

          <h2 className="mb-2 mt-6 text-2xl font-semibold">
            <FormattedMessage
              defaultMessage="خوادم mp3quran"
              id="about.servers.title"
            />
          </h2>

          <p>
            <FormattedMessage
              defaultMessage="يستخدم التطبيق ملفات الصوت عالية الجودة للقرآن الكريم التي توفرها خدمة mp3quran، وهي خدمة طرف ثالث مستقلة. هذه الخدمة تضمن استقرار وسرعة في تحميل الملفات، مما يتيح للمستخدمين الاستماع إلى التلاوات دون انقطاع أو تأخير."
              id="about.servers.description1"
            />
          </p>
          <p>
            <FormattedMessage
              defaultMessage="نود التأكيد على أن mp3quran ليست جزءًا من خدماتنا، بل هي مزود خارجي يدعم ملايين المستخدمين حول العالم من خلال مكتبة صوتية واسعة ومتنوعة."
              id="about.servers.description2"
            />
          </p>
        </div>

        <div className="mt-5 flex w-full max-w-2xl items-center justify-center text-sm text-gray-600">
          <p>
            <FormattedMessage
              defaultMessage="جميع الحقوق محفوظة"
              id="about.footer.rights"
            />
            @ {currentYear} v{version}
          </p>
        </div>
        {/* Credits section at the very bottom */}
        <div className="flex w-full justify-center text-gray-600">
          <div className="px-4 py-2 text-sm">
            Made by{' '}
            <a
              href="https://adelpro.us.kg"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              adelpro
            </a>{' '}
            &middot;{' '}
            <a
              href="https://github.com/adelpro/open-tarteel"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Source
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
