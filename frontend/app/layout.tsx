import "./globals.css";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import Providers from "./providers";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'AuraChat Support Suite',
  description: 'AI Document Chat Assistant',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-white text-slate-800 selection:bg-sky-500/20 selection:text-sky-900" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
