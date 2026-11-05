import { NextResponse } from 'next/server';

import { clientConfig } from '@/utils';

// Never cache health checks.
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      name: clientConfig.APP_NAME,
      version: clientConfig.APP_VERSION,
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}
