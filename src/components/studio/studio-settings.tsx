"use client";

import { Check, Cloud, Copy, Database, ExternalLink, HardDrive, KeyRound, LoaderCircle, LockKeyhole, Palette, RadioTower, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

type Status = { status: string; database: boolean; blob: boolean; studioProtected: boolean; localVault: boolean; build: string };

export function StudioSettings() {
  const [status, setStatus] = useState<Status | null>(null);
  const [initializing, setInitializing] = useState(false);
  const [setupMessage, setSetupMessage] = useState("");
  const [projectName, setProjectName] = useState("VEO ZAVOD");
  const [tagline, setTagline] = useState("A town can survive almost anything except an accurate record.");
  const [copied, setCopied] = useState("");

  const refresh = () => fetch("/api/status").then((response) => response.json()).then(setStatus);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      refresh();
      setProjectName(localStorage.getItem("veo-project-name") || "VEO ZAVOD");
      setTagline(localStorage.getItem("veo-project-tagline") || "A town can survive almost anything except an accurate record.");
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const saveIdentity = () => {
    localStorage.setItem("veo-project-name", projectName);
    localStorage.setItem("veo-project-tagline", tagline);
    setSetupMessage("Local project identity saved.");
  };

  const initializeDatabase = async () => {
    setInitializing(true);
    setSetupMessage("");
    const response = await fetch("/api/setup", { method: "POST" });
    const body = await response.json();
    setInitializing(false);
    setSetupMessage(response.ok ? `Database ready: ${body.tables.join(", ")}.` : body.error);
    refresh();
  };

  const copy = (value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(value);
    setTimeout(() => setCopied(""), 1200);
  };

  return (
    <main className="settings-page">
      <header className="studio-page-heading"><div><p>PROJECT SETTINGS / CONNECTION DOCTOR</p><h1>Know exactly what is real.</h1><span>Green means configured in production. Local tools remain usable even when a cloud service is absent.</span></div><button className="studio-secondary-button" onClick={refresh}><RefreshCw size={14} /> Recheck</button></header>

      <section className="settings-section">
        <div className="settings-section-title"><Palette size={17} /><div><span>PUBLIC IDENTITY</span><p>Local preview values. Source defaults remain version-controlled.</p></div></div>
        <div className="settings-card identity-settings">
          <label><span>PROJECT NAME</span><input value={projectName} onChange={(event) => setProjectName(event.target.value)} /></label>
          <label><span>ONE-LINE PREMISE</span><textarea value={tagline} onChange={(event) => setTagline(event.target.value)} rows={3} /></label>
          <button className="studio-primary-button" onClick={saveIdentity}><Check size={13} /> Save local preview</button>
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section-title"><RadioTower size={17} /><div><span>SERVICE HEALTH</span><p>The site never pretends local previews are cloud backups.</p></div></div>
        {!status ? <div className="settings-loading"><LoaderCircle className="spin" size={18} /> Reading deployment configuration…</div> : (
          <div className="service-grid">
            <ServiceCard icon={<HardDrive size={20} />} title="Browser vault" ready={status.localVault} detail="IndexedDB / images, video, audio, documents and 3D" action="Ready on this device" />
            <ServiceCard icon={<Database size={20} />} title="World database" ready={status.database} detail="Neon Postgres / records, posts and relationships" action={status.database ? "Connection present" : "DATABASE_URL missing"} />
            <ServiceCard icon={<Cloud size={20} />} title="Cloud media" ready={status.blob} detail="Vercel Blob / public production media and source assets" action={status.blob ? "Connection present" : "BLOB_READ_WRITE_TOKEN missing"} />
            <ServiceCard icon={<KeyRound size={20} />} title="Studio gate" ready={status.studioProtected} detail="HTTP-only owner session for every write endpoint" action={status.studioProtected ? "Owner passcode active" : "Preview mode / STUDIO_PASSWORD missing"} warning={!status.studioProtected} />
          </div>
        )}
      </section>

      <section className="settings-section setup-wizard-section">
        <div className="settings-section-title"><ShieldCheck size={17} /><div><span>FREE CLOUD SETUP</span><p>Three environment variables turn the local-first template into a protected multi-device studio.</p></div></div>
        <div className="setup-wizard-grid">
          <div className="setup-step"><i>01</i><div><strong>Add a free Postgres integration</strong><p>In the Vercel project, open Storage → Create Database → Neon. Accept the free plan and connect it to all environments.</p><a href="https://vercel.com/marketplace/neon" target="_blank" rel="noreferrer">Open Neon integration <ExternalLink size={12} /></a></div></div>
          <div className="setup-step"><i>02</i><div><strong>Add free media storage</strong><p>Create a Vercel Blob store. The integration injects the token automatically; never paste it into source code.</p><a href="https://vercel.com/docs/vercel-blob" target="_blank" rel="noreferrer">Open Blob guide <ExternalLink size={12} /></a></div></div>
          <div className="setup-step"><i>03</i><div><strong>Lock the studio</strong><p>Add strong random values for the owner passcode and cookie signature in Vercel environment settings.</p><EnvCopy name="STUDIO_PASSWORD" copied={copied} copy={copy} /><EnvCopy name="AUTH_SECRET" copied={copied} copy={copy} /></div></div>
          <div className="setup-step"><i>04</i><div><strong>Create the schema once</strong><p>After Postgres is connected and the deployment is refreshed, this safe operation creates only missing tables.</p><button disabled={!status?.database || initializing} onClick={initializeDatabase}>{initializing ? <LoaderCircle className="spin" size={13} /> : <Database size={13} />}{status?.database ? "Initialize missing tables" : "Connect database first"}</button></div></div>
        </div>
        {setupMessage && <div className="setup-message"><Check size={13} /> {setupMessage}</div>}
      </section>

      <section className="settings-section security-note"><LockKeyhole size={18} /><div><strong>No secret belongs in NEXT_PUBLIC_ variables.</strong><p>Database credentials, upload tokens, the studio password and AUTH_SECRET must stay server-only. The code already reads them lazily so a first deployment can build before integrations exist.</p></div></section>
    </main>
  );
}

function ServiceCard({ icon, title, ready, detail, action, warning = false }: { icon: React.ReactNode; title: string; ready: boolean; detail: string; action: string; warning?: boolean }) {
  return <div className={`service-card ${ready ? "ready" : warning ? "warning" : "missing"}`}><div className="service-icon">{icon}<i /></div><strong>{title}</strong><p>{detail}</p><span>{ready ? <Check size={11} /> : "!"} {action}</span></div>;
}

function EnvCopy({ name, copied, copy }: { name: string; copied: string; copy: (value: string) => void }) {
  return <button className="env-copy" onClick={() => copy(name)}><code>{name}</code>{copied === name ? <Check size={12} /> : <Copy size={12} />}</button>;
}
