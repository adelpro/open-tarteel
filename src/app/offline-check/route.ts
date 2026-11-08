export const dynamic = 'force-dynamic';

/** Lightweight connectivity probe for the offline banner. */
export const GET = () => {
  return new Response('OK', {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
};
