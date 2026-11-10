import { redirect } from 'next/navigation';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Reciter pages are Arabic documents. The English URL is a canonicalised twin,
 * so it sends the visitor to the document the canonical names.
 */
export default async function Page({ params, searchParams }: Props) {
  const { id } = await params;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === 'string') query.set(key, value);
  }
  const suffix = query.size > 0 ? `?${query.toString()}` : '';
  redirect(`/reciter/${id}${suffix}`);
}
