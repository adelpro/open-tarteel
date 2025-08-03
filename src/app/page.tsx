import { redirect } from 'next/navigation';

export default function RootPage() {
  console.log('Root page component rendering');
  redirect('/ar');
}
