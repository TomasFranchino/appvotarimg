import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** DELETE /api/admin/ballots?courseId=… — reinicia la votación de un curso. */
export async function DELETE(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const courseId = new URL(request.url).searchParams.get("courseId");
  if (!courseId) return NextResponse.json({ error: "Falta el curso" }, { status: 400 });

  const { count } = await prisma.ballot.deleteMany({ where: { courseId } });
  return NextResponse.json({ ok: true, count });
}
