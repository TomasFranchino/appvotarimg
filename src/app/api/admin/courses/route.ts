import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth";
import { courseFields, slugTakenResponse } from "@/lib/course-schema";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const parsed = z.object(courseFields).safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }

  try {
    const course = await prisma.course.create({ data: parsed.data });
    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    const response = slugTakenResponse(error);
    if (response) return response;
    throw error;
  }
}
