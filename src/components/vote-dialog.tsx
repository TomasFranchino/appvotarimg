"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WorkThumbs } from "@/components/work-pair";
import { getFingerprint } from "@/lib/fingerprint";
import { PLACES } from "@/lib/places";
import { NICKNAME_KEY, storage } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { WorkDTO } from "@/lib/types";

export type Picks = [string | null, string | null, string | null];

type Props = {
  courseSlug: string;
  works: WorkDTO[];
  picks: Picks;
  onPicksChange: (picks: Picks) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Tocar un trabajo lo pone en el primer puesto libre; tocarlo de nuevo lo saca. */
export function togglePick(picks: Picks, workId: string): Picks | "full" {
  const index = picks.indexOf(workId);
  const next = [...picks] as Picks;
  if (index !== -1) {
    next[index] = null;
    return next;
  }
  const free = picks.indexOf(null);
  if (free === -1) return "full";
  next[free] = workId;
  return next;
}

export function VoteDialog({ courseSlug, works, picks, onPicksChange, open, onOpenChange }: Props) {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const byId = new Map(works.map((w) => [w.id, w]));
  const complete = picks.every(Boolean);

  useEffect(() => {
    if (open) setNickname(storage.get(NICKNAME_KEY) ?? "");
  }, [open]);

  function handleToggle(workId: string) {
    const next = togglePick(picks, workId);
    if (next === "full") {
      toast.info("Ya elegiste 3 trabajos. Quitá uno para cambiarlo.");
      return;
    }
    onPicksChange(next);
  }

  function clearSlot(index: number) {
    const next = [...picks] as Picks;
    next[index] = null;
    onPicksChange(next);
  }

  async function submit() {
    if (!complete) return;
    setSubmitting(true);
    try {
      const fingerprint = await getFingerprint();
      const name = nickname.trim();
      storage.set(NICKNAME_KEY, name);

      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseSlug, fingerprint, nickname: name || null, picks }),
      });

      if (res.ok || res.status === 409) {
        if (res.ok) toast.success("¡Voto registrado!");
        router.push(`/c/${courseSlug}/ya-votaste`);
        router.refresh();
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error(data.error ?? "No se pudo guardar el voto. Probá de nuevo.");
    } catch {
      toast.error("Error de conexión. Probá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <div className="space-y-1 px-5 pt-5 pb-3 pr-12">
          <DialogTitle>Tu voto</DialogTitle>
          <DialogDescription>Tocá los trabajos en orden: el primero que elijas es tu 1º lugar.</DialogDescription>
        </div>

        {/* Puestos elegidos */}
        <div className="grid grid-cols-3 gap-2 px-5 pb-3">
          {PLACES.map((place, i) => {
            const work = picks[i] ? byId.get(picks[i]!) : undefined;
            return (
              <div
                key={place.label}
                className={cn(
                  "relative flex min-h-20 flex-col items-center justify-center gap-1 rounded-lg border-2 px-1.5 py-2 text-center transition-colors",
                  work ? cn(place.border, "bg-card") : "border-dashed bg-muted/50",
                )}
              >
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold whitespace-nowrap", place.badge)}>
                  {place.emoji} {place.label}
                </span>
                <span className="text-[10px] font-medium text-muted-foreground">
                  {place.points} {place.points === 1 ? "punto" : "puntos"}
                </span>
                <span className={cn("line-clamp-2 text-xs leading-tight", work ? "font-semibold" : "text-muted-foreground")}>
                  {work ? work.studentName : "Sin elegir"}
                </span>
                {work && (
                  <button
                    type="button"
                    onClick={() => clearSlot(i)}
                    className="absolute -top-2 -right-2 rounded-full border bg-background p-0.5 shadow-sm hover:bg-muted"
                    aria-label={`Quitar ${place.label} lugar`}
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Lista de trabajos */}
        <div className="flex-1 space-y-2 overflow-y-auto border-t bg-muted/30 px-5 py-3">
          {works.map((work) => {
            const index = picks.indexOf(work.id);
            const place = index !== -1 ? PLACES[index] : null;
            return (
              <button
                key={work.id}
                type="button"
                onClick={() => handleToggle(work.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border-2 bg-card p-2 text-left transition-all active:scale-[0.99]",
                  place ? cn(place.border, "shadow-sm") : "border-transparent hover:border-border",
                )}
              >
                <WorkThumbs work={work} size={52} />
                <span className="min-w-0 flex-1 truncate font-medium">{work.studentName}</span>
                {place ? (
                  <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-bold", place.badge)}>
                    {place.emoji} {place.label}
                  </span>
                ) : (
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border text-muted-foreground">
                    <Plus className="size-4" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Confirmación */}
        <div className="space-y-3 border-t px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="space-y-1.5">
            <Label htmlFor="nickname" className="text-xs text-muted-foreground">
              Tu nombre o apodo (opcional, solo lo ve el profe)
            </Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={40}
              placeholder="Anónimo"
              autoComplete="off"
            />
          </div>
          <Button size="lg" className="w-full" disabled={!complete || submitting} onClick={submit}>
            {submitting ? <Loader2 className="animate-spin" /> : <Check />}
            {complete ? "Confirmar voto" : `Elegí ${picks.filter((p) => !p).length} más`}
          </Button>
          <p className="text-center text-xs text-muted-foreground">Solo podés votar una vez. No se puede cambiar.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
