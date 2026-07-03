import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trice — fifteen minutes, spent well",
  description:
    "One concept a day. Engineering, leadership, and the business sense that makes both worth doing.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="mx-auto max-w-5xl px-6 pt-8 pb-4">
          <Link href="/" className="font-serif text-lg italic text-foreground hover:text-primary">
            Trice
          </Link>
        </header>
        {children}
      </body>
    </html>
  );
}
