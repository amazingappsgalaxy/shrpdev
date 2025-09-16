import { redirect } from 'next/navigation';

export default function EditorPage() {
  // Redirect to dashboard by default
  redirect('/editor/dashboard');
}
