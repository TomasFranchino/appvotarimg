"use client";

import Image from "next/image";
import { Vote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { WorkDTO } from "@/lib/types";

type Props = {
  work: WorkDTO | null;
  onClose: () => void;
  onVote?: (work: WorkDTO) => void;
};

/** Vista ampliada de un trabajo para comparar bien las dos imágenes. */
export function WorkViewer({ work, onClose, onVote }: Props) {
  return (
    <Dialog open={Boolean(work)} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-4xl">
        {work && (
          <>
            <div className="pr-8">
              <DialogTitle className="text-xl">{work.studentName}</DialogTitle>
              <DialogDescription>Expectativa vs. realidad</DialogDescription>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["Expectativa", work.expectationUrl, "bg-expectation"],
                  ["Realidad", work.realityUrl, "bg-reality"],
                ] as const
              ).map(([label, src, tone]) => (
                <figure key={label} className="space-y-1.5">
                  <figcaption>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold text-white uppercase", tone)}>{label}</span>
                  </figcaption>
                  <div className="relative aspect-square overflow-hidden rounded-xl border bg-white">
                    <Image src={src} alt={`${label} de ${work.studentName}`} fill sizes="(min-width: 640px) 45vw, 95vw" className="object-contain" />
                  </div>
                </figure>
              ))}
            </div>
            {onVote && (
              <Button size="lg" onClick={() => onVote(work)}>
                <Vote /> Votar este trabajo
              </Button>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
