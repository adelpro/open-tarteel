import Image from 'next/image';
import Link from 'next/link';

import failSVG from '@/svgs/fail.svg';

export default function NotFound() {
  return (
    <main className="mt-4 flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-lg">
        <h1 className="mt-4 text-2xl font-bold">صفحة غير موجودة</h1>
        <Image
          src={failSVG}
          alt="Fail"
          width={200}
          height={200}
          className="mx-auto"
        />
        <p className="mt-4 text-gray-600">
          عذرًا، هذه الصفحة غير موجودة. يرجى التحقق من عنوان URL.
        </p>

        <div className="mt-6">
          <Link
            href="/"
            className="inline-block w-full rounded-md bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600"
          >
            العودة إلى الصفحة الرئيسية
          </Link>
        </div>
      </div>
    </main>
  );
}
