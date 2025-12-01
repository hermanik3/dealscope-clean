// app/layout.tsx
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Site Metadata
export const metadata: Metadata = {
  metadataBase: new URL("https://dealscope.shop"),
  title: "DealScope – Find the lowest price online",
  description:
    "DealScope is a sale-focused product search engine that finds the lowest prices across trusted retailers.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/dealscope-logo-192.png",
  },
};

// JSON-LD Organization Schema
const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "DealScope",
  url: "https://dealscope.shop",
  logo: "https://dealscope.shop/dealscope-logo-192.png",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
