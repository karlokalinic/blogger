import type { Metadata } from "next";
import { PrudinaRestoreGame } from "@/components/prudina-restore-game";

export const metadata: Metadata = {
  title: "Svi za stolom — Prudina merge igra",
  description: "Jednostavna Prudina igra spajanja, nadogradnje kuće i zamršenih obiteljskih odnosa za sve generacije.",
};

export default function MergeGamePage() {
  return <PrudinaRestoreGame />;
}
