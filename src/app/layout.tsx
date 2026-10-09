import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pizza del Bosco — Pizzeria du campus",
  description: "Pizzas artisanales, commande en ligne et retrait au camion.",
  applicationName: "Pizza del Bosco",
  appleWebApp: { capable: true, title: "Pizza del Bosco", statusBarStyle: "default" },
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
  openGraph: {
    title: "Pizza del Bosco — Pizzeria du campus",
    description: "Pizzas artisanales, commande en ligne et retrait au camion.",
    siteName: "Pizza del Bosco",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Pizza del Bosco — Pizzeria du campus",
    description: "Pizzas artisanales, commande en ligne et retrait au camion.",
  },
};

export const viewport = { themeColor: "#e54b2a", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${dmSans.variable} ${fraunces.variable}`}>
      <body>{children}<PwaRegister /></body>
    </html>
  );
}
