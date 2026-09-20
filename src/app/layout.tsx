import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ibmPlexMono, ibmPlexSans } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gerador de CPFs",
  description: "Gere CPFs válidos e em lotes, com estado de origem controlado por você.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
