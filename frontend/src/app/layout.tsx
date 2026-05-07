import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import HeaderTitle from '@/components/HeaderTitle';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SSC Results Analytics',
  description: 'SSC Results Analytics Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.className} bg-surface-bright text-on-surface antialiased min-h-screen flex flex-col`}>
        <Sidebar />
        <div className="ml-72 min-h-screen flex flex-col">
          <header className="h-16 bg-surface-container-lowest border-b border-outline-variant shadow-sm flex items-center justify-between px-6 sticky top-0 z-40">
            <HeaderTitle />
          </header>
          <main className="flex-1 p-10 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
