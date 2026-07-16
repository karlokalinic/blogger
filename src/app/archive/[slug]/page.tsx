import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, GitBranch } from "lucide-react";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { getArchiveEntries, getArchiveEntry } from "@/lib/published-content";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getArchiveEntry(slug);
  if (!entry) return { title: "Record not found" };
  return {
    title: entry.title,
    description: entry.summary,
    openGraph: { images: [entry.image] },
  };
}

export default async function ArchiveEntryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const archiveEntries = await getArchiveEntries();
  const entry = archiveEntries.find((candidate) => candidate.slug === slug) ?? await getArchiveEntry(slug);
  if (!entry) notFound();
  const index = archiveEntries.findIndex((candidate) => candidate.slug === entry.slug);
  const next = archiveEntries[(index + 1) % archiveEntries.length];

  return (
    <main className="record-page">
      <section className="record-hero">
        <div className="record-hero-image">
          <Image src={entry.image} alt={`${entry.title} archive image`} fill priority sizes="(max-width: 900px) 100vw, 55vw" style={{ objectPosition: entry.imagePosition ?? "50% 50%" }} />
          <div className="record-image-overlay" />
          <span className="record-frame-label">ARCHIVE FRAME / {String(index + 1).padStart(4, "0")}</span>
        </div>
        <div className="record-hero-copy">
          <Link href="/archive" className="back-link"><ArrowLeft size={14} /> Return to archive</Link>
          <div className="record-eyebrow"><span>{entry.eyebrow}</span><i className={entry.status}>{entry.status}</i></div>
          <h1>{entry.title}</h1>
          <p className="record-summary">{entry.summary}</p>
          <div className="record-tags">{entry.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
          <div className="record-completion">
            <span>RECORD COMPLETENESS</span><div><i style={{ width: `${entry.progress}%` }} /></div><strong>{entry.progress}%</strong>
          </div>
        </div>
      </section>

      <section className="record-body section-shell">
        <div className="record-prose">
          <p className="section-kicker"><span /> Current canonical reading</p>
          {entry.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {entry.quote && <blockquote>“{entry.quote}”</blockquote>}
        </div>
        <aside className="record-facts">
          <div className="facts-title">DOSSIER / LAST EDIT {entry.updated}</div>
          {entry.facts.map((fact) => <div key={fact.label}><span>{fact.label}</span><strong>{fact.value}</strong></div>)}
        </aside>
      </section>

      <section className="connections section-shell">
        <div className="connections-heading"><GitBranch size={17} /><span>KNOWN CONNECTIONS</span></div>
        <div className="connection-list">
          {entry.connections.map((connection, connectionIndex) => (
            <div key={connection}><span>{String(connectionIndex + 1).padStart(2, "0")}</span><strong>{connection}</strong><i>RELATED RECORD</i></div>
          ))}
        </div>
      </section>

      <Link href={`/archive/${next.slug}`} className="next-record">
        <span>NEXT RECORD / {next.type}</span>
        <strong>{next.title}</strong>
        <ArrowRight size={23} />
      </Link>
      <SiteFooter />
    </main>
  );
}
