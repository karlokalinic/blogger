import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { VisualProgressArchive } from "@/components/visual-progress-archive";
import { visualChapters, visualLocations, visualNpcs } from "@/lib/visual-progress";

export const metadata: Metadata = {
  title: "Visual Progress",
  description: "Chapter-by-chapter PSX and HDR visual development for VEO ZAVOD.",
};

export default function CapturesPage() {
  return (
    <main className="inner-page captures-page">
      <header className="captures-hero section-shell">
        <div><p className="section-kicker"><span /> Visual build / honest progression</p><h1>CAPTURE<br /><em>ROOM</em></h1></div>
        <div><p>Low-poly PSX and PS2 geometry under modern HDR light. Every frame is marked as a real capture, a concept or a lighting target.</p><span>04 CHAPTERS / 07 LOCATIONS / 05 PEOPLE</span></div>
      </header>
      <VisualProgressArchive chapters={visualChapters} locations={visualLocations} npcs={visualNpcs} />
      <SiteFooter />
    </main>
  );
}
