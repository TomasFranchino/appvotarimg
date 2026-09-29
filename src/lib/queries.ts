import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { ResultRow, WorkDTO } from "@/lib/types";

const workSelect = { id: true, studentName: true, expectationUrl: true, realityUrl: true } as const;

export async function getCourses() {
  return prisma.course.findMany({ orderBy: { name: "asc" } });
}

/** Cacheada por request: la usan el layout y la página del mismo curso. */
export const getCourseBySlug = cache(async (slug: string) => {
  return prisma.course.findUnique({ where: { slug } });
});

export async function getWorks(courseId: string): Promise<WorkDTO[]> {
  return prisma.work.findMany({ where: { courseId }, select: workSelect, orderBy: { createdAt: "asc" } });
}

export async function getTotalVotes(courseId: string) {
  return prisma.ballot.count({ where: { courseId } });
}

/**
 * Ranking por puntos totales. Desempate: más 1º lugares, luego más 2º lugares.
 * Trabajos empatados en todo comparten posición (1, 2, 2, 4…).
 */
export async function getResults(courseId: string): Promise<ResultRow[]> {
  const [works, grouped] = await Promise.all([
    getWorks(courseId),
    prisma.voteItem.groupBy({
      by: ["workId", "points"],
      where: { work: { courseId } },
      _count: { _all: true },
    }),
  ]);

  const rows: ResultRow[] = works.map((w) => {
    const count = (pts: number) =>
      grouped.find((g) => g.workId === w.id && g.points === pts)?._count._all ?? 0;
    const firsts = count(3);
    const seconds = count(2);
    const thirds = count(1);
    return { ...w, firsts, seconds, thirds, points: firsts * 3 + seconds * 2 + thirds, rank: 0 };
  });

  rows.sort(
    (a, b) =>
      b.points - a.points ||
      b.firsts - a.firsts ||
      b.seconds - a.seconds ||
      a.studentName.localeCompare(b.studentName, "es"),
  );

  rows.forEach((row, i) => {
    const prev = rows[i - 1];
    const tied =
      prev && prev.points === row.points && prev.firsts === row.firsts && prev.seconds === row.seconds;
    row.rank = tied ? prev.rank : i + 1;
  });

  return rows;
}
