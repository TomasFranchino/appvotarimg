"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }).catch(() => null);
    setLoading(false);
    if (res?.ok) {
      router.refresh();
      return;
    }
    const data = (await res?.json().catch(() => ({}))) as { error?: string } | undefined;
    toast.error(data?.error ?? "No se pudo iniciar sesión.");
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <Card>
        <CardHeader>
          <div className="mb-2 flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <KeyRound className="size-5" />
          </div>
          <CardTitle className="text-xl">Panel del profe</CardTitle>
          <CardDescription>Ingresá la contraseña para administrar los trabajos.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              autoFocus
              autoComplete="current-password"
            />
            <Button type="submit" className="w-full" disabled={loading || !password}>
              {loading && <Loader2 className="animate-spin" />} Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
