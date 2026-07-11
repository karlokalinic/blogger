import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Box, Eye, RadioTower, Sparkles } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { archiveEntries, devlogs, project } from "@/lib/content";

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <Image
          src="/images/prudina-bus-stop.png"
          alt="A deserted concrete bus stop in winter fog outside Prudina"
          fill
          priority
          sizes="100vw"
          className="hero-image"
        />
        <div className="hero-vignette" />
        <div className="hero-coordinates mono-label">44.5461° N / 15.3747° E <span>— SIGNAL UNSTABLE</span></div>
        <div className="hero-content">
          <p className="section-kicker"><span /> Independent psychological horror / development signal</p>
          <h1 aria-label="VEO ZAVOD">VEO<br /><em>ZAVOD</em></h1>
          <p className="hero-dek">A town can survive almost anything<br />except an accurate record.</p>
          <div className="hero-actions">
            <Link href="/devlog" className="primary-button">Read the latest log <ArrowRight size={15} /></Link>
            <Link href="/archive" className="text-button">Enter world archive <span>↗</span></Link>
          </div>
        </div>
        <div className="hero-build">
          <div><span>BUILD</span><strong>{project.build}</strong></div>
          <div><span>PHASE</span><strong>PRE-PRODUCTION</strong></div>
          <div className="build-progress" aria-label={`${project.completion}% project completion`}>
            <span>PROJECT SIGNAL</span>
            <div><i style={{ width: `${project.completion}%` }} /></div>
            <strong>{project.completion}%</strong>
          </div>
        </div>
        <div className="scroll-cue" aria-hidden="true"><span /> SCROLL TO RECEIVE</div>
      </section>

      <section className="dispatch-section section-shell">
        <div className="section-heading reveal-block">
          <div>
            <p className="section-kicker"><span /> Transmissions from production</p>
            <h2>The work leaves<br />evidence.</h2>
          </div>
          <p>Public notes from a game being made in full view. Systems, failures, characters and the decisions that survive the week.</p>
        </div>

        <div className="featured-log reveal-block">
          <Link href={`/devlog/${devlogs[0].slug}`} className="featured-log-image image-distort">
            <Image src={devlogs[0].image} alt="Winter road and bus stop in Prudina" fill sizes="(max-width: 900px) 100vw, 62vw" />
            <span className="image-index">027</span>
          </Link>
          <div className="featured-log-copy">
            <div className="log-meta"><span>{devlogs[0].number}</span><span>{devlogs[0].date}</span><span>{devlogs[0].readTime}</span></div>
            <h3><Link href={`/devlog/${devlogs[0].slug}`}>{devlogs[0].title}</Link></h3>
            <p>{devlogs[0].dek}</p>
            <Link href={`/devlog/${devlogs[0].slug}`} className="line-link">Open transmission <ArrowRight size={14} /></Link>
          </div>
        </div>

        <div className="log-row">
          {devlogs.slice(1).map((post) => (
            <article className="log-card reveal-block" key={post.slug}>
              <Link href={`/devlog/${post.slug}`} className="log-card-image image-distort">
                <Image src={post.image} alt="" fill sizes="(max-width: 700px) 100vw, 45vw" />
              </Link>
              <div className="log-meta"><span>{post.number}</span><span>{post.category}</span><span>{post.date}</span></div>
              <h3><Link href={`/devlog/${post.slug}`}>{post.title}</Link></h3>
              <p>{post.dek}</p>
            </article>
          ))}
        </div>
        <div className="section-end-link"><Link href="/devlog">All development logs <ArrowRight size={14} /></Link></div>
      </section>

      <section className="world-window">
        <div className="world-window-image">
          <Image src="/images/motel-bijeli-jelen.png" alt="Motel Bijeli Jelen in freezing rain" fill sizes="100vw" />
          <div className="world-grid" aria-hidden="true" />
        </div>
        <div className="world-window-copy section-shell">
          <p className="section-kicker light"><span /> World archive / L-07</p>
          <h2>Every place keeps<br />the version it needs.</h2>
          <p>The public codex grows with the game. Characters contradict locations. Items remember choices. Cut material remains visible instead of being quietly rewritten as intention.</p>
          <Link href="/archive/motel-bijeli-jelen" className="primary-button light-button">Inspect the motel <Eye size={15} /></Link>
        </div>
        <span className="vertical-caption">ARCHIVE CAMERA / FRAME 00147 / WEATHER: SLEET</span>
      </section>

      <section className="archive-preview section-shell">
        <div className="section-heading compact reveal-block">
          <div>
            <p className="section-kicker"><span /> Indexed fragments</p>
            <h2>People. Places.<br />Things that implicate both.</h2>
          </div>
          <Link href="/archive" className="line-link">Browse all records <ArrowRight size={14} /></Link>
        </div>
        <div className="archive-preview-grid">
          {archiveEntries.slice(0, 3).map((entry, index) => (
            <Link className="archive-preview-card reveal-block" href={`/archive/${entry.slug}`} key={entry.slug}>
              <div className="archive-preview-image image-distort">
                <Image src={entry.image} alt="" fill sizes="(max-width: 760px) 100vw, 33vw" />
                <span>0{index + 1}</span>
              </div>
              <div className="archive-preview-type">{entry.type} / {entry.status}</div>
              <h3>{entry.title}</h3>
              <p>{entry.summary}</p>
              <span className="card-arrow">↗</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="production-signal">
        <div className="section-shell signal-inner">
          <div className="signal-copy reveal-block">
            <p className="section-kicker light"><span /> The town is watching production</p>
            <h2>Finish the work.<br />Restore the signal.</h2>
            <p>Every completed milestone changes the public map. Follow from zero and you will see the town arrive one system at a time.</p>
            <Link href="/studio/progress" className="text-button light-text">View production board <ArrowRight size={14} /></Link>
          </div>
          <div className="signal-map reveal-block" role="img" aria-label="Project milestones represented as connected radio signals">
            <svg viewBox="0 0 620 380" aria-hidden="true">
              <path d="M70 280 C180 130 260 330 360 170 S510 90 565 65" />
              <path className="ghost-path" d="M110 70 C215 175 300 35 465 285" />
            </svg>
            <div className="signal-node done" style={{ left: "10%", top: "69%" }}><i /><span>PROTOTYPE<br /><b>RESTORED</b></span></div>
            <div className="signal-node done" style={{ left: "34%", top: "50%" }}><i /><span>ACT I<br /><b>72%</b></span></div>
            <div className="signal-node active" style={{ left: "57%", top: "36%" }}><i /><span>VERTICAL SLICE<br /><b>IN PROGRESS</b></span></div>
            <div className="signal-node" style={{ left: "84%", top: "13%" }}><i /><span>FIRST PLAYABLE<br /><b>LOCKED</b></span></div>
            <div className="map-legend"><RadioTower size={15} /> PUBLIC SIGNAL STRENGTH <strong>{project.completion}%</strong></div>
          </div>
        </div>
      </section>

      <section className="studio-invite section-shell reveal-block">
        <div className="studio-invite-icon"><Box size={26} /></div>
        <div>
          <p className="section-kicker"><span /> Behind the archive</p>
          <h2>One deliberately messy room.</h2>
        </div>
        <p>The private-facing studio includes a writing desk, visual world database, media vault, 3D asset inspector, whiteboard, task game and practical text feedback. It runs locally now and upgrades to cloud persistence when storage keys are connected.</p>
        <Link href="/studio" className="primary-button">Open creator studio <Sparkles size={15} /></Link>
      </section>

      <SiteFooter />
    </main>
  );
}
