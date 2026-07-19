import type { Metadata } from "next";
import { PrudinaRestoreGame } from "@/components/prudina-restore-game";

export const metadata: Metadata = {
  title: "Program ODRŽI — Grad Prudina",
  description: "Javni pilot-program Prudine za objedinjavanje potreba kućanstva, fizičke naloge jedinice P-1 i praćenje institucionalnog kontinuiteta.",
};

export default function MergeGamePage() {
  return <PrudinaRestoreGame />;
}
