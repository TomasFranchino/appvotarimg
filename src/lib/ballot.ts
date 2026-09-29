import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * Además del fingerprint guardamos el id de la boleta en una cookie (una por curso): si el
 * navegador se actualiza y el fingerprint cambia, la cookie sigue impidiendo votar dos veces.
 */
const ballotCookie = (courseId: string) => `voto_${courseId}`;

export async function findBallot(courseId: string, fingerprint: string | null) {
  const ballotId = (await cookies()).get(ballotCookie(courseId))?.value;
  const or = [
    ...(fingerprint ? [{ fingerprint }] : []),
    ...(ballotId ? [{ id: ballotId }] : []),
  ];
  if (or.length === 0) return null;
  return prisma.ballot.findFirst({
    where: { courseId, OR: or },
    include: { items: { include: { work: { select: { studentName: true } } }, orderBy: { points: "desc" } } },
  });
}

export async function rememberBallot(courseId: string, ballotId: string) {
  (await cookies()).set(ballotCookie(courseId), ballotId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
