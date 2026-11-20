import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';

const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
});

const sans = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Dreamscape',
  description: 'An interactive 3D dream in four worlds: The Awakening, The Void, The Deep and The Ascension.',
};

export const viewport: Viewport = {
  themeColor: '#f3c4b8',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} is-locked`}>
      <body>{children}</body>
    </html>
  );
}
