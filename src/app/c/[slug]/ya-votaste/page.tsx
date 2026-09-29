import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VotedView } from "@/components/voted-view";
import { getCourseBySlug } from "@/lib/queries";

export const metadata: Metadata = { title: "¡Gracias por votar! · Expectativa vs. Realidad" };

export default async function VotedPage({ params }: { params: Promise<{ slug: string }> }) {
  const course = await getCourseBySlug((await params).slug);
  if (!course) notFound();
  return <VotedView courseSlug={course.slug} />;
}
