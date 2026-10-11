import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Watermark } from '../components/Watermark';

export const metadata: Metadata = {
  title: 'Irshad English School — Digital Achievement Exhibition (Inspection 2024–2026)',
  description: 'Official digital achievement exhibition for Irshad English School, Melattur, Malappuram, Kerala (CBSE Affiliation No. 930636). Curated for the School Inspection Committee.',
  keywords: [
    'Irshad English School',
    'Melattur',
    'CBSE 930636',
    'School Inspection',
    'Digital Achievement Exhibition',
    'Kerala School Achievements',
  ],
  authors: [{ name: 'Irshad English School' }],
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0f2b5c',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f8fafc] text-slate-900 antialiased selection:bg-blue-600 selection:text-white relative">
        {children}
        <Watermark />
      </body>
    </html>
  );
}

