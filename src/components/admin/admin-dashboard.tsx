"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, ExternalLink, LogOut, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CourseForm } from "@/components/admin/course-form";
import { UploadForm } from "@/components/admin/upload-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { WorkThumbs } from "@/components/work-pair";
import { placeForPoints } from "@/lib/places";
import { cn } from "@/lib/utils";
import type { CourseDTO, ResultRow } from "@/lib/types";

type AdminCourse = CourseDTO & { votingOpen: boolean; showResults: boolean };
type BallotRow = {
  id: string;
  nickname: string | null;
  createdAt: string;
  picks: { points: number; studentName: string }[];
};

type Props = {
  courses: AdminCourse[];
  selectedId: string | null;
  works: ResultRow[];
  ballots: BallotRow[];
};

async function request<T = unknown>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Algo salió mal");
  return data as T;
}

export function AdminDashboard({ courses, selectedId, works, ballots }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [creating, setCreating] = useState(courses.length === 0);
  const [editing, setEditing] = useState(false);
  const course = courses.find((c) => c.id === selectedId) ?? null;

  useEffect(() => setEditing(false), [selectedId]);

  async function run(key: string, action: () => Promise<unknown>, success?: string) {
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

  /** Para formularios: los errores se muestran y se relanzan para que el form no se cierre. */
  async function saveCourse(action: () => Promise<AdminCourse>, success: string) {
    try {
      const saved = await action();
      toast.success(success);
      setCreating(false);
      setEditing(false);
      router.push(`/admin?curso=${saved.slug}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Algo salió mal");
    }
  }

  const updateCourse = (patch: Partial<AdminCourse>) =>
    run("settings", () => request(`/api/admin/courses/${course!.id}`, "PATCH", patch));

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 pt-6 pb-16">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Panel del profe</h1>
        <Button variant="ghost" size="sm" onClick={() => run("logout", () => request("/api/admin/logout", "POST"))}>
          <LogOut /> Salir
        </Button>
      </div>

      {/* Selector de curso */}
      <Card>
        <CardHeader>
          <CardTitle>Cursos</CardTitle>
          <CardDescription>Cada curso tiene su propia galería, votación y ranking.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {courses.map((c) => (
              <Link
                key={c.id}
                href={`/admin?curso=${c.slug}`}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  c.id === selectedId ? "border-foreground bg-foreground text-background" : "hover:bg-muted",
                )}
              >
                {c.name}
              </Link>
            ))}
            {!creating && (
              <Button variant="outline" className="rounded-full" onClick={() => setCreating(true)}>
                <Plus /> Nuevo curso
              </Button>
            )}
          </div>
          {creating && (
            <div className="rounded-xl border bg-muted/40 p-4">
              <CourseForm
                submitLabel="Crear curso"
                onCancel={courses.length > 0 ? () => setCreating(false) : undefined}
                onSubmit={(values) =>
                  saveCourse(() => request<AdminCourse>("/api/admin/courses", "POST", values), `Curso ${values.name} creado`)
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {course && (
        <>
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div className="space-y-1.5">
                <CardTitle className="text-xl">{course.name}</CardTitle>
                <CardDescription>
                  {works.length} {works.length === 1 ? "trabajo" : "trabajos"} · {ballots.length}{" "}
                  {ballots.length === 1 ? "voto" : "votos"}
                </CardDescription>
              </div>
              {!editing && (
                <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                  <Pencil /> Editar
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <div className="space-y-3 rounded-xl border bg-muted/40 p-4">
                  <CourseForm
                    key={course.id}
                    initial={{ name: course.name, slug: course.slug }}
                    submitLabel="Guardar"
                    onCancel={() => setEditing(false)}
                    onSubmit={(values) =>
                      saveCourse(
                        () => request<AdminCourse>(`/api/admin/courses/${course.id}`, "PATCH", values),
                        "Curso actualizado",
                      )
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Si cambiás el link, el anterior deja de funcionar: pasales el nuevo a los alumnos.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    disabled={busy === "delete-course"}
                    onClick={() => {
                      if (
                        confirm(
                          `¿Eliminar el curso ${course.name}? Se borran sus ${works.length} trabajos (con las fotos) y sus ${ballots.length} votos. No se puede deshacer.`,
                        )
                      ) {
                        run(
                          "delete-course",
                          async () => {
                            await request(`/api/admin/courses/${course.id}`, "DELETE");
                            router.push("/admin");
                          },
                          "Curso eliminado",
                        );
                      }
                    }}
                  >
                    <Trash2 /> Eliminar curso
                  </Button>
                </div>
              ) : (
                <StudentLink slug={course.slug} />
              )}

              <SettingRow
                id="votingOpen"
                label="Votación abierta"
                hint="Si la cerrás, nadie más puede votar en este curso."
                checked={course.votingOpen}
                disabled={busy === "settings"}
                onChange={(votingOpen) => updateCourse({ votingOpen })}
              />
              <SettingRow
                id="showResults"
                label="Resultados visibles para todos"
                hint="Apagalo para revelar el ranking recién al final (vos lo seguís viendo)."
                checked={course.showResults}
                disabled={busy === "settings"}
                onChange={(showResults) => updateCourse({ showResults })}
              />
              <div className="flex flex-wrap gap-2 pt-1">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/c/${course.slug}`}>
                    <ExternalLink /> Galería
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/c/${course.slug}/resultados`}>
                    <ExternalLink /> Resultados
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subir un trabajo a {course.name}</CardTitle>
              <CardDescription>Las fotos se achican automáticamente antes de subirse.</CardDescription>
            </CardHeader>
            <CardContent>
              <UploadForm key={course.id} courseId={course.id} courseSlug={course.slug} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trabajos ({works.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {works.length === 0 ? (
                <p className="text-sm text-muted-foreground">Todavía no subiste ninguno en este curso.</p>
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
                    if (confirm(`¿Borrar los ${ballots.length} votos de ${course.name}? Podrán volver a votar.`)) {
                      run(
                        "all-ballots",
                        () => request(`/api/admin/ballots?courseId=${course.id}`, "DELETE"),
                        "Votos borrados",
                      );
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
        </>
      )}
    </div>
  );
}

/** Link para pasarles a los alumnos, con botón de copiar. */
function StudentLink({ slug }: { slug: string }) {
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const url = `${origin}/c/${slug}`;

  return (
    <div className="flex items-center gap-2 rounded-xl border bg-accent/50 p-2 pl-3">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">Link para los alumnos</p>
        <p className="truncate font-mono text-sm font-medium">{url}</p>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="shrink-0 bg-card"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            toast.success("Link copiado");
          } catch {
            toast.error("No se pudo copiar. Copialo a mano.");
          }
        }}
      >
        <Copy /> Copiar
      </Button>
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
