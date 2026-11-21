'use client';

import Image from 'next/image';
import React, { useState } from 'react';
import { useIntl } from 'react-intl';

import Loader from '@/components/loader';
import LocalizedLink from '@/components/localized-link';
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
    <div className="flex min-h-[70vh] w-full flex-col items-center justify-center gap-6 p-4 md:p-8">
      <h1 className="text-center text-2xl font-bold text-ink">
        {formatMessage({ id: 'contact.contact_us' })}
      </h1>
      {formSubmitted ? (
        <div
          className="flex w-full max-w-lg animate-fade-up flex-col items-center justify-center gap-6 rounded-3xl border border-border bg-surface p-10"
          dir={formatMessage({ id: 'contact.send' }) === 'Send' ? 'ltr' : 'rtl'}
        >
          <div className="flex size-24 items-center justify-center rounded-full bg-surface-sunken text-success">
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
            className="text-center text-3xl font-bold text-ink"
            role="alert"
          >
            {formatMessage({ id: 'contact.thank_you_for_contacting' })}
          </p>
          <LocalizedLink href="/" className="mt-4 flex w-full justify-center">
            <button className="w-full rounded-xl border border-border bg-surface px-6 py-4 text-lg font-bold text-ink transition-colors duration-180 hover:bg-surface-sunken focus-ring">
              {formatMessage({ id: 'contact.back_to_home' })}
            </button>
          </LocalizedLink>
        </div>
      ) : (
        <div className="w-full max-w-2xl animate-fade-up">
          <div className="rounded-3xl border border-border bg-surface p-6 sm:p-10">
            <form
              className="flex flex-col gap-6"
              dir={
                formatMessage({ id: 'contact.send' }) === 'Send' ? 'ltr' : 'rtl'
              }
            >
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-bold text-ink"
                >
                  {formatMessage({ id: 'contact.name' })}
                </label>
                <input
                  type="text"
                  required
                  className="w-full rounded-xl border border-border bg-surface-sunken p-4 text-lg text-ink transition-colors duration-180 focus:border-strong focus:bg-surface focus-ring"
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
                  className="mb-2 block text-sm font-bold text-ink"
                >
                  {formatMessage({ id: 'contact.email' })}
                </label>
                <input
                  type="email"
                  required
                  className="w-full rounded-xl border border-border bg-surface-sunken p-4 text-lg text-ink transition-colors duration-180 focus:border-strong focus:bg-surface focus-ring"
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
                  className="mb-2 block text-sm font-bold text-ink"
                >
                  {formatMessage({ id: 'contact.message' })}
                </label>
                <textarea
                  className="w-full rounded-xl border border-border bg-surface-sunken p-4 text-lg text-ink transition-colors duration-180 focus:border-strong focus:bg-surface focus-ring"
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
                  className="rounded-lg bg-surface-sunken p-4 text-danger"
                  role="alert"
                >
                  <p className="text-sm font-bold">{error}</p>
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
                className="mt-2 flex w-full items-center justify-center rounded-xl bg-primary py-4 text-lg font-bold text-on-primary transition-colors duration-180 hover:bg-primary-hover disabled:opacity-70"
                disabled={loading}
              >
                {buttonContent}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
