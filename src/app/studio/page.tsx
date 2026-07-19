import Link from "next/link";
import { ArrowRight, BookOpenText, Box, Gamepad2, ImageIcon, Network, Plus, RadioTower, Users } from "lucide-react";
import { StudioDashboardClient } from "@/components/studio/studio-dashboard-client";
import { archiveEntries, project, tasks } from "@/lib/content";

export default function StudioDashboardPage() {
  return (
    <main className="studio-dashboard">
      <header className="studio-page-heading">
        <div>
          <p>SATURDAY / 11 JUL 2026 / SIGNAL CLEAR</p>
          <h1>Good afternoon, Karlo.</h1>
          <span>The town moved while you were away. Three records still need a decision.</span>
        </div>
        <div className="heading-actions">
          <Link href="/studio/catalogue" className="studio-secondary-button"><Plus size={14} /> New record</Link>
          <Link href="/studio/write" className="studio-primary-button"><BookOpenText size={14} /> Start writing</Link>
        </div>
      </header>

      <section className="studio-stat-grid">
        <div className="studio-stat-card signal-card">
          <div><RadioTower size={18} /><span>PROJECT SIGNAL</span></div>
          <strong>{project.completion}<em>%</em></strong>
          <div className="studio-meter"><i style={{ width: `${project.completion}%` }} /></div>
          <small>+4% since last transmission</small>
        </div>
        <div className="studio-stat-card"><div><Users size={18} /><span>WORLD RECORDS</span></div><strong>{archiveEntries.length}<em>/ 40</em></strong><small>3 need review</small></div>
        <div className="studio-stat-card"><div><ImageIcon size={18} /><span>MEDIA ASSETS</span></div><strong>24<em> files</em></strong><small>1.8 GB local</small></div>
        <div className="studio-stat-card"><div><Box size={18} /><span>BUILD</span></div><strong>{project.build}</strong><small>Vertical slice / active</small></div>
      </section>

      <div className="dashboard-columns">
        <section className="dashboard-panel focus-panel">
          <div className="panel-heading"><div><span>TODAY&apos;S FOCUS</span><strong>The next useful thing</strong></div><Link href="/studio/progress">Full board <ArrowRight size={13} /></Link></div>
          <StudioDashboardClient tasks={tasks} />
        </section>

        <section className="dashboard-panel activity-panel">
          <div className="panel-heading"><div><span>RECENT SIGNAL</span><strong>What changed</strong></div></div>
          <div className="activity-feed">
            <div><i className="green" /><span>18:42</span><p><strong>Motel lobby lighting pass</strong> moved to complete.</p></div>
            <div><i /><span>17:08</span><p>Edited <strong>Branimir Vukelić</strong> / contradiction field.</p></div>
            <div><i className="red" /><span>15:31</span><p><strong>Winter room tone</strong> marked blocked. Equipment unavailable.</p></div>
            <div><i /><span>YEST.</span><p>Uploaded <strong>water-sample.glb</strong> / 2.4 MB.</p></div>
          </div>
        </section>
      </div>

      <section className="dashboard-tools">
        <Link href="/studio/write"><BookOpenText size={20} /><div><span>WRITE</span><strong>Open last draft</strong><small>Act I / Scene 04 / autosaved</small></div><ArrowRight size={14} /></Link>
        <Link href="/studio/catalogue"><Plus size={20} /><div><span>CATALOGUE</span><strong>Add anything</strong><small>Character, place, item, mission</small></div><ArrowRight size={14} /></Link>
        <Link href="/studio/whiteboard"><Network size={20} /><div><span>WHITEBOARD</span><strong>Make a mess</strong><small>7 notes / 3 loose connections</small></div><ArrowRight size={14} /></Link>
        <Link href="/merge-game"><Gamepad2 size={20} /><div><span>JAVNI PILOT-PROGRAM</span><strong>Program ODRŽI</strong><small>Objedini prijave, odobri fizičku pomoć i prati kontinuitet</small></div><ArrowRight size={14} /></Link>
      </section>
    </main>
  );
}
