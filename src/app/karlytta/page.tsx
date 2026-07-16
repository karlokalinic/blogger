import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Database, FileArchive, FileText, Scale, ShieldAlert, Volume2 } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import {
  karlyttaAudio,
  karlyttaClaims,
  karlyttaDiscography,
  karlyttaDocuments,
  karlyttaEvidence,
  karlyttaFacts,
  karlyttaInstitutions,
  karlyttaOpinion,
  karlyttaRelationships,
  karlyttaSocialFragments,
  karlyttaSource,
  karlyttaTimeline,
  karlyttaVisuals,
} from "@/lib/karlytta-archive";

export const metadata: Metadata = {
  title: "KARLYTTA / Prudina Archive",
  description: "A curated in-world dossier for KARLYTTA, the Prudina celebrity archive, lawsuit materials, audio objects and production data.",
  openGraph: { images: ["/karlytta/source/assets/karlytta_cover.jpg"] },
};

export default function KarlyttaArchivePage() {
  return (
    <main className="karlytta-page">
      <section className="karlytta-hero">
        <div className="karlytta-hero-copy">
          <Link href="/devlog" className="back-link">DEVLOG INDEX</Link>
          <p className="section-kicker light"><span /> Prudina celebrity archive / status-labeled</p>
          <h1>KARLYTTA<br /><em>WAS OUTSIDE</em></h1>
          <p>
            A curated public dossier for Karla Vita Lukan, professionally known as KARLYTTA: singer, plaintiff,
            broadcast product, survivor, civic instrument and one of Prudina&apos;s least successfully heard citizens.
          </p>
          <div className="karlytta-hero-actions">
            <a href={`${karlyttaSource}/site_v0_2/index.html`}><FileArchive size={16} /> Open source gallery</a>
            <a href={`${karlyttaSource}/KARLYTTA_PRODUCTION_TRACKER_v0_2.xlsx`}><Database size={16} /> Download tracker</a>
          </div>
        </div>
        <div className="karlytta-cover">
          <Image src="/karlytta/source/assets/karlytta_cover.jpg" alt="Karlytta archive cover artwork" fill priority sizes="(max-width: 900px) 100vw, 44vw" />
          <span>FICTIONAL IN-WORLD ARCHIVE / CLAIMS ARE STATUS-LABELED</span>
        </div>
      </section>

      <section className="karlytta-facts section-shell" aria-label="Archive facts">
        {karlyttaFacts.map((fact) => <div key={fact.label}><span>{fact.label}</span><strong>{fact.value}</strong></div>)}
      </section>

      <section className="karlytta-editorial section-shell">
        <article>
          <p className="section-kicker"><span /> Perfect listening note</p>
          <h2>The archive is not asking whether everyone heard her. It asks who was allowed to count hearing as information.</h2>
          <p>
            KARLYTTA is built around a brutal contradiction: the more visible she becomes, the easier Prudina finds it to treat her statements as weather. The archive refuses the easy version where fame equals power or where imperfection cancels testimony. It keeps the glitter, the bad edits, the legal filings, the fan preservation, the clinic log and the dance record in the same room.
          </p>
          <p>
            The public master is not court evidence by itself. The disputed longer file is not proof by vibes. The civil complaint is not a metaphor. The clinic access log is not a lyric. The design strength of the dossier is that every object has a custodian, an interest, a failure mode and a status. The page below keeps those labels visible so the reader can enjoy the myth without accidentally laundering it into certainty.
          </p>
        </article>
        <aside>
          <ShieldAlert size={22} />
          <strong>Reliability rule</strong>
          <p>Class A is operationally dependable. Class C can be contested and still materially important. False or disputed artifacts remain only when their circulation caused real consequences.</p>
        </aside>
      </section>

      <section className="karlytta-section section-shell">
        <div className="karlytta-section-head"><span>VISUAL EVIDENCE WALL</span><h2>Artifacts visitors can read before they believe anything.</h2></div>
        <div className="karlytta-gallery">
          {karlyttaVisuals.map((item) => (
            <figure key={item.src}>
              <Image src={item.src} alt={item.alt} width={900} height={620} sizes="(max-width: 900px) 92vw, 29vw" />
              <figcaption><span>{item.label}</span><strong>{item.title}</strong><small>{item.status}</small><p>{item.caption}</p></figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="karlytta-audio section-shell">
        <div className="karlytta-section-head"><span>AUDIO OBJECTS</span><h2>The public master and the contested longer file.</h2></div>
        <div className="karlytta-audio-grid">
          {karlyttaAudio.map((track) => (
            <article key={track.id}>
              <div><Volume2 size={18} /><span>{track.status}</span></div>
              <h3>{track.title}</h3>
              <Image src={track.waveform} alt={`${track.title} waveform`} width={1100} height={260} />
              <audio controls preload="metadata" src={track.src} />
              <p>{track.note}</p>
              <dl><div><dt>Duration</dt><dd>{track.duration}</dd></div><div><dt>Key</dt><dd>{track.key}</dd></div><div><dt>Tempo</dt><dd>{track.tempo}</dd></div><div><dt>Loudness</dt><dd>{track.loudness}</dd></div></dl>
            </article>
          ))}
        </div>
      </section>

      <section className="karlytta-columns section-shell">
        <article>
          <div className="karlytta-section-head"><span>CAREER CHRONOLOGY</span><h2>Works as pressure points.</h2></div>
          <div className="karlytta-discography">
            {karlyttaDiscography.map(([year, title, form, genre, motifs]) => <div key={`${year}-${title}`}><span>{year}</span><strong>{title}</strong><small>{form} / {genre}</small><p>{motifs}</p></div>)}
          </div>
        </article>
        <article>
          <div className="karlytta-section-head"><span>LAWSUIT TIMELINE</span><h2>Procedure, not prophecy.</h2></div>
          <ol className="karlytta-timeline">{karlyttaTimeline.map(([year, text]) => <li key={`${year}-${text}`}><span>{year}</span><p>{text}</p></li>)}</ol>
        </article>
      </section>

      <section className="karlytta-section section-shell">
        <div className="karlytta-section-head"><span>CLAIMS AND EVIDENCE</span><h2>Status labels stay attached.</h2></div>
        <div className="karlytta-claims">
          {karlyttaClaims.map((claim) => <article key={claim.id}><span>{claim.id} / {claim.status}</span><h3>{claim.claim}</h3><p>{claim.counter}</p></article>)}
        </div>
        <div className="karlytta-evidence">
          {karlyttaEvidence.map(([id, title, custodian, klass, limitation]) => <div key={id}><span>{id}</span><strong>{title}</strong><small>Class {klass} / {custodian}</small><p>{limitation}</p></div>)}
        </div>
      </section>

      <section className="karlytta-columns section-shell">
        <article>
          <div className="karlytta-section-head"><span>INSTITUTIONS</span><h2>Where private demand becomes procedure.</h2></div>
          <div className="karlytta-list">{karlyttaInstitutions.map(([name, type, functionText]) => <div key={name}><strong>{name}</strong><span>{type}</span><p>{functionText}</p></div>)}</div>
        </article>
        <article>
          <div className="karlytta-section-head"><span>RELATIONSHIPS</span><h2>No one gets to be a single function.</h2></div>
          <div className="karlytta-list">{karlyttaRelationships.map(([name, relation, tone]) => <div key={name}><strong>{name}</strong><span>{tone}</span><p>{relation}</p></div>)}</div>
        </article>
      </section>

      <section className="karlytta-opinion section-shell">
        <div className="karlytta-section-head"><span>PUBLIC OPINION</span><h2>Who believes, who waits, who trusts institutions.</h2></div>
        <div className="karlytta-poll">
          {karlyttaOpinion.map(([group, believe, institutions, wait, unsure]) => <div key={group}><strong>{group}</strong><i style={{ width: `${believe}%` }} /><span>{believe}% believe / {institutions}% institutions / {wait}% wait / {unsure}% unsure</span></div>)}
        </div>
        <div className="karlytta-social">{karlyttaSocialFragments.map((quote) => <blockquote key={quote}>{quote}</blockquote>)}</div>
      </section>

      <section className="karlytta-section section-shell">
        <div className="karlytta-section-head"><span>RAW ARCHIVE ON VERCEL</span><h2>Documents, data, workbook and source site are served directly.</h2></div>
        <div className="karlytta-docs">
          {karlyttaDocuments.map((doc) => <a href={doc.href} key={doc.href}><FileText size={15} /><span>{doc.kind}</span><strong>{doc.title}</strong><ArrowRight size={14} /></a>)}
        </div>
      </section>

      <section className="karlytta-bridge section-shell">
        <Scale size={20} />
        <div><span>MANDATORY GAME BRIDGE</span><p>The Doctor does not need to meet Karlytta. The playable bridge is an access badge or audit record showing a non-clinical RP Network account opening a protected patient file during a night shift.</p></div>
      </section>

      <SiteFooter />
    </main>
  );
}