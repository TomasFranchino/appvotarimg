import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { z } from "zod";
import { isAdmin } from "@/lib/auth";
import { courseFields, slugTakenResponse } from "@/lib/course-schema";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  name: courseFields.name.optional(),
  slug: courseFields.slug.optional(),
  votingOpen: z.boolean().optional(),
  showResults: z.boolean().optional(),
});

/** Renombrar, cambiar el link o abrir/cerrar votación y resultados de un curso. */
export async function PATCH(request: Request, { params }: Params) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }

  const { id } = await params;
  try {
    const course = await prisma.course.update({ where: { id }, data: parsed.data });
    return NextResponse.json(course);
  } catch (error) {
    const response = slugTakenResponse(error);
    if (response) return response;
    throw error;
  }
}

/** Borra el curso con sus trabajos y votos (cascade) y las imágenes del Blob. */
export async function DELETE(_request: Request, { params }: Params) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const works = await prisma.work.findMany({ where: { courseId: id } });
  await prisma.course.deleteMany({ where: { id } });

  const urls = works.flatMap((w) => [w.expectationUrl, w.realityUrl]);
  if (urls.length > 0) {
    try {
      await del(urls);
    } catch (error) {
      console.error("No se pudieron borrar las imágenes del Blob", error);
    }
  }
  return NextResponse.json({ ok: true });
}
