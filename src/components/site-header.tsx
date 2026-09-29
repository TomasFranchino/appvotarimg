"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Images, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const { slug } = useParams<{ slug?: string }>();
  const base = slug ? `/c/${slug}` : null;

  // La navegación solo tiene sentido dentro de un curso.
  const links = base
    ? [
        { href: base, label: "Galería", icon: Images },
        { href: `${base}/resultados`, label: "Resultados", icon: Trophy },
      ]
    : [];

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href={base ?? "/"} className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex">
            <span className="size-5 rounded-md bg-expectation" />
            <span className="-ml-2 size-5 rounded-md bg-reality mix-blend-multiply" />
          </span>
          <span className="text-sm sm:text-base">
            Expectativa <span className="text-muted-foreground">vs</span> Realidad
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                pathname === href
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
