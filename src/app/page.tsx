import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, School } from "lucide-react";
import { getCourses } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** Portada: elegir curso. Con un solo curso, entra directo. */
export default async function HomePage() {
  const courses = await getCourses();
  if (courses.length === 1) redirect(`/c/${courses[0].slug}`);

  return (
    <div className="mx-auto max-w-md px-4 pt-10 pb-16">
      <h1 className="text-3xl font-bold tracking-tight text-balance">
        <span className="text-expectation">Expectativa</span> vs.{" "}
        <span className="text-reality">Realidad</span>
      </h1>
      {courses.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed py-16 text-center text-muted-foreground">
          Todavía no hay cursos cargados.
        </p>
      ) : (
        <>
          <p className="mt-2 text-muted-foreground">Elegí tu curso para ver los trabajos y votar.</p>
          <ul className="mt-6 space-y-2">
            {courses.map((course) => (
              <li key={course.id}>
                <Link
                  href={`/c/${course.slug}`}
                  className="flex items-center gap-3 rounded-xl border bg-card p-4 font-semibold shadow-sm transition-shadow hover:shadow-md"
                >
                  <span className="flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <School className="size-5" />
                  </span>
                  <span className="flex-1 text-lg">{course.name}</span>
                  <ChevronRight className="size-5 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
