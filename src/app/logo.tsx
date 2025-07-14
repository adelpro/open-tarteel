import Image from 'next/image';

export default function Logo() {
  return (
    <>
      <div className="mt-10 flex w-full items-center justify-center">
        <Image
          src="/images/logo.png"
          alt="logo"
          width={200}
          height={200}
          priority
        />
      </div>
      <div className="width-full flex items-center justify-center">
        <h1 className="text-4xl font-bold">القرآن الكريم</h1>
      </div>
    </>
  );
}
