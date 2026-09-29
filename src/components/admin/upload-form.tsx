"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { ImagePlus, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resizeImage } from "@/lib/resize-image";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";

export function UploadForm({ courseId, courseSlug }: { courseId: string; courseSlug: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [expectation, setExpectation] = useState<File | null>(null);
  const [reality, setReality] = useState<File | null>(null);
  const [step, setStep] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !expectation || !reality) return;

    try {
      setStep("Optimizando fotos…");
      const [exp, real] = await Promise.all([resizeImage(expectation), resizeImage(reality)]);

      setStep("Subiendo fotos…");
      const slug = slugify(name) || "alumno";
      const opts = { access: "public" as const, handleUploadUrl: "/api/admin/upload" };
      const [expBlob, realBlob] = await Promise.all([
        upload(`trabajos/${courseSlug}/${slug}-expectativa.${exp.name.split(".").pop()}`, exp, opts),
        upload(`trabajos/${courseSlug}/${slug}-realidad.${real.name.split(".").pop()}`, real, opts),
      ]);

      setStep("Guardando…");
      const res = await fetch("/api/admin/works", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, studentName: name.trim(), expectationUrl: expBlob.url, realityUrl: realBlob.url }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "No se pudo guardar el trabajo");
      }

      toast.success(`Trabajo de ${name.trim()} cargado`);
      setName("");
      setExpectation(null);
      setReality(null);
      setFormKey((k) => k + 1);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al subir");
    } finally {
      setStep(null);
    }
  }

  const busy = step !== null;

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="studentName">Nombre del alumno</Label>
        <Input
          id="studentName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Martina G."
          maxLength={60}
          disabled={busy}
          autoComplete="off"
        />
      </div>
      <div key={formKey} className="grid grid-cols-2 gap-3">
        <ImagePicker label="Expectativa" tone="expectation" file={expectation} onChange={setExpectation} disabled={busy} />
        <ImagePicker label="Realidad" tone="reality" file={reality} onChange={setReality} disabled={busy} />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={busy || !name.trim() || !expectation || !reality}>
        {busy ? <Loader2 className="animate-spin" /> : <Upload />}
        {step ?? "Subir trabajo"}
      </Button>
    </form>
  );
}

function ImagePicker({
  label,
  tone,
  file,
  onChange,
  disabled,
}: {
  label: string;
  tone: "expectation" | "reality";
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <label
      className={cn(
        "relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed bg-muted/40 text-center transition-colors hover:bg-muted",
        file && (tone === "expectation" ? "border-solid border-expectation" : "border-solid border-reality"),
        disabled && "pointer-events-none opacity-60",
      )}
    >
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:)
        <img src={preview} alt={label} className="absolute inset-0 size-full bg-white object-contain" />
      ) : (
        <>
          <ImagePlus className="size-8 text-muted-foreground" />
          <span className="px-2 text-xs text-muted-foreground">Tocá para elegir o sacar foto</span>
        </>
      )}
      <span
        className={cn(
          "absolute top-2 left-2 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white uppercase",
          tone === "expectation" ? "bg-expectation" : "bg-reality",
        )}
      >
        {label}
      </span>
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </label>
  );
}
