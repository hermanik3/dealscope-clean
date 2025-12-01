import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Image from "next/image";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://dealscope.shop"), // your live domain
  title: "DealScope – Find anything at the lowest price online",
  description:
    "DealScope is a sale-focused product search engine that scans trusted retailers like Amazon and Best Buy to find the best live price.",

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/dealscope-logo-192.png",
  },

  openGraph: {
    title: "DealScope – Lowest price search",
    description:
      "Compare live prices from trusted retailers and jump straight to the best deal.",
    url: "https://dealscope.shop",
    siteName: "DealScope",
    images: [
      {
        url: "/dealscope-logo-512.png",
        width: 512,
        height: 512,
        alt: "DealScope logo",
      },
    ],
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
      <head>
        <script
          type="application/ld+json"
          // app router way to embed JSON-LD
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
