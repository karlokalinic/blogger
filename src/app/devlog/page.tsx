import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { devlogs } from "@/lib/content";

export const metadata: Metadata = { title: "Development Log", description: "Production notes from VEO ZAVOD." };

export default function DevlogPage() {
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
      <section className="devlog-list section-shell">
        {devlogs.map((post, index) => (
          <article className="devlog-list-item" key={post.slug}>
            <Link href={`/devlog/${post.slug}`} className="devlog-list-image image-distort">
              <Image src={post.image} alt="" fill sizes="(max-width: 800px) 100vw, 42vw" />
              <span>{String(index + 1).padStart(2, "0")}</span>
            </Link>
            <div className="devlog-list-copy">
              <div className="log-meta"><span>{post.number}</span><span>{post.category}</span><span>{post.date}</span></div>
              <h2><Link href={`/devlog/${post.slug}`}>{post.title}</Link></h2>
              <p>{post.dek}</p>
              <Link href={`/devlog/${post.slug}`} className="line-link">Read transmission <ArrowRight size={14} /></Link>
            </div>
          </article>
        ))}
      </section>
      <SiteFooter />
    </main>
  );
}
