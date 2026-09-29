import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Gallery } from "@/components/gallery";
import { getCourseBySlug, getTotalVotes, getWorks } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await getCourseBySlug((await params).slug);
  return { title: course ? `${course.name} · Expectativa vs. Realidad` : "Curso no encontrado" };
}

export default async function CourseGalleryPage({ params }: Props) {
  const course = await getCourseBySlug((await params).slug);
  if (!course) notFound();

  const [works, totalVotes] = await Promise.all([getWorks(course.id), getTotalVotes(course.id)]);
  return (
    <Gallery
      course={{ id: course.id, name: course.name, slug: course.slug }}
      works={works}
      totalVotes={totalVotes}
      votingOpen={course.votingOpen}
    />
  );
}
