"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CircleHelp, Loader2, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFingerprint } from "@/lib/fingerprint";
import { placeForPoints } from "@/lib/places";
import { cn } from "@/lib/utils";
import type { VoteStatus } from "@/lib/types";

export function VotedView() {
  const [status, setStatus] = useState<VoteStatus | null>(null);

  useEffect(() => {
    (async () => {
      const fingerprint = await getFingerprint().catch(() => null);
      const res = await fetch("/api/vote/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fingerprint }),
      });
      setStatus(await res.json());
    })().catch(() => setStatus({ hasVoted: false, votingOpen: true, totalVotes: 0, picks: [] }));
  }, []);

  if (!status) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!status.hasVoted) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
        <CircleHelp className="size-14 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Todavía no votaste</h1>
        <p className="text-muted-foreground">Andá a la galería y elegí tus 3 trabajos favoritos.</p>
        <Button asChild size="lg">
          <Link href="/">Ir a votar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-5 px-4 py-14 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-expectation to-reality text-white shadow-lg">
        <PartyPopper className="size-10" />
      </div>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">¡Ya votaste!</h1>
        <p className="mt-1 text-muted-foreground">
          Tu voto quedó registrado.{" "}
          {status.totalVotes === 1 ? "Va 1 voto" : `Van ${status.totalVotes} votos`} en total.
        </p>
      </div>

      {status.picks.length > 0 && (
        <ol className="w-full space-y-2 text-left">
          {status.picks.map((pick) => {
            const place = placeForPoints(pick.points);
            return (
              <li key={pick.points} className={cn("flex items-center gap-3 rounded-xl border-2 bg-card px-4 py-3", place.border)}>
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", place.badge)}>
                  {place.emoji} {place.label}
                </span>
                <span className="flex-1 truncate font-semibold">{pick.studentName}</span>
                <span className="text-sm text-muted-foreground">+{pick.points} {pick.points === 1 ? "pt" : "pts"}</span>
              </li>
            );
          })}
        </ol>
      )}

      <div className="flex w-full flex-col gap-2 sm:flex-row">
        <Button asChild size="lg" className="flex-1">
          <Link href="/resultados">Ver resultados</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="flex-1">
          <Link href="/">Volver a la galería</Link>
        </Button>
      </div>
    </div>
  );
}
