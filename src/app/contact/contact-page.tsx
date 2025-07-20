'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';
import { useIntl } from 'react-intl';

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
  } catch {}
};

export default function ContactPage() {
  const { formatMessage } = useIntl();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const validateAndSend = (): void => {
    if (name === '') {
      setError(formatMessage({ id: 'contact.please_enter_name' }));
      return;
    }
    if (email === '') {
      setError(formatMessage({ id: 'contact.please_enter_email' }));
      return;
    }
    if (!isValidEmail(email)) {
      setError(formatMessage({ id: 'contact.please_enter_valid_email' }));
      return;
    }
    if (message === '') {
      setError(formatMessage({ id: 'contact.please_enter_message' }));
      return;
    }
    setLoading(true);
    sendFeedback(name, email, message)
      .then((response) => {
        setLoading(false);
        if (response?.status === 200) {
          setFormSubmitted(true);
        } else {
          setError(formatMessage({ id: 'contact.error_sending_message' }));
        }
      })
      .catch(() => {
        setError(formatMessage({ id: 'contact.error_sending_message' }));
      });
  };

  const buttonContent = loading ? (
    <Loader message={formatMessage({ id: 'contact.sending' })} rightIcon />
  ) : (
    <div className="flex flex-row-reverse gap-2">
      <span className="mr-2 text-3xl font-bold">
        {formatMessage({ id: 'contact.send' })}
      </span>
      <Image
        src={sendSVG}
        alt={formatMessage({ id: 'contact.send' })}
        width={40}
        height={40}
      />
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
            {formatMessage({ id: 'contact.thank_you_for_contacting' })}
          </p>
          <Link href="/" className="mt-4 flex items-center space-x-2">
            <button className="text-2xl font-bold hover:underline">
              {formatMessage({ id: 'contact.back_to_home' })}
            </button>
          </Link>
        </div>
      ) : (
        <div className="p-2 md:p-8">
          <h1 className="mb-20 text-center text-5xl font-bold">
            {formatMessage({ id: 'contact.contact_us' })}
          </h1>
          <section className="container mx-auto max-w-2xl" dir="rtl">
            <form className="flex flex-col">
              <input
                type="text"
                required
                className="mb-4 border-b-2 border-gray-400 px-8 py-2 text-3xl ring-black focus:ring-4"
                id="name"
                placeholder={formatMessage({ id: 'contact.name' })}
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
                placeholder={formatMessage({ id: 'contact.email' })}
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
                placeholder={formatMessage({ id: 'contact.message' })}
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
                aria-label={formatMessage({ id: 'contact.send' })}
                title={formatMessage({ id: 'contact.send' })}
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
