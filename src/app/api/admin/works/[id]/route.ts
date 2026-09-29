import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Borra el trabajo, sus votos asociados (cascade) y las dos imágenes del Blob. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const work = await prisma.work.findUnique({ where: { id } });
  if (!work) return NextResponse.json({ error: "No existe" }, { status: 404 });

  await prisma.work.delete({ where: { id } });
  try {
    await del([work.expectationUrl, work.realityUrl]);
  } catch (error) {
    console.error("No se pudieron borrar las imágenes del Blob", error);
  }
  return NextResponse.json({ ok: true });
}
