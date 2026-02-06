import { NextRequest, NextResponse } from 'next/server';

import { clientConfig, isValidEmail, sanitizeHTML } from '@/utils';
import { mailOptions, transporter } from '@/utils/node-mailer';

// --- إضافة نظام الـ Rate Limiting ---
// تخزين مؤقت للـ IPs وعدد الطلبات (بحد أقصى 5 طلبات في الدقيقة لكل مستخدم)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const LIMIT = 5;
const WINDOW_MS = 60 * 1000; // دقيقة واحدة

export async function POST(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : '127.0.0.1';
  const now = Date.now();
  const userData = rateLimitMap.get(ip) || { count: 0, lastReset: now };

  // إعادة تصغير العداد لو مر وقت أكثر من دقيقة
  if (now - userData.lastReset > WINDOW_MS) {
    userData.count = 0;
    userData.lastReset = now;
  }

  // إذا تخطى المستخدم الحد المسموح (أكثر من 5 طلبات)
  if (userData.count >= LIMIT) {
    return NextResponse.json(
      { message: 'Too many requests, please try again later.' },
      { status: 429, statusText: 'Too Many Requests' }
    );
  }

  // تحديث بيانات العداد للمستخدم
  userData.count++;
  rateLimitMap.set(ip, userData);

  // --- تكملة الكود الأصلي بعد الحماية ---
  try {
    const { name, email, message } = await request.json();

    // التحقق من صحة البيانات
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
