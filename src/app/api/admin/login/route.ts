import { NextResponse } from "next/server";
import { checkPassword, startAdminSession } from "@/lib/auth";

export async function POST(request: Request) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "Falta configurar la variable ADMIN_PASSWORD en Vercel." },
      { status: 500 },
    );
  }
  const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
  const password = typeof body?.password === "string" ? body.password : "";

  if (!checkPassword(password)) {
    // Pequeña demora para desalentar la fuerza bruta.
    await new Promise((resolve) => setTimeout(resolve, 600));
    return NextResponse.json({ error: "Contraseña incorrecta." }, { status: 401 });
  }

  await startAdminSession();
  return NextResponse.json({ ok: true });
}
