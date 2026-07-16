import type { Metadata } from "next";
import { PrudinaRestoreGame } from "@/components/prudina-restore-game";

export const metadata: Metadata = {
  title: "Merge Game",
  description: "Play Prudina Restore inside the VEO ZAVOD site.",
};

export default function MergeGamePage() {
  return <PrudinaRestoreGame />;
}
