import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * Además del fingerprint guardamos el id de la boleta en una cookie: si el navegador
 * se actualiza y el fingerprint cambia, la cookie sigue impidiendo votar dos veces.
 */
export const BALLOT_COOKIE = "voto_id";

export async function findBallot(fingerprint: string | null) {
  const ballotId = (await cookies()).get(BALLOT_COOKIE)?.value;
  const or = [
    ...(fingerprint ? [{ fingerprint }] : []),
    ...(ballotId ? [{ id: ballotId }] : []),
  ];
  if (or.length === 0) return null;
  return prisma.ballot.findFirst({
    where: { OR: or },
    include: { items: { include: { work: { select: { studentName: true } } }, orderBy: { points: "desc" } } },
  });
}

export async function rememberBallot(ballotId: string) {
  (await cookies()).set(BALLOT_COOKIE, ballotId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
