import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const blobUrl = z
  .url()
  .refine((u) => new URL(u).hostname.endsWith(".public.blob.vercel-storage.com"), "URL de imagen inválida");

const workSchema = z.object({
  courseId: z.string().min(1),
  studentName: z.string().trim().min(1, "Falta el nombre").max(60),
  expectationUrl: blobUrl,
  realityUrl: blobUrl,
});

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const parsed = workSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }

  const course = await prisma.course.findUnique({ where: { id: parsed.data.courseId } });
  if (!course) return NextResponse.json({ error: "El curso no existe" }, { status: 404 });

  const work = await prisma.work.create({ data: parsed.data });
  return NextResponse.json(work, { status: 201 });
}
