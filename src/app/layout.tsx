import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PrivyProviderWrapper } from "@/providers/PrivyProvider";
import SubgraphProvider from "@/providers/SubgraphProvider";
import { NavBar } from "@/components/NavBar";
import { AgentWalletProvider } from "@/context/AgentWalletContext";
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
        <PrivyProviderWrapper>
          <SubgraphProvider>
            <AgentWalletProvider>
              <NavBar />
              {children}
            </AgentWalletProvider>
          </SubgraphProvider>
        </PrivyProviderWrapper>
      </body>
    </html>
  );
}
