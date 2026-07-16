import type { Metadata } from "next";
import { ArchiveExplorer } from "@/components/archive-explorer";
import { SiteFooter } from "@/components/site-footer";
import { getArchiveEntries } from "@/lib/published-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "World Archive",
  description: "Characters, locations, missions, items and field notes from VEO ZAVOD.",
};

export default async function ArchivePage() {
  const archiveEntries = await getArchiveEntries();
  return (
    <main className="inner-page archive-page">
      <header className="inner-hero section-shell">
        <div>
          <p className="section-kicker"><span /> Public records / partial access</p>
          <h1>WORLD<br /><em>ARCHIVE</em></h1>
        </div>
        <div className="inner-hero-copy">
          <p>Everything currently true about Prudina. Drafts are marked. Contradictions remain visible. The archive changes only when the build does.</p>
          <div className="archive-stat-line"><span>{archiveEntries.length} RECORDS</span><span>18 CONNECTIONS</span><span>BUILD 0.4.7</span></div>
        </div>
      </header>
      <section className="archive-browser section-shell">
        <ArchiveExplorer entries={archiveEntries} />
      </section>
      <SiteFooter />
    </main>
  );
}
