import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trice — fifteen minutes, spent well",
  description:
    "One concept a day. Engineering, leadership, and the business sense that makes both worth doing.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
