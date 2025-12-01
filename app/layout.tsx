// app/layout.tsx
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

// 1) Metadata (title, description, icons)
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

// 2) JSON-LD for Organization + Logo
const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "DealScope",
  url: "https://dealscope.shop",
  logo: {
    "@type": "ImageObject",
    url: "https://dealscope.shop/dealscope-logo-192.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "DealScope",
              "url": "https://dealscope.shop",
              "logo": "https://dealscope.shop/dealscope-logo-192.png"
            }),
          }}
        />
      </head>

      <body>
        {children}
      </body>
    </html>
  );
}

