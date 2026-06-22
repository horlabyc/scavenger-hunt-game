import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Retreat SB 3.0 — Scavenger Hunt',
  description: 'Retreat SB 3.0 scavenger hunt — find, snap, score!',
};

export const viewport: Viewport = {
  themeColor: '#E34802',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
