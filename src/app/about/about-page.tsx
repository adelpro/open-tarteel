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
          حول تطبيق Open Quran
        </h1>

        <div className="m-1 space-y-4 rounded p-2 ps-4 text-lg md:m-2 md:border md:border-gray-200 md:p-8 md:shadow-sm md:dark:border-gray-700">
          <p>
            Open Quran هو تطبيق قرآن مفتوح المصدر صمم لتوفير تجربة استماع مثالية
            عبر مختلف المنصات. بُني التطبيق باستخدام تقنيات ويب حديثة لضمان:
          </p>

          <ul className="list-outside list-disc space-y-3 ps-8">
            <li className="ps-2">أداء عالي السرعة واستجابة سريعة</li>
            <li className="ps-2">عمل دون اتصال بالإنترنت</li>
            <li className="ps-2">تصميم سريع الاستجابة لجميع أحجام الشاشات</li>
            <li className="ps-2">
              استخدام تقنية WebTorrent للتخزين اللامركزي لمحتوى المصحف، مما يلغي
              الحاجة لخادم مركزي ويضمن استمرارية الوصول إلى المحتوى
            </li>
            <li className="ps-2">تحديثات وتطوير مستمر من المجتمع المفتوح</li>
          </ul>

          <p className="mt-4">
            يسعى التطبيق إلى توفير مصدر متاح للجميع ودائم للقرآن الكريم، مع
            الحفاظ على أعلى معايير الجودة التقنية والتصميمية.
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
