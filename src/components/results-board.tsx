"use client";

import { useCallback, useEffect, useState } from "react";
import { EyeOff, RefreshCw, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WorkPair, WorkThumbs } from "@/components/work-pair";
import { PLACES } from "@/lib/places";
import { cn } from "@/lib/utils";
import type { ResultRow, ResultsPayload } from "@/lib/types";

const POLL_MS = 5000;

export function ResultsBoard({ initial }: { initial: ResultsPayload }) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/results", { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualización automática mientras la pestaña está visible.
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const maxPoints = Math.max(1, ...data.rows.map((r) => r.points));
  const podium = data.rows.filter((r) => r.rank <= 3 && r.points > 0);
  const rest = data.rows.filter((r) => !podium.includes(r));

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 pb-16 sm:pt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight sm:text-4xl">
            <Trophy className="size-8 text-gold" /> Resultados
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="accent">
              <Users /> {data.totalVotes} {data.totalVotes === 1 ? "voto" : "votos"}
            </Badge>
            <span className="flex items-center gap-1.5">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              En vivo · {new Date(data.updatedAt).toLocaleTimeString("es-AR")}
            </span>
          </div>
        </div>
        <Button variant="outline" onClick={refresh} disabled={loading}>
          <RefreshCw className={cn(loading && "animate-spin")} /> Actualizar
        </Button>
      </div>

      {data.hidden ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-dashed py-20 text-center">
          <EyeOff className="size-10 text-muted-foreground" />
          <p className="text-lg font-semibold">Los resultados son secretos… por ahora 🤫</p>
          <p className="text-muted-foreground">El profe los va a mostrar cuando termine la votación.</p>
        </div>
      ) : data.rows.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed py-20 text-center text-muted-foreground">
          Todavía no hay trabajos.
        </p>
      ) : (
        <>
          {podium.length > 0 && (
            <ol className="mt-6 grid gap-4 md:grid-cols-3">
              {podium.map((row) => (
                <PodiumCard key={row.id} row={row} />
              ))}
            </ol>
          )}
          {rest.length > 0 && (
            <ol className="mt-6 space-y-2">
              {rest.map((row) => (
                <RankRow key={row.id} row={row} maxPoints={maxPoints} />
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
}

function Breakdown({ row }: { row: ResultRow }) {
  return (
    <span className="flex gap-2 text-xs whitespace-nowrap text-muted-foreground">
      <span title="Primeros lugares">🥇×{row.firsts}</span>
      <span title="Segundos lugares">🥈×{row.seconds}</span>
      <span title="Terceros lugares">🥉×{row.thirds}</span>
    </span>
  );
}

function PodiumCard({ row }: { row: ResultRow }) {
  const place = PLACES[row.rank - 1];
  return (
    <li className={cn("rounded-2xl border bg-card p-3 shadow-sm ring-2", place.ring, row.rank === 1 && "md:-mt-2 shadow-lg")}>
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className={cn("rounded-full px-3 py-1 text-sm font-bold", place.badge)}>
          {place.emoji} {place.label} puesto
        </span>
        <span className="text-right">
          <span className="text-2xl font-bold tabular-nums">{row.points}</span>
          <span className="ml-1 text-sm text-muted-foreground">pts</span>
        </span>
      </div>
      <WorkPair work={row} sizes="(min-width: 768px) 16vw, 48vw" />
      <div className="flex items-center justify-between gap-2 px-1 pt-2.5">
        <p className="truncate text-lg font-semibold">{row.studentName}</p>
        <Breakdown row={row} />
      </div>
    </li>
  );
}

function RankRow({ row, maxPoints }: { row: ResultRow; maxPoints: number }) {
  return (
    <li className="flex items-center gap-3 rounded-xl border bg-card p-2.5 pr-4">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold tabular-nums">
        {row.points > 0 ? row.rank : "–"}
      </span>
      <WorkThumbs work={row} size={48} />
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="truncate font-semibold">{row.studentName}</p>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-expectation to-reality transition-all duration-700"
            style={{ width: `${(row.points / maxPoints) * 100}%` }}
          />
        </div>
        <Breakdown row={row} />
      </div>
      <span className="shrink-0 text-right">
        <span className="text-xl font-bold tabular-nums">{row.points}</span>
        <span className="ml-1 text-xs text-muted-foreground">pts</span>
      </span>
    </li>
  );
}
