import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'my-qrs.co',
    template: '%s — my-qrs.co',
  },
  description:
    'Your whole store. One QR code. Built for craft fair vendors and local sellers.',
  metadataBase: new URL('https://my-qrs.co'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geist.variable} h-full antialiased`}>
        <body
          className="min-h-full flex flex-col items-center"
          style={{
            background:
              'radial-gradient(ellipse at center, #f5f5f5 0%, #d4d4d4 60%, #a3a3a3 100%)',
          }}
        >
          <div className="relative w-full max-w-[430px] md:max-w-full min-h-screen bg-white md:shadow-none flex flex-col">
            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
