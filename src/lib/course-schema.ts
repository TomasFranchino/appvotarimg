import "server-only";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { SLUG_PATTERN } from "@/lib/slug";

export const courseFields = {
  name: z.string().trim().min(1, "Falta el nombre del curso").max(40),
  slug: z
    .string()
    .trim()
    .min(1, "Falta el link")
    .max(40)
    .regex(SLUG_PATTERN, "El link solo puede tener minúsculas, números y guiones"),
};

/** Respuesta 409 si el slug ya lo usa otro curso; null si el error es otro. */
export function slugTakenResponse(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return NextResponse.json({ error: "Ya existe un curso con ese link" }, { status: 409 });
  }
  return null;
}
