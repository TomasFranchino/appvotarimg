"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ImageOff, Lock, Maximize2, Users, Vote } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NicknameDialog } from "@/components/nickname-dialog";
import { togglePick, VoteDialog, type Picks } from "@/components/vote-dialog";
import { WorkPair } from "@/components/work-pair";
import { WorkViewer } from "@/components/work-viewer";
import { getFingerprint } from "@/lib/fingerprint";
import { PLACES } from "@/lib/places";
import { NICKNAME_ASKED_KEY, storage } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { VoteStatus, WorkDTO } from "@/lib/types";

type Props = {
  works: WorkDTO[];
  totalVotes: number;
  votingOpen: boolean;
};

type Phase = "loading" | "can-vote" | "voted" | "closed";

export function Gallery({ works, totalVotes: initialTotal, votingOpen }: Props) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [totalVotes, setTotalVotes] = useState(initialTotal);
  const [picks, setPicks] = useState<Picks>([null, null, null]);
  const [voteOpen, setVoteOpen] = useState(false);
  const [askName, setAskName] = useState(false);
  const [viewing, setViewing] = useState<WorkDTO | null>(null);
  const enoughWorks = works.length >= 3;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const fingerprint = await getFingerprint().catch(() => null);
      const res = await fetch("/api/vote/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fingerprint }),
      }).catch(() => null);
      if (cancelled) return;
      if (!res?.ok) {
        setPhase(votingOpen ? "can-vote" : "closed");
        return;
      }
      const status = (await res.json()) as VoteStatus;
      setTotalVotes(status.totalVotes);
      const next: Phase = status.hasVoted ? "voted" : status.votingOpen ? "can-vote" : "closed";
      setPhase(next);
      if (next === "can-vote" && works.length >= 3 && !storage.get(NICKNAME_ASKED_KEY)) setAskName(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [votingOpen, works.length]);

  function voteFor(work: WorkDTO) {
    setViewing(null);
    if (!picks.includes(work.id)) {
      const next = togglePick(picks, work.id);
      if (next === "full") toast.info("Ya elegiste 3 trabajos. Quitá uno para cambiarlo.");
      else setPicks(next);
    }
    setVoteOpen(true);
  }

  const canVote = phase === "can-vote" && enoughWorks;

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-6 pb-4 sm:pt-10">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="accent">
            <Users /> {totalVotes} {totalVotes === 1 ? "voto" : "votos"}
          </Badge>
          <Badge variant="outline">{works.length} trabajos</Badge>
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-5xl">
          <span className="text-expectation">Expectativa</span> vs.{" "}
          <span className="text-reality">Realidad</span>
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground text-pretty">
          Mirá todos los trabajos y elegí tus 3 favoritos: el 1º suma <strong>3 puntos</strong>, el 2º{" "}
          <strong>2</strong> y el 3º <strong>1</strong>. Tocá una imagen para verla más grande.
        </p>
        <StatusBanner phase={phase} enoughWorks={enoughWorks} />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-32">
        {works.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-20 text-center text-muted-foreground">
            <ImageOff className="size-10" />
            <p>Todavía no hay trabajos cargados.</p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {works.map((work, i) => {
              const pickIndex = picks.indexOf(work.id);
              const place = pickIndex !== -1 ? PLACES[pickIndex] : null;
              return (
                <li
                  key={work.id}
                  className={cn(
                    "group rounded-2xl border bg-card p-2.5 shadow-sm transition-shadow hover:shadow-md",
                    place && cn("ring-2", place.ring),
                  )}
                >
                  <button type="button" onClick={() => setViewing(work)} className="relative block w-full" aria-label={`Ver trabajo de ${work.studentName}`}>
                    <WorkPair work={work} priority={i < 4} />
                    <span className="absolute right-1.5 bottom-1.5 rounded-full bg-black/50 p-1.5 text-white opacity-80 transition-opacity group-hover:opacity-100">
                      <Maximize2 className="size-3.5" />
                    </span>
                  </button>
                  <div className="flex items-center justify-between gap-2 px-1 pt-2.5 pb-0.5">
                    <p className="min-w-0 truncate font-semibold">{work.studentName}</p>
                    {canVote &&
                      (place ? (
                        <button
                          type="button"
                          onClick={() => setVoteOpen(true)}
                          className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-bold", place.badge)}
                        >
                          {place.emoji} {place.label} lugar
                        </button>
                      ) : (
                        <Button size="sm" variant="outline" className="shrink-0 rounded-full" onClick={() => voteFor(work)}>
                          <Vote /> Votar
                        </Button>
                      ))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Barra inferior fija (pensada para el celular) */}
      {canVote && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/90 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            <div className="flex gap-1.5">
              {PLACES.map((place, i) => (
                <span
                  key={place.label}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full text-sm transition-all",
                    picks[i] ? place.badge : "border border-dashed text-muted-foreground",
                  )}
                >
                  {picks[i] ? place.emoji : place.label}
                </span>
              ))}
            </div>
            <Button size="lg" className="flex-1" onClick={() => setVoteOpen(true)}>
              <Vote /> {picks.every(Boolean) ? "Revisar y confirmar" : "Votar"}
            </Button>
          </div>
        </div>
      )}

      <VoteDialog works={works} picks={picks} onPicksChange={setPicks} open={voteOpen} onOpenChange={setVoteOpen} />
      <WorkViewer work={viewing} onClose={() => setViewing(null)} onVote={canVote ? voteFor : undefined} />
      <NicknameDialog open={askName} onOpenChange={setAskName} />
    </>
  );
}

function StatusBanner({ phase, enoughWorks }: { phase: Phase; enoughWorks: boolean }) {
  if (phase === "voted") {
    return (
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
        <p className="flex items-center gap-2 font-medium">
          <CheckCircle2 className="size-5" /> Ya votaste. ¡Gracias!
        </p>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline" className="bg-white">
            <Link href="/ya-votaste">Ver mi voto</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/resultados">Resultados</Link>
          </Button>
        </div>
      </div>
    );
  }
  if (phase === "closed") {
    return (
      <div className="mt-4 flex items-center gap-2 rounded-xl border bg-muted px-4 py-3 font-medium">
        <Lock className="size-5" /> La votación está cerrada.
      </div>
    );
  }
  if (phase === "can-vote" && !enoughWorks) {
    return (
      <div className="mt-4 rounded-xl border bg-muted px-4 py-3 text-sm">
        La votación empieza cuando haya al menos 3 trabajos cargados.
      </div>
    );
  }
  return null;
}
