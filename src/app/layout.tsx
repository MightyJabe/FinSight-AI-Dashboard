import '@/app/globals.css';

import { Inter } from 'next/font/google';

import { ClientWrapper } from '@/components/layout/ClientWrapper';

const inter = Inter({ subsets: ['latin'] });

/** Root layout component that wraps the entire application */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>FinSight AI Dashboard</title>
        <meta name="description" content="Your AI-powered financial dashboard" />
      </head>
      <body className={inter.className}>
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}
