import "server-only";
import { prisma } from "@/lib/prisma";
import type { ResultRow, WorkDTO } from "@/lib/types";

const workSelect = { id: true, studentName: true, expectationUrl: true, realityUrl: true } as const;

export async function getWorks(): Promise<WorkDTO[]> {
  return prisma.work.findMany({ select: workSelect, orderBy: { createdAt: "asc" } });
}

export async function getSettings() {
  return prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
}

export async function getTotalVotes() {
  return prisma.ballot.count();
}

/**
 * Ranking por puntos totales. Desempate: más 1º lugares, luego más 2º lugares.
 * Trabajos empatados en todo comparten posición (1, 2, 2, 4…).
 */
export async function getResults(): Promise<ResultRow[]> {
  const [works, grouped] = await Promise.all([
    getWorks(),
    prisma.voteItem.groupBy({ by: ["workId", "points"], _count: { _all: true } }),
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
