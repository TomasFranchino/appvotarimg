import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResultsBoard } from "@/components/results-board";
import { isAdmin } from "@/lib/auth";
import { getCourseBySlug, getResults, getTotalVotes } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await getCourseBySlug((await params).slug);
  return { title: course ? `Resultados ${course.name} · Expectativa vs. Realidad` : "Curso no encontrado" };
}

export default async function ResultsPage({ params }: Props) {
  const course = await getCourseBySlug((await params).slug);
  if (!course) notFound();

  const [totalVotes, admin] = await Promise.all([getTotalVotes(course.id), isAdmin()]);
  const hidden = !course.showResults && !admin;

  return (
    <ResultsBoard
      course={{ id: course.id, name: course.name, slug: course.slug }}
      initial={{
        hidden,
        totalVotes,
        rows: hidden ? [] : await getResults(course.id),
        updatedAt: new Date().toISOString(),
      }}
    />
  );
}
