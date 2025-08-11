'use client';

import React from 'react';
import { FormattedMessage } from 'react-intl';

export default function PrivacyPage() {
  return (
    <div className="flex w-full flex-col items-center justify-center bg-background text-foreground md:p-6 md:ps-10">
      <div className="w-full max-w-2xl p-2 ps-6">
        {/* Title Section */}
        <div className="border-b pb-6">
          <h1 className="text-3xl font-bold">
            <FormattedMessage
              defaultMessage="سياسة خصوصية Quran.us.kg"
              id="privacy.title"
            />
          </h1>
          <p className="mt-2 text-gray-600">
            <FormattedMessage
              defaultMessage="تاريخ السريان: 14 فبراير 2025"
              id="privacy.effectiveDate"
            />
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 border-gray-200 p-2 ps-6 text-lg dark:border-gray-700 md:rounded md:border md:p-6 md:ps-10 md:shadow-sm">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">
              <FormattedMessage
                defaultMessage="خصوصيتك مهمة بالنسبة لنا"
                id="privacy.section1.title"
              />
            </h2>
            <p>
              <FormattedMessage
                defaultMessage="في Quran.us.kg، نأخذ خصوصيتك على محمل الجد. تشرح هذه السياسة نهجنا في الخصوصية وجمع البيانات في التطبيق."
                id="privacy.section1.body"
              />
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">
              <FormattedMessage
                defaultMessage="ما المعلومات التي نجمعها؟"
                id="privacy.section2.title"
              />
            </h2>
            <p>
              <FormattedMessage
                defaultMessage="تطبيق Quran.us.kg لا يجمع أي معلومات شخصية أو أي بيانات أخرى من المستخدمين. يعمل التطبيق بالكامل في وضع عدم الاتصال، ولا يتم نقل أي بيانات من جهازك."
                id="privacy.section2.body"
              />
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">
              <FormattedMessage
                defaultMessage="لماذا لا نجمع البيانات؟"
                id="privacy.section3.title"
              />
            </h2>
            <ul className="list-disc space-y-3 pr-4">
              <li>
                <FormattedMessage
                  defaultMessage="توفير تجربة سلسة وغير متصلة بالإنترنت"
                  id="privacy.section3.point1"
                />
              </li>
              <li>
                <FormattedMessage
                  defaultMessage="عدم الحاجة للبيانات لأغراض التحليلات أو المراقبة"
                  id="privacy.section3.point2"
                />
              </li>
              <li>
                <FormattedMessage
                  defaultMessage="الحفاظ على خصوصية المستخدمين بشكل كامل"
                  id="privacy.section3.point3"
                />
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">
              <FormattedMessage
                defaultMessage="نحن نحترم خصوصية أطفالك"
                id="privacy.section4.title"
              />
            </h2>
            <p>
              <FormattedMessage
                defaultMessage="تم تصميم Quran.us.kg للأطفال الذين تتراوح أعمارهم بين 6 سنوات وما فوق والذين يمكنهم قراءة العربية. نحن ملتزمون بحماية خصوصية الأطفال. نظرًا لأن تطبيقنا لا يجمع أي بيانات، فإن معلومات الأطفال آمنة تمامًا."
                id="privacy.section4.body"
              />
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">
              <FormattedMessage
                defaultMessage="الحفاظ على أمان بياناتك"
                id="privacy.section5.title"
              />
            </h2>
            <p>
              <FormattedMessage
                defaultMessage="نظرًا لأننا لا نجمع أي بيانات، فلا توجد معلومات شخصية لحمايتها. ومع ذلك، نواصل إعطاء الأولوية لأمان التطبيق لضمان تجربة مستخدم آمنة من خلال مراقبة التطبيق بانتظام للكشف عن أي ثغرات محتملة."
                id="privacy.section5.body"
              />
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">
              <FormattedMessage
                defaultMessage="حقوق خصوصيتك"
                id="privacy.section6.title"
              />
            </h2>
            <p>
              <FormattedMessage
                defaultMessage="نظرًا لأنه لا يتم جمع أي بيانات شخصية، فلا حاجة لطلبات حذف البيانات أو إدارة المعلومات الشخصية داخل التطبيق."
                id="privacy.section6.body"
              />
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">
              <FormattedMessage
                defaultMessage="خدمات الطرف الثالث"
                id="privacy.section7.title"
              />
            </h2>
            <p>
              <FormattedMessage
                defaultMessage="لا يستخدم Quran.us.kg أي خدمات طرف ثالث للتحليلات أو التتبع أو جمع البيانات. يعمل التطبيق بالكامل على جهازك دون إرسال أي معلومات خارجيًا."
                id="privacy.section7.body"
              />
            </p>
          </section>

          <section className="space-y-4 border-t pt-6">
            <h2 className="text-2xl font-semibold">
              <FormattedMessage
                defaultMessage="اتصل بنا"
                id="privacy.section8.title"
              />
            </h2>
            <p>
              <FormattedMessage
                defaultMessage="إذا كانت لديك أي أسئلة حول هذه السياسة، فلا تتردد في الاتصال بنا على:"
                id="privacy.section8.body"
              />
              <br />
              <a
                href="mailto:contact@quran.us.kg"
                className="mt-2 inline-block font-semibold text-brand-CTA-blue-600"
              >
                contact@quran.us.kg
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
