import type { Metadata } from "next";
import { VotedView } from "@/components/voted-view";

export const metadata: Metadata = { title: "¡Gracias por votar! · Expectativa vs. Realidad" };

export default function VotedPage() {
  return <VotedView />;
}
