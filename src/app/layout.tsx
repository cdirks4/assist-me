import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SubgraphProvider from "@/providers/SubgraphProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Assist Me",
  description: "AI-powered DeFi assistant on Mantle",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SubgraphProvider>
          {children}
        </SubgraphProvider>
      </body>
    </html>
  );
}
