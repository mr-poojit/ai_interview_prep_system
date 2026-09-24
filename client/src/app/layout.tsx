import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../lib/authContext';
import { Navbar } from '../components/Navbar';

export const metadata: Metadata = {
  title: 'PrepKit AI - Personalized Interview Preparation Kits',
  description:
    'Turn any job description and company URL into a comprehensive, verified, editable interview prep kit with flashcards, mock interviews, and day-by-day schedules.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full bg-slate-950 text-slate-100 antialiased">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
