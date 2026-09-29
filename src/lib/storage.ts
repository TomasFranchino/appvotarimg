"use client";

/** localStorage que nunca rompe (modo privado, almacenamiento bloqueado, etc.). */
export const storage = {
  get(key: string) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value);
    } catch {}
  },
};

export const NICKNAME_KEY = "voto:apodo";
export const NICKNAME_ASKED_KEY = "voto:apodo-preguntado";
