"use client";

import FingerprintJS from "@fingerprintjs/fingerprintjs";

let visitorId: Promise<string> | null = null;

/** Identificador estable del navegador (se calcula una vez por carga de página). */
export function getFingerprint() {
  visitorId ??= FingerprintJS.load()
    .then((agent) => agent.get())
    .then((result) => result.visitorId)
    .catch((error) => {
      visitorId = null;
      throw error;
    });
  return visitorId;
}
