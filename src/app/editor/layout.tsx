import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

interface EditorLayoutProps {
  children: ReactNode;
}

export default async function EditorLayout({ children }: EditorLayoutProps) {
  // Check authentication
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;

  if (!token) {
    redirect('/editor/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-lg min-h-screen">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800">Sharpii Editor</h1>
          </div>
          <nav className="mt-6">
            <ul className="space-y-2">
              <li>
                <a href="/editor/dashboard" className="block px-6 py-3 text-gray-700 hover:bg-gray-100">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="/editor/editor-page" className="block px-6 py-3 text-gray-700 hover:bg-gray-100">
                  Editor
                </a>
              </li>
              <li>
                <a href="/editor/gallery" className="block px-6 py-3 text-gray-700 hover:bg-gray-100">
                  Gallery
                </a>
              </li>
              <li>
                <a href="/editor/upload" className="block px-6 py-3 text-gray-700 hover:bg-gray-100">
                  Upload
                </a>
              </li>
              <li>
                <a href="/editor/jobs" className="block px-6 py-3 text-gray-700 hover:bg-gray-100">
                  Jobs
                </a>
              </li>
              <li>
                <a href="/editor/tebi-settings" className="block px-6 py-3 text-gray-700 hover:bg-gray-100">
                  Tebi Settings
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
