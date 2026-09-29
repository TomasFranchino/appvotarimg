"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NICKNAME_ASKED_KEY, NICKNAME_KEY, storage } from "@/lib/storage";

/** Bienvenida: pide un apodo opcional la primera vez que se entra. */
export function NicknameDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [name, setName] = useState("");

  function close(save: boolean) {
    storage.set(NICKNAME_ASKED_KEY, "1");
    if (save) storage.set(NICKNAME_KEY, name.trim());
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close(false)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>¡Hola! 👋</DialogTitle>
          <DialogDescription>
            ¿Cómo te llamamos? Es opcional: tu voto es anónimo para tus compañeros.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            close(true);
          }}
          className="space-y-4"
        >
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder="Nombre o apodo"
            autoComplete="off"
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => close(false)}>
              Prefiero no decirlo
            </Button>
            <Button type="submit">Continuar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
