import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { findBallot, rememberBallot } from "@/lib/ballot";
import { getCourseBySlug } from "@/lib/queries";
import { POINTS } from "@/lib/types";

const voteSchema = z.object({
  courseSlug: z.string().trim().min(1).max(40),
  fingerprint: z.string().trim().min(8).max(200),
  nickname: z.string().trim().max(40).nullish(),
  // picks[0] = 1º lugar (3 pts), picks[1] = 2º (2 pts), picks[2] = 3º (1 pt)
  picks: z.tuple([z.string().min(1), z.string().min(1), z.string().min(1)]),
});

export async function POST(request: Request) {
  const parsed = voteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de voto inválidos." }, { status: 400 });
  }
  const { courseSlug, fingerprint, nickname, picks } = parsed.data;

  if (new Set(picks).size !== 3) {
    return NextResponse.json({ error: "Tenés que elegir 3 trabajos distintos." }, { status: 400 });
  }

  const course = await getCourseBySlug(courseSlug);
  if (!course) {
    return NextResponse.json({ error: "El curso no existe." }, { status: 404 });
  }
  if (!course.votingOpen) {
    return NextResponse.json({ error: "La votación está cerrada." }, { status: 403 });
  }

  if (await findBallot(course.id, fingerprint)) {
    return NextResponse.json({ error: "Ya votaste desde este dispositivo." }, { status: 409 });
  }

  // Los 3 trabajos tienen que existir y ser de este curso.
  const existing = await prisma.work.count({ where: { id: { in: picks }, courseId: course.id } });
  if (existing !== 3) {
    return NextResponse.json(
      { error: "Alguno de los trabajos ya no existe. Recargá la página." },
      { status: 400 },
    );
  }

  try {
    const ballot = await prisma.ballot.create({
      data: {
        courseId: course.id,
        fingerprint,
        nickname: nickname || null,
        items: { create: picks.map((workId, i) => ({ workId, points: POINTS[i] })) },
      },
    });
    await rememberBallot(course.id, ballot.id);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Ya votaste desde este dispositivo." }, { status: 409 });
    }
    throw error;
  }
}
