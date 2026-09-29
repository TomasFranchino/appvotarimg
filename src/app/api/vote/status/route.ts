import { NextResponse } from "next/server";
import { z } from "zod";
import { findBallot } from "@/lib/ballot";
import { getCourseBySlug, getTotalVotes } from "@/lib/queries";
import type { VoteStatus } from "@/lib/types";

const bodySchema = z.object({
  courseSlug: z.string().trim().min(1).max(40),
  fingerprint: z.string().trim().max(200).nullish(),
});

/** POST para no poner el fingerprint en la URL. */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const course = await getCourseBySlug(parsed.data.courseSlug);
  if (!course) return NextResponse.json({ error: "El curso no existe." }, { status: 404 });

  const [ballot, totalVotes] = await Promise.all([
    findBallot(course.id, parsed.data.fingerprint || null),
    getTotalVotes(course.id),
  ]);

  const status: VoteStatus = {
    hasVoted: Boolean(ballot),
    votingOpen: course.votingOpen,
    totalVotes,
    picks: ballot?.items.map((item) => ({ points: item.points, studentName: item.work.studentName })) ?? [],
  };
  return NextResponse.json(status);
}
