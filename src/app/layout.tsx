import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { prisma } from "@/lib/prisma";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Laura's Pots",
  description: "Handmade pottery by Laura. Find your perfect piece.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let heroImageUrl: string | null = null;

  try {
    const hero = await prisma.heroImage.findFirst({
      where: { active: true },
      orderBy: { order: 'asc' },
    });
    heroImageUrl = hero?.imageUrl ?? null;
  } catch {
    // DB not available, fall back to gradient
  }

  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body
        className="min-h-full flex flex-col items-center"
        style={heroImageUrl
          ? { background: '#e8e0d8' }
          : { background: 'radial-gradient(ellipse at center, #f5f5f5 0%, #d4d4d4 60%, #a3a3a3 100%)' }
        }
      >
        {/* Blurred faded hero background */}
        {heroImageUrl && (
          <div
            className="fixed inset-0 pointer-events-none"
            style={{
              backgroundImage: `url(${heroImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(12px) brightness(3.5) saturate(5)',
              transform: 'scale(1.5)',
              opacity: '.25'
            }}
            aria-hidden="true"
          />
        )}

        {/* Mobile frame */}
        <div className="relative w-full max-w-[430px] min-h-screen bg-white shadow-2xl flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}