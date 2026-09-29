import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { isAdmin } from "@/lib/auth";

/**
 * Genera tokens para que el navegador suba las fotos directo a Vercel Blob
 * (evita el límite de 4,5 MB del cuerpo de las funciones de Vercel).
 */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        if (!(await isAdmin())) throw new Error("No autorizado");
        return {
          allowedContentTypes: ["image/*"],
          maximumSizeInBytes: 25 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al subir";
    return NextResponse.json({ error: message }, { status: message === "No autorizado" ? 401 : 400 });
  }
}
