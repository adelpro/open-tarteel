import { NextRequest, NextResponse } from 'next/server';

import { clientConfig, isValidEmail, sanitizeHTML } from '@/utils';
import { mailOptions, transporter } from '@/utils/node-mailer';

// --- Rate Limiting Logic ---
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const LIMIT = 5;
const WINDOW_MS = 60 * 1000;

// Periodic cleanup to prevent memory leaks (Fix for CodeRabbit)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap) {
    if (now - value.lastReset > WINDOW_MS) {
      rateLimitMap.delete(key);
    }
  }
}, WINDOW_MS);

export async function POST(request: NextRequest) {
  // Identify user IP and trim it (Fix for CodeRabbit)
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

  const now = Date.now();
  const userData = rateLimitMap.get(ip) || { count: 0, lastReset: now };

  if (now - userData.lastReset > WINDOW_MS) {
    userData.count = 0;
    userData.lastReset = now;
  }

  if (userData.count >= LIMIT) {
    return NextResponse.json(
      { message: 'Too many requests, please try again later.' },
      { status: 429, statusText: 'Too Many Requests' }
    );
  }

  // We only increment AFTER parsing the body to be fair to the user
  let body: { name: string; email: string; message: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: 'Invalid JSON body' },
      { status: 400, statusText: 'Bad Request' }
    );
  }

  userData.count++;
  rateLimitMap.set(ip, userData);

  const { name, email, message } = body;

  if (!name || !email || !isValidEmail(email) || !message) {
    return NextResponse.json(
      { message: 'Invalid data' },
      { status: 422, statusText: 'Unprocessable Entity' }
    );
  }

  try {
    const safeName = sanitizeHTML(name);
    const safeEmail = sanitizeHTML(email);
    const safeMessage = sanitizeHTML(message);

    await transporter.sendMail({
      ...mailOptions,
      subject: `${clientConfig.APP_NAME} - feedback`,
      text: `Contact form submitted from ${clientConfig.APP_NAME}\nName: ${safeName}\nEmail: ${safeEmail}\nMessage: ${safeMessage}`,
      html: `
        <section style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
          <header><h1 style="color: #0066cc;">Contact form submitted from ${clientConfig.APP_NAME}</h1></header>
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Message:</strong> ${safeMessage}</p>
        </section>`,
    });

    return NextResponse.json({ message: 'Feedback sent successfully' });
  } catch {
    return NextResponse.json(
      { message: 'Failed to send feedback, Please try again later.' },
      { status: 500, statusText: 'Internal Server Error' }
    );
  }
}
