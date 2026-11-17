import SettingsPage from '@/app/(ar)/settings/page';

/**
 * The settings screen is the same component in every language; what differs is
 * the layout around it. Serving it from its own route, rather than rewriting the
 * Arabic one, is what makes the server render `<html lang="en">` and English
 * copy on the first paint instead of correcting it after hydration.
 */
export default function Page() {
  return <SettingsPage />;
}
