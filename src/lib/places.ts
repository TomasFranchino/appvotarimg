/** Estilo de cada puesto del podio (índice 0 = 1º lugar). */
export const PLACES = [
  { label: "1º", points: 3, emoji: "🥇", badge: "bg-gold text-amber-950", ring: "ring-gold", border: "border-gold" },
  { label: "2º", points: 2, emoji: "🥈", badge: "bg-silver text-zinc-900", ring: "ring-silver", border: "border-silver" },
  { label: "3º", points: 1, emoji: "🥉", badge: "bg-bronze text-orange-950", ring: "ring-bronze", border: "border-bronze" },
] as const;

export function placeForPoints(points: number) {
  return PLACES.find((p) => p.points === points) ?? PLACES[2];
}
