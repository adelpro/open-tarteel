import { NextRequest, NextResponse } from 'next/server';

import { clientConfig, isValidEmail } from '@/utils';
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

  try {
    await transporter.sendMail({
      ...mailOptions,
      subject: `${clientConfig.APP_NAME} - feedback`,
      text: `Contact form submitted on MD-Popme\n
               Name: ${name}\n
               Email: ${email}\n
              Message: ${message}`,
      html: `<div style="font-family: 'Arial', sans-serif; color: #333; padding: 20px;">
              <h1 style="color: #0066cc;">Contact form submitted from MD-Popme</h1>
              <p style="margin-bottom: 10px;"><strong>Name:</strong> ${name}</p>
              <p style="margin-bottom: 10px;"><strong>Email:</strong> ${email}</p>
              <p style="margin-bottom: 10px;"><strong>Message:</strong> ${message}</p>
             </div>`,
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
