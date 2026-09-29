import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { LoginForm } from "@/components/admin/login-form";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCourses, getResults } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin · Expectativa vs. Realidad", robots: { index: false } };

type Props = { searchParams: Promise<{ curso?: string }> };

export default async function AdminPage({ searchParams }: Props) {
  if (!(await isAdmin())) return <LoginForm />;

  const { curso } = await searchParams;
  const courses = await getCourses();
  const selected = courses.find((c) => c.slug === curso) ?? courses[0] ?? null;

  const [results, createdOrder, ballots] = selected
    ? await Promise.all([
        getResults(selected.id),
        // Para la lista del panel, los trabajos en orden de carga (el más nuevo arriba).
        prisma.work.findMany({ where: { courseId: selected.id }, select: { id: true }, orderBy: { createdAt: "desc" } }),
        prisma.ballot.findMany({
          where: { courseId: selected.id },
          orderBy: { createdAt: "desc" },
          include: { items: { include: { work: { select: { studentName: true } } }, orderBy: { points: "desc" } } },
        }),
      ])
    : [[], [], []];

  const byId = new Map(results.map((w) => [w.id, w]));

  return (
    <AdminDashboard
      courses={courses.map(({ id, name, slug, votingOpen, showResults }) => ({ id, name, slug, votingOpen, showResults }))}
      selectedId={selected?.id ?? null}
      works={createdOrder.map(({ id }) => byId.get(id)!).filter(Boolean)}
      ballots={ballots.map((b) => ({
        id: b.id,
        nickname: b.nickname,
        createdAt: b.createdAt.toISOString(),
        picks: b.items.map((i) => ({ points: i.points, studentName: i.work.studentName })),
      }))}
    />
  );
}
