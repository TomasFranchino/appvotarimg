import "server-only";
import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "admin_session";

function sha256(value: string) {
  return createHash("sha256").update(value).digest();
}

/** El token de sesión deriva de la contraseña: cambiarla invalida todas las sesiones. */
function sessionToken() {
  const password = process.env.ADMIN_PASSWORD;
  return password ? sha256(`votacion-admin:${password}`).toString("hex") : null;
}

function safeEqual(a: string, b: string) {
  return timingSafeEqual(sha256(a), sha256(b));
}

export function checkPassword(input: string) {
  const password = process.env.ADMIN_PASSWORD;
  return Boolean(password) && safeEqual(input, password!);
}

export async function isAdmin() {
  const token = sessionToken();
  const cookie = (await cookies()).get(COOKIE)?.value;
  return Boolean(token && cookie && safeEqual(cookie, token));
}

export async function startAdminSession() {
  (await cookies()).set(COOKIE, sessionToken()!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function endAdminSession() {
  (await cookies()).delete(COOKIE);
}
