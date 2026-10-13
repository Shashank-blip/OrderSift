import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OrderSift | From messy messages to orders you can act on",
  description: "Local-first order extraction powered by Qwen 2.5 Instruct & IndexedDB. Zero cloud data leaks, zero API costs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-brand-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
