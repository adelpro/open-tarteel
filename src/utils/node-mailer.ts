import nodmailer from 'nodemailer';

import { serverConfig } from './config';

const email = serverConfig.FEED_BACK_EMAIL;
const pass = serverConfig.FEED_BACK_PASSWORD;
const service = serverConfig.FEED_BACK_SERVICE;
const host = serverConfig.FEED_BACK_HOST;
const port = serverConfig.FEED_BACK_PORT;

export const transporter = nodmailer.createTransport({
  service,
  host,
  port,
  auth: {
    user: email,
    pass,
  },
});
export const mailOptions = {
  from: email,
  to: email,
};
