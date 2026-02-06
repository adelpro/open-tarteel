import { NextRequest, NextResponse } from 'next/server';

import { clientConfig, isValidEmail, sanitizeHTML } from '@/utils';
import { mailOptions, transporter } from '@/utils/node-mailer';

// In-memory store for IPs and request counts (Limit: 5 requests per minute per user)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const LIMIT = 5;
const WINDOW_MS = 60 * 1000;

export async function POST(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : '127.0.0.1';
  const now = Date.now();
  const userData = rateLimitMap.get(ip) || { count: 0, lastReset: now };

  // Reset counter if the time window has passed
  if (now - userData.lastReset > WINDOW_MS) {
    userData.count = 0;
    userData.lastReset = now;
  }

  // Check if user exceeded the limit
  if (userData.count >= LIMIT) {
    return NextResponse.json(
      { message: 'Too many requests, please try again later.' },
      { status: 429, statusText: 'Too Many Requests' }
    );
  }

  userData.count++;
  rateLimitMap.set(ip, userData);

  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !isValidEmail(email) || !message) {
      return NextResponse.json(
        { message: 'Invalid data' },
        { status: 422, statusText: 'Unprocessable Entity' }
      );
    }

    const safeName = sanitizeHTML(name);
    const safeEmail = sanitizeHTML(email);
    const safeMessage = sanitizeHTML(message);

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
