import React from 'react';

import packageJson from '@/../package.json';

export default function AboutPage() {
  const currentYear = new Date().getFullYear();
  const version = packageJson.version;
  return (
    <div
      dir="rtl"
      className="mt-10 flex w-full flex-col items-center justify-center bg-background text-foreground"
    >
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="mb-6 text-center text-3xl font-bold">
          حول تطبيق Quran.us.kg
        </h1>

        <div className="m-1 space-y-4 rounded p-2 ps-4 text-lg md:m-2 md:border md:border-gray-200 md:p-8 md:shadow-sm md:dark:border-gray-700">
          <p>
            Quran.us.kg هو تطبيق قرآن مفتوح المصدر صمم لتوفير تجربة استماع
            مثالية عبر مختلف المنصات. بُني التطبيق باستخدام تقنيات ويب حديثة
            لضمان:
          </p>

          <ul className="list-outside list-disc space-y-3 ps-8">
            <li className="ps-2">أداء عالي السرعة واستجابة سريعة</li>
            <li className="ps-2">تصميم سريع الاستجابة لجميع أحجام الشاشات</li>
            <li className="ps-2">تحديثات وتطوير مستمر من المجتمع المفتوح</li>
          </ul>

          <p className="mt-4">
            يسعى التطبيق إلى توفير مصدر متاح للجميع ودائم للقرآن الكريم، مع
            الحفاظ على أعلى معايير الجودة التقنية والتصميمية.
          </p>

          <h2 className="mb-2 mt-6 text-2xl font-semibold">خوادم mp3quran</h2>
          <p>
            يستخدم التطبيق ملفات الصوت عالية الجودة للقرآن الكريم التي توفرها
            خدمة mp3quran، وهي خدمة طرف ثالث مستقلة. هذه الخدمة تضمن استقرار
            وسرعة في تحميل الملفات، مما يتيح للمستخدمين الاستماع إلى التلاوات
            دون انقطاع أو تأخير.
          </p>
          <p>
            نود التأكيد على أن mp3quran ليست جزءًا من خدماتنا، بل هي مزود خارجي
            يدعم ملايين المستخدمين حول العالم من خلال مكتبة صوتية واسعة ومتنوعة.
          </p>
        </div>
        <div className="mt-5 flex w-full max-w-2xl items-center justify-center text-sm text-gray-600">
          <p>
            <span>
              جميع الحقوق محفوظة &copy; {currentYear} - v{packageJson.version}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
