'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';

import Loader from '@/components/loader';
import sendSVG from '@/svgs/send.svg';
import { isValidEmail } from '@/utils';

const sendFeedback = async (
  name: string,
  email: string,
  message: string
): Promise<Response | undefined> => {
  try {
    const response = await fetch('api/send-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        message,
      }),
    });
    return response;
  } catch (error) {
    console.error(error);
  }
};

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const validateAndSend = (): void => {
    if (name === '') {
      setError('الرجاء إدخال الاسم.');
      return;
    }
    if (email === '') {
      setError('الرجاء إدخال البريد الإلكتروني.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('الرجاء إدخال بريد إلكتروني صالح.');
      return;
    }
    if (message === '') {
      setError('الرجاء إدخال الرسالة.');
      return;
    }
    setLoading(true);
    sendFeedback(name, email, message)
      .then((response) => {
        setLoading(false);
        if (response?.status === 200) {
          setFormSubmitted(true);
        } else {
          setError('حدث خطأ ما، الرجاء المحاولة مرة أخرى.');
        }
      })
      .catch((error_) => {
        setError(JSON.stringify(error_));
      });
  };

  const buttonContent = loading ? (
    <Loader message="جاري الإرسال" rightIcon />
  ) : (
    <div className="flex flex-row-reverse gap-2">
      <span className="mr-2 text-3xl font-bold">إرسال</span>
      <Image src={sendSVG} alt="إرسال" width={40} height={40} />
    </div>
  );

  return (
    <>
      {formSubmitted ? (
        <div
          className="flex h-[400px] flex-1 flex-col items-center justify-center gap-2"
          dir="rtl"
        >
          <p className="mb-10 text-center text-5xl" role="alert">
            شكراً لتواصلك معنا. سنتواصل معك قريباً!
          </p>
          <Link href="/" className="mt-4 flex items-center space-x-2">
            <button className="text-2xl font-bold hover:underline">
              العودة إلى الصفحة الرئيسية
            </button>
          </Link>
        </div>
      ) : (
        <div className="p-2 md:p-8">
          <h1 className="mb-20 text-center text-5xl font-bold">إتصل بنا</h1>
          <section className="container mx-auto max-w-2xl" dir="rtl">
            <form className="flex flex-col">
              <input
                type="text"
                required
                className="mb-4 border-b-2 border-gray-400 px-8 py-2 text-3xl ring-black focus:ring-4"
                id="name"
                placeholder="الإسم"
                value={name}
                onChange={(event) => {
                  setError('');
                  setName(event.target.value);
                }}
              />

              <input
                type="email"
                required
                className="mb-4 border-b-2 border-gray-400 px-8 py-2 text-3xl ring-black focus:ring-4"
                id="email"
                placeholder="البريد الإلكتروني"
                value={email}
                onChange={(event) => {
                  setError('');
                  setEmail(event.target.value);
                }}
              />

              <textarea
                className="mb-4 border-b-2 border-gray-400 px-8 py-2 text-3xl ring-black focus:ring-4"
                id="message"
                rows={3}
                required
                placeholder="الرسالة"
                value={message}
                onChange={(event) => {
                  setError('');
                  setMessage(event.target.value);
                }}
              ></textarea>
              {error?.length > 0 ? (
                <p className="m-2 p-2 text-xl text-red-600" role="alert">
                  {error}
                </p>
              ) : (
                <p className="m-2 p-2"></p>
              )}
              <button
                type="submit"
                aria-label="Send"
                title="Send"
                role="button"
                aria-disabled={loading}
                onClick={(event) => {
                  event.preventDefault();
                  validateAndSend();
                }}
                className="hover:scale-101 mb-4 flex transform items-center justify-center rounded bg-blue-500 px-2 py-4 text-gray-100 duration-200 ease-in-out hover:opacity-90 dark:bg-blue-200 dark:text-gray-500"
                disabled={loading}
              >
                {buttonContent}
              </button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
