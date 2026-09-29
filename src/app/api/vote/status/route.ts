import { NextResponse } from "next/server";
import { z } from "zod";
import { findBallot } from "@/lib/ballot";
import { getSettings, getTotalVotes } from "@/lib/queries";
import type { VoteStatus } from "@/lib/types";

const bodySchema = z.object({ fingerprint: z.string().trim().max(200).nullish() });

/** POST para no poner el fingerprint en la URL. */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  const fingerprint = parsed.success ? parsed.data.fingerprint || null : null;

  const [ballot, settings, totalVotes] = await Promise.all([
    findBallot(fingerprint),
    getSettings(),
    getTotalVotes(),
  ]);

  const status: VoteStatus = {
    hasVoted: Boolean(ballot),
    votingOpen: settings.votingOpen,
    totalVotes,
    picks: ballot?.items.map((item) => ({ points: item.points, studentName: item.work.studentName })) ?? [],
  };
  return NextResponse.json(status);
}
