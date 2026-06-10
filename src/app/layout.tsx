import type { Metadata } from "next";
import { Nunito, Inter } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "Milo — Financiamiento colectivo veterinario",
  description:
    "Conecta a personas vulnerables con veterinarias verificadas y donantes para financiar la atención de sus mascotas. Cada mascota merece una segunda oportunidad.",
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
      </body>
    </html>
  );
}
