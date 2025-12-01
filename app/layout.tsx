import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Image from "next/image";

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "DealScope",
  url: "https://dealscope.com", // ← change to your real domain
  logo: "https://dealscope.com/dealscope-logo-192.png", // ← full URL to your logo
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "DealScope",
  description: "DealScope is a sale-focused product search engine.",
  icons: {
    icon: "/dealscope-logo-512.png",
    shortcut: "/dealscope-logo-512.png",
    apple: "/dealscope-logo-512.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DealScope",
    url: "https://dealscope.shop",
    logo: "https://dealscope.shop/dealscope-logo-512.png",
  };

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
