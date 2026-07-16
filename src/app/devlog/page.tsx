import type { Metadata } from "next";
import { DevlogFeed } from "@/components/devlog-feed";
import { SiteFooter } from "@/components/site-footer";
import { getDevlogPosts } from "@/lib/published-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Development Log", description: "Production notes from VEO ZAVOD." };

export default async function DevlogPage() {
  const devlogs = await getDevlogPosts();
  return (
    <main className="inner-page devlog-index">
      <header className="inner-hero section-shell">
        <div>
          <p className="section-kicker"><span /> Production records / uncleaned</p>
          <h1>DEV<br /><em>LOG</em></h1>
        </div>
        <div className="inner-hero-copy">
          <p>No victory laps. Each transmission records a decision, the version it replaced and what remains unresolved.</p>
          <div className="archive-stat-line"><span>MONTHLY LONGFORM</span><span>RSS AVAILABLE</span><span>{devlogs.length} LIVE</span></div>
        </div>
      </header>
      <DevlogFeed posts={devlogs} />
      <SiteFooter />
    </main>
  );
}
