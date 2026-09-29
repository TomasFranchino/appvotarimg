import type { Metadata } from "next";
import { ResultsBoard } from "@/components/results-board";
import { isAdmin } from "@/lib/auth";
import { getResults, getSettings, getTotalVotes } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Resultados · Expectativa vs. Realidad" };

export default async function ResultsPage() {
  const [settings, totalVotes, admin] = await Promise.all([getSettings(), getTotalVotes(), isAdmin()]);
  const hidden = !settings.showResults && !admin;

  return (
    <ResultsBoard
      initial={{
        hidden,
        totalVotes,
        rows: hidden ? [] : await getResults(),
        updatedAt: new Date().toISOString(),
      }}
    />
  );
}
