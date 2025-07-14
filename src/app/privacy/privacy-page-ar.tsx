import React from 'react';

export default function PrivacyPageAr() {
  return (
    <div
      dir="rtl"
      className="flex w-full flex-col items-center justify-center bg-background text-foreground md:p-6 md:ps-10"
    >
      <div className="w-full max-w-2xl p-2 ps-6">
        {/* Title Section */}
        <div className="border-b pb-6">
          <h1 className="text-3xl font-bold">سياسة خصوصية Open Quran</h1>
          <p className="mt-2 text-gray-600">تاريخ السريان: 14 فبراير 2025</p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 border-gray-200 p-2 ps-6 text-lg dark:border-gray-700 md:rounded md:border md:p-6 md:ps-10 md:shadow-sm">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">خصوصيتك مهمة بالنسبة لنا</h2>
            <p>
              في Open Quran، نأخذ خصوصيتك على محمل الجد. تشرح هذه السياسة نهجنا
              في الخصوصية وجمع البيانات في التطبيق.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">
              ما المعلومات التي نجمعها؟
            </h2>
            <p>
              تطبيق Open Quran{' '}
              <span className="font-semibold">لا تجمع أي معلومات شخصية</span> أو
              أي بيانات أخرى من المستخدمين. يعمل التطبيق بالكامل في وضع عدم
              الاتصال، ولا يتم نقل أي بيانات من جهازك.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">لماذا لا نجمع البيانات؟</h2>
            <ul className="list-disc space-y-3 pr-4">
              <li>توفير تجربة سلسة وغير متصلة بالإنترنت</li>
              <li>عدم الحاجة للبيانات لأغراض التحليلات أو المراقبة</li>
              <li>الحفاظ على خصوصية المستخدمين بشكل كامل</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">نحن نحترم خصوصية أطفالك</h2>
            <p>
              تم تصميم Open Quran للأطفال الذين تتراوح أعمارهم بين 6 سنوات وما
              فوق والذين يمكنهم قراءة العربية. نحن ملتزمون بحماية خصوصية
              الأطفال. نظرًا لأن تطبيقنا لا يجمع أي بيانات، فإن معلومات الأطفال
              آمنة تمامًا.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">الحفاظ على أمان بياناتك</h2>
            <p>
              نظرًا لأننا لا نجمع أي بيانات، فلا توجد معلومات شخصية لحمايتها.
              ومع ذلك، نواصل إعطاء الأولوية لأمان التطبيق لضمان تجربة مستخدم
              آمنة من خلال مراقبة التطبيق بانتظام للكشف عن أي ثغرات محتملة.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">حقوق خصوصيتك</h2>
            <p>
              نظرًا لأنه لا يتم جمع أي بيانات شخصية، فلا حاجة لطلبات حذف
              البيانات أو إدارة المعلومات الشخصية داخل التطبيق.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">خدمات الطرف الثالث</h2>
            <p>
              لا يستخدم Open Quran أي خدمات طرف ثالث للتحليلات أو التتبع أو جمع
              البيانات. يعمل التطبيق بالكامل على جهازك دون إرسال أي معلومات
              خارجيًا.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">تحديثات هذه السياسة</h2>
            <p>
              قد نقوم بتحديث هذه السياسة بشكل دوري. إذا تم إجراء تغييرات كبيرة،
              سنقوم بإبلاغ المستخدمين داخل التطبيق. استمرار استخدام التطبيق يعني
              قبولك للسياسة المحدثة.
            </p>
          </section>

          <section className="space-y-4 border-t pt-6">
            <h2 className="text-2xl font-semibold">اتصل بنا</h2>
            <p>
              إذا كانت لديك أي أسئلة حول هذه السياسة، فلا تتردد في الاتصال بنا
              على:
              <br />
              <span className="mt-2 inline-block font-semibold text-blue-600">
                contact@openquran.us.kg
              </span>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
