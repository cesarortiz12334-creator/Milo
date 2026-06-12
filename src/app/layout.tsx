import type { Metadata } from "next";
import { Nunito, Inter } from "next/font/google";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Placeholder: el programador reemplaza NEXT_PUBLIC_SITE_URL por el dominio real.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://milofund.com";

const DESCRIPCION =
  "Plataforma chilena de financiamiento colectivo para atención veterinaria. Conectamos personas vulnerables con veterinarias y donantes.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Milo — Ayuda a una mascota a recuperarse",
    template: "%s · Milo",
  },
  description: DESCRIPCION,
  applicationName: "Milo",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "es_CL",
    siteName: "Milo",
    url: "/",
    title: "Milo — Ayuda a una mascota a recuperarse",
    description: DESCRIPCION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Milo — Ayuda a una mascota a recuperarse",
    description: DESCRIPCION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${nunito.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-warm-white font-body text-dark antialiased">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
