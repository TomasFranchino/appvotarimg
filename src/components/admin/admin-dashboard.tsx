"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { UploadForm } from "@/components/admin/upload-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { WorkThumbs } from "@/components/work-pair";
import { placeForPoints } from "@/lib/places";
import type { ResultRow } from "@/lib/types";

type Settings = { votingOpen: boolean; showResults: boolean };
type BallotRow = {
  id: string;
  nickname: string | null;
  createdAt: string;
  picks: { points: number; studentName: string }[];
};

type Props = { works: ResultRow[]; settings: Settings; ballots: BallotRow[] };

async function request(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Algo salió mal");
  }
}

export function AdminDashboard({ works, settings, ballots }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function run(key: string, action: () => Promise<void>, success?: string) {
    setBusy(key);
    try {
      await action();
      if (success) toast.success(success);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Algo salió mal");
    } finally {
      setBusy(null);
    }
  }

  const updateSetting = (patch: Partial<Settings>) =>
    run("settings", () => request("/api/admin/settings", "PATCH", patch));

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 pt-6 pb-16">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Panel del profe</h1>
          <p className="text-sm text-muted-foreground">
            {works.length} trabajos · {ballots.length} votos
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => run("logout", () => request("/api/admin/logout", "POST"))}
        >
          <LogOut /> Salir
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estado de la votación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingRow
            id="votingOpen"
            label="Votación abierta"
            hint="Si la cerrás, nadie más puede votar."
            checked={settings.votingOpen}
            disabled={busy === "settings"}
            onChange={(votingOpen) => updateSetting({ votingOpen })}
          />
          <SettingRow
            id="showResults"
            label="Resultados visibles para todos"
            hint="Apagalo para revelar el ranking recién al final (vos lo seguís viendo)."
            checked={settings.showResults}
            disabled={busy === "settings"}
            onChange={(showResults) => updateSetting({ showResults })}
          />
          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild variant="outline" size="sm">
              <Link href="/">
                <ExternalLink /> Galería
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/resultados">
                <ExternalLink /> Resultados
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subir un trabajo</CardTitle>
          <CardDescription>Las fotos se achican automáticamente antes de subirse.</CardDescription>
        </CardHeader>
        <CardContent>
          <UploadForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trabajos ({works.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {works.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no subiste ninguno.</p>
          ) : (
            <ul className="divide-y">
              {works.map((work) => (
                <li key={work.id} className="flex items-center gap-3 py-2.5">
                  <WorkThumbs work={work} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{work.studentName}</p>
                    <p className="text-xs text-muted-foreground">{work.points} pts</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={busy === work.id}
                    aria-label={`Eliminar trabajo de ${work.studentName}`}
                    onClick={() => {
                      const warning = work.points > 0 ? ` También se borrarán sus ${work.points} puntos.` : "";
                      if (confirm(`¿Eliminar el trabajo de ${work.studentName}?${warning}`)) {
                        run(work.id, () => request(`/api/admin/works/${work.id}`, "DELETE"), "Trabajo eliminado");
                      }
                    }}
                  >
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>Votos ({ballots.length})</CardTitle>
            <CardDescription>Útil para borrar votos de prueba antes de la clase.</CardDescription>
          </div>
          {ballots.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 text-destructive"
              disabled={busy === "all-ballots"}
              onClick={() => {
                if (confirm(`¿Borrar los ${ballots.length} votos? Todos podrán volver a votar.`)) {
                  run("all-ballots", () => request("/api/admin/ballots", "DELETE"), "Votos borrados");
                }
              }}
            >
              <Trash2 /> Borrar todos
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {ballots.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nadie votó todavía.</p>
          ) : (
            <ul className="divide-y">
              {ballots.map((ballot) => (
                <li key={ballot.id} className="flex items-start gap-3 py-2.5">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">{ballot.nickname || "Anónimo"}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {new Date(ballot.createdAt).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}
                      </span>
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {ballot.picks.map((pick) => (
                        <Badge key={pick.points} variant="secondary">
                          {placeForPoints(pick.points).emoji} {pick.studentName}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    disabled={busy === ballot.id}
                    aria-label="Eliminar voto"
                    onClick={() => {
                      if (confirm("¿Eliminar este voto? Esa persona podrá votar de nuevo.")) {
                        run(ballot.id, () => request(`/api/admin/ballots/${ballot.id}`, "DELETE"), "Voto eliminado");
                      }
                    }}
                  >
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SettingRow({
  id,
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-1">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  );
}
