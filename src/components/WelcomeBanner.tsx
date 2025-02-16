"use client";

import { Card, CardContent } from "./ui/Card";

export function WelcomeBanner() {
  return (
    <Card className="mb-4 bg-gradient-to-r from-purple-900/50 to-blue-900/50">
      <CardContent className="p-4">
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-white/90">
            Welcome to the DeFi trading assistant! I can help you with:
          </p>
          <ul className="list-disc list-inside space-y-1 text-white/80">
            <li>
              Trading tokens (e.g., &apos;wrap 0.1 MNT or unwrap 1 WMNT&apos;)
            </li>
            <li>
              Market analysis (e.g., &apos;how&apos;s the market doing?&apos;)
            </li>
            <li>
              Portfolio management (e.g., &apos;show my wallet balance&apos;)
            </li>
            <li>Pool information (e.g., &apos;show top pools&apos;)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
