import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { LoginForm } from "@/components/admin/login-form";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getResults, getSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin · Expectativa vs. Realidad", robots: { index: false } };

export default async function AdminPage() {
  if (!(await isAdmin())) return <LoginForm />;

  const [works, settings, ballots] = await Promise.all([
    getResults(),
    getSettings(),
    prisma.ballot.findMany({
      orderBy: { createdAt: "desc" },
      include: { items: { include: { work: { select: { studentName: true } } }, orderBy: { points: "desc" } } },
    }),
  ]);

  // Para la lista del panel, los trabajos en orden de carga (el más nuevo arriba).
  const createdOrder = await prisma.work.findMany({ select: { id: true }, orderBy: { createdAt: "desc" } });
  const byId = new Map(works.map((w) => [w.id, w]));

  return (
    <AdminDashboard
      works={createdOrder.map(({ id }) => byId.get(id)!).filter(Boolean)}
      settings={{ votingOpen: settings.votingOpen, showResults: settings.showResults }}
      ballots={ballots.map((b) => ({
        id: b.id,
        nickname: b.nickname,
        createdAt: b.createdAt.toISOString(),
        picks: b.items.map((i) => ({ points: i.points, studentName: i.work.studentName })),
      }))}
    />
  );
}
