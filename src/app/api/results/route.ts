import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getCourseBySlug, getResults, getTotalVotes } from "@/lib/queries";
import type { ResultsPayload } from "@/lib/types";

export const dynamic = "force-dynamic";

/** GET /api/results?curso=<slug> */
export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("curso") ?? "";
  const course = await getCourseBySlug(slug);
  if (!course) return NextResponse.json({ error: "El curso no existe." }, { status: 404 });

  const [totalVotes, admin] = await Promise.all([getTotalVotes(course.id), isAdmin()]);
  const hidden = !course.showResults && !admin;

  const payload: ResultsPayload = {
    hidden,
    totalVotes,
    rows: hidden ? [] : await getResults(course.id),
    updatedAt: new Date().toISOString(),
  };
  return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
}
