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
  title: "Fourchette — Pizza campus",
  description: "La pizza qui arrive avant la sonnerie.",
  applicationName: "Fourchette",
  appleWebApp: { capable: true, title: "Fourchette", statusBarStyle: "default" },
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
};

export const viewport = { themeColor: "#e54b2a", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${dmSans.variable} ${fraunces.variable}`}>
      <body>{children}<PwaRegister /></body>
    </html>
  );
}
