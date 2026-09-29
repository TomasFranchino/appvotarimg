import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getResults, getSettings, getTotalVotes } from "@/lib/queries";
import type { ResultsPayload } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const [settings, totalVotes, admin] = await Promise.all([getSettings(), getTotalVotes(), isAdmin()]);
  const hidden = !settings.showResults && !admin;

  const payload: ResultsPayload = {
    hidden,
    totalVotes,
    rows: hidden ? [] : await getResults(),
    updatedAt: new Date().toISOString(),
  };
  return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
}
