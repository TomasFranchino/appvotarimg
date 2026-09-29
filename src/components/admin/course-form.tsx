"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugify } from "@/lib/slug";

type Props = {
  initial?: { name: string; slug: string };
  submitLabel: string;
  onSubmit: (values: { name: string; slug: string }) => Promise<void>;
  onCancel?: () => void;
};

/** Nombre + link del curso. El link se completa solo a partir del nombre hasta que lo edites. */
export function CourseForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(initial));
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({ name: name.trim(), slug });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`course-name-${initial?.slug ?? "new"}`}>Nombre</Label>
          <Input
            id={`course-name-${initial?.slug ?? "new"}`}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugEdited) setSlug(slugify(e.target.value));
            }}
            placeholder="Ej: 4º A"
            maxLength={40}
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`course-slug-${initial?.slug ?? "new"}`}>Link</Label>
          <div className="flex items-center rounded-md border border-input bg-card shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/40">
            <span className="pl-3 text-sm text-muted-foreground">/c/</span>
            <input
              id={`course-slug-${initial?.slug ?? "new"}`}
              value={slug}
              onChange={(e) => {
                setSlugEdited(true);
                setSlug(slugify(e.target.value.replace(/\s/g, "-")) + (e.target.value.endsWith("-") ? "-" : ""));
              }}
              placeholder="4a"
              maxLength={40}
              autoComplete="off"
              className="h-11 min-w-0 flex-1 bg-transparent pr-3 text-base outline-none md:text-sm"
            />
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={saving || !name.trim() || !slug}>
          {saving && <Loader2 className="animate-spin" />} {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
