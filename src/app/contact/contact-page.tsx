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
  } catch {
    // Handle error silently
  }
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
    <div
      className={`flex items-center justify-center gap-3 ${
        formatMessage({ id: 'contact.send' }) === 'Send'
          ? 'flex-row'
          : 'flex-row-reverse'
      }`}
    >
      <span className="text-xl font-bold">
        {formatMessage({ id: 'contact.send' })}
      </span>
      <Image
        src={sendSVG}
        alt={formatMessage({ id: 'contact.send' })}
        width={24}
        height={24}
      />
    </div>
  );

  return (
    <main className="flex min-h-[70vh] w-full items-center justify-center p-4 md:p-8">
      {formSubmitted ? (
        <div
          className="flex w-full max-w-lg animate-fade-up flex-col items-center justify-center gap-6 rounded-3xl border border-gray-200/60 bg-white/60 p-10 shadow-2xl backdrop-blur-xl dark:border-gray-700/60 dark:bg-gray-900/60"
          dir={formatMessage({ id: 'contact.send' }) === 'Send' ? 'ltr' : 'rtl'}
        >
          <div className="flex size-24 items-center justify-center rounded-full bg-green-100 text-green-600 shadow-inner dark:bg-green-900/30 dark:text-green-400">
            <svg
              className="size-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p
            className="text-center text-3xl font-bold text-gray-800 dark:text-gray-100"
            role="alert"
          >
            {formatMessage({ id: 'contact.thank_you_for_contacting' })}
          </p>
          <Link href="/" className="mt-4 flex w-full justify-center">
            <button className="w-full rounded-xl bg-gray-100 px-6 py-4 text-lg font-bold text-gray-700 transition-all hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:ring-gray-600">
              {formatMessage({ id: 'contact.back_to_home' })}
            </button>
          </Link>
        </div>
      ) : (
        <div className="w-full max-w-2xl animate-fade-up">
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 drop-shadow-sm dark:text-white sm:text-5xl">
              {formatMessage({ id: 'contact.contact_us' })}
            </h1>
          </div>
          <div className="rounded-3xl border border-gray-200/60 bg-white/60 p-6 shadow-2xl backdrop-blur-xl dark:border-gray-700/60 dark:bg-gray-900/60 sm:p-10">
            <form
              className="flex flex-col gap-6"
              dir={
                formatMessage({ id: 'contact.send' }) === 'Send' ? 'ltr' : 'rtl'
              }
            >
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  {formatMessage({ id: 'contact.name' })}
                </label>
                <input
                  type="text"
                  required
                  className="dark:focus:border-brand-CTA-blue-400 w-full rounded-xl border border-gray-300 bg-gray-50/50 p-4 text-lg text-gray-900 transition-all focus:border-brand-CTA-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-CTA-blue-500/20 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white dark:focus:bg-gray-800"
                  id="name"
                  placeholder={formatMessage({ id: 'contact.name' })}
                  value={name}
                  onChange={(event) => {
                    setError('');
                    setName(event.target.value);
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  {formatMessage({ id: 'contact.email' })}
                </label>
                <input
                  type="email"
                  required
                  className="dark:focus:border-brand-CTA-blue-400 w-full rounded-xl border border-gray-300 bg-gray-50/50 p-4 text-lg text-gray-900 transition-all focus:border-brand-CTA-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-CTA-blue-500/20 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white dark:focus:bg-gray-800"
                  id="email"
                  placeholder={formatMessage({ id: 'contact.email' })}
                  value={email}
                  onChange={(event) => {
                    setError('');
                    setEmail(event.target.value);
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  {formatMessage({ id: 'contact.message' })}
                </label>
                <textarea
                  className="dark:focus:border-brand-CTA-blue-400 w-full rounded-xl border border-gray-300 bg-gray-50/50 p-4 text-lg text-gray-900 transition-all focus:border-brand-CTA-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-CTA-blue-500/20 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white dark:focus:bg-gray-800"
                  id="message"
                  rows={4}
                  required
                  placeholder={formatMessage({ id: 'contact.message' })}
                  value={message}
                  onChange={(event) => {
                    setError('');
                    setMessage(event.target.value);
                  }}
                ></textarea>
              </div>

              {error?.length > 0 && (
                <div
                  className="rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                  role="alert"
                >
                  <p className="text-sm font-medium">{error}</p>
                </div>
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
                className="dark:to-brand-CTA-blue-400 dark:shadow-brand-CTA-blue-400/20 dark:hover:shadow-brand-CTA-blue-400/30 mt-2 flex w-full items-center justify-center rounded-xl bg-brand-CTA-blue-500 py-4 text-lg font-bold text-white shadow-lg shadow-brand-CTA-blue-500/30 transition-all duration-200 hover:scale-[1.02] hover:shadow-brand-CTA-blue-500/40 active:scale-[0.98] disabled:scale-100 disabled:opacity-70"
                disabled={loading}
              >
                {buttonContent}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
