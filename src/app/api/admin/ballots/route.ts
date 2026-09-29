import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Reinicia la votación: borra todas las boletas. */
export async function DELETE() {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { count } = await prisma.ballot.deleteMany();
  return NextResponse.json({ ok: true, count });
}
