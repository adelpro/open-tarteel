import { NextRequest, NextResponse } from 'next/server';

import { clientConfig, isValidEmail, sanitizeHTML } from '@/utils';
import { mailOptions, transporter } from '@/utils/node-mailer';

export async function POST(request: NextRequest) {
  const { name, email, message } = await request.json();

  //Validating the data
  if (!name || !email || !isValidEmail(email) || !message) {
    return NextResponse.json(
      { message: 'Invalid data' },
      { status: 422, statusText: 'Unprocessable Entity' }
    );
  }

  const safeName = sanitizeHTML(name);
  const safeEmail = sanitizeHTML(email);
  const safeMessage = sanitizeHTML(message);

  try {
    await transporter.sendMail({
      ...mailOptions,
      subject: `${clientConfig.APP_NAME} - feedback`,
      text: `Contact form submitted from ${clientConfig.APP_NAME}\n
    Name: ${safeName}\n
    Email: ${safeEmail}\n
    Message: ${safeMessage}`,
      html: `
        <section style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
          <header>
            <h1 style="color: #0066cc;">Contact form submitted from ${clientConfig.APP_NAME}</h1>
          </header>
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Message:</strong> ${safeMessage}</p>
        </section>
      `,
    });
    return NextResponse.json({ message: 'Feedback sent successfully' });
  } catch {
    return NextResponse.json(
      {
        message: 'Failed to send feedback, Please try again later.',
      },
      { status: 500, statusText: 'Internal Server Error' }
    );
  }
}
