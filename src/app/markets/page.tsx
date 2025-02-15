import MarketOverview from "@/components/MarketOverview";

export default function MarketsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <main className="max-w-7xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8 px-4">Market Overview</h1>
        <MarketOverview />
      </main>
    </div>
  );
}