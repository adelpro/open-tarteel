import nodemailer, { type Transporter } from 'nodemailer';

import { serverConfig } from './config';

const email = serverConfig.FEED_BACK_EMAIL;
const password = serverConfig.FEED_BACK_PASSWORD;
const service = serverConfig.FEED_BACK_SERVICE;
const host = serverConfig.FEED_BACK_HOST;
const port = serverConfig.FEED_BACK_PORT
  ? Number(serverConfig.FEED_BACK_PORT)
  : undefined;

/**
 * The feedback form is optional. When the mail credentials are missing we
 * return a clear 503 instead of failing with a confusing transport error.
 */
export const isMailConfigured = Boolean(email && password && (service || host));

let transporter: Transporter | null = null;

export const getTransporter = (): Transporter => {
  if (!isMailConfigured) {
    throw new Error('Feedback mail transport is not configured');
  }

  transporter ??= nodemailer.createTransport({
    service: service || undefined,
    host: host || undefined,
    port,
    secure: port === 465,
    auth: {
      user: email,
      pass: password,
    },
  });

  return transporter;
};

export const mailOptions = {
  from: email,
  to: email,
};
