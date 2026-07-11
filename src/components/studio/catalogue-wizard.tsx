"use client";
/* eslint-disable @next/next/no-img-element -- previews may be local data URLs that next/image cannot optimize */

import {
  ArrowLeft,
  ArrowRight,
  Box,
  Building2,
  Check,
  FileQuestion,
  ImagePlus,
  Map,
  Package,
  Save,
  ScrollText,
  Tags,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Draft = {
  type: string;
  title: string;
  slug: string;
  summary: string;
  status: string;
  description: string;
  role: string;
  need: string;
  contradiction: string;
  tags: string[];
  connections: string[];
  image: string;
};

const initialDraft: Draft = { type: "character", title: "", slug: "", summary: "", status: "draft", description: "", role: "", need: "", contradiction: "", tags: [], connections: [], image: "" };

const types = [
  ["character", "Character", "A person, witness, rival or absence.", UserRound],
  ["location", "Location", "A room, route, district or weather-state.", Map],
  ["mission", "Mission", "A task with states, pressure and consequences.", ScrollText],
  ["item", "Item", "An object, clue, key or usable prop.", Package],
  ["faction", "Institution", "A group, office, family or public fiction.", Building2],
  ["note", "Field note", "A rule, experiment, failure or loose thought.", FileQuestion],
] as const;

const steps = ["Record type", "Identity", "Meaning", "Media", "Links", "Review"];

export function CatalogueWizard() {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [tagInput, setTagInput] = useState("");
  const [connectionInput, setConnectionInput] = useState("");
  const [published, setPublished] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const local = JSON.parse(window.localStorage.getItem("veo-record-draft") || "null");
        if (local) setDraft({ ...initialDraft, ...local });
      } catch { /* start clean */ }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => window.localStorage.setItem("veo-record-draft", JSON.stringify(draft)), 400);
    return () => clearTimeout(timer);
  }, [draft]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const canContinue = useMemo(() => step === 0 ? Boolean(draft.type) : step === 1 ? Boolean(draft.title.trim() && draft.summary.trim()) : true, [draft, step]);
  const currentType = types.find(([value]) => value === draft.type) ?? types[0];
  const CurrentTypeIcon = currentType[3];

  const addToken = (key: "tags" | "connections", value: string) => {
    const clean = value.trim().replace(/^#/, "");
    if (!clean || draft[key].includes(clean)) return;
    set(key, [...draft[key], clean]);
    if (key === "tags") setTagInput("");
    else setConnectionInput("");
  };

  const chooseImage = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => set("image", String(reader.result));
    reader.readAsDataURL(file);
  };

  const publish = () => {
    const existing = JSON.parse(window.localStorage.getItem("veo-local-records") || "[]") as Draft[];
    const final = { ...draft, slug: draft.slug || slugify(draft.title) };
    window.localStorage.setItem("veo-local-records", JSON.stringify([...existing.filter((item) => item.slug !== final.slug), final]));
    window.localStorage.removeItem("veo-record-draft");
    setPublished(true);
  };

  if (published) {
    return (
      <main className="wizard-success">
        <div className="success-mark"><Check size={26} /></div>
        <span>LOCAL RECORD CREATED</span>
        <h1>{draft.title}</h1>
        <p>The record is safe in this browser and ready for cloud publication once project storage is connected.</p>
        <div><button className="studio-primary-button" onClick={() => { setDraft(initialDraft); setStep(0); setPublished(false); }}>Create another</button><Link href="/archive">View public archive</Link></div>
      </main>
    );
  }

  return (
    <main className="catalogue-wizard">
      <header className="studio-page-heading wizard-heading">
        <div><p>DATABASE WIZARD / AUTOSAVED LOCALLY</p><h1>Add something to the world.</h1><span>One guided decision at a time. Nothing publishes until the final review.</span></div>
        <div className="save-state"><Save size={13} /> Draft safe</div>
      </header>

      <div className="wizard-stepper" aria-label={`Step ${step + 1} of ${steps.length}`}>
        {steps.map((label, index) => <button key={label} onClick={() => index < step && setStep(index)} className={index === step ? "active" : index < step ? "done" : ""}><i>{index < step ? <Check size={11} /> : index + 1}</i><span>{label}</span></button>)}
        <div className="stepper-line"><i style={{ width: `${step / (steps.length - 1) * 100}%` }} /></div>
      </div>

      <section className="wizard-card">
        <div className="wizard-card-head"><div><span>STEP {step + 1} / {steps.length}</span><h2>{stepTitle(step, draft.type)}</h2></div><Hint text={stepHint(step)} /></div>

        {step === 0 && (
          <div className="record-type-grid">
            {types.map(([value, label, description, Icon]) => <button className={draft.type === value ? "selected" : ""} onClick={() => set("type", value)} key={value}><Icon size={22} /><strong>{label}</strong><p>{description}</p><i>{draft.type === value && <Check size={12} />}</i></button>)}
          </div>
        )}

        {step === 1 && (
          <div className="wizard-form two-col-form">
            <label className="span-two"><span>DISPLAY NAME <b>*</b><Hint text="The human-readable name visitors will see." /></span><input autoFocus value={draft.title} onChange={(event) => { const value = event.target.value; setDraft((current) => ({ ...current, title: value, slug: current.slug && current.slug !== slugify(current.title) ? current.slug : slugify(value) })); }} placeholder={draft.type === "character" ? "e.g. Branimir Vukelić" : "Name this record"} /></label>
            <label><span>URL SLUG <Hint text="Lowercase address used in archive links. You can leave the generated value." /></span><div className="slug-input"><i>/archive/</i><input value={draft.slug} onChange={(event) => set("slug", slugify(event.target.value))} /></div></label>
            <label><span>CANON STATUS <Hint text="Draft records stay visibly uncertain. Cut records remain searchable without appearing as current canon." /></span><select value={draft.status} onChange={(event) => set("status", event.target.value)}><option value="draft">Draft / uncertain</option><option value="canon">Canon / current</option><option value="cut">Cut / preserved</option></select></label>
            <label className="span-two"><span>ONE-SENTENCE SIGNAL <b>*</b><Hint text="The sentence that must make sense even when shared outside the site." /></span><textarea rows={3} value={draft.summary} maxLength={180} onChange={(event) => set("summary", event.target.value)} placeholder="What makes this worth opening?" /><small>{draft.summary.length} / 180</small></label>
          </div>
        )}

        {step === 2 && (
          <div className="wizard-form two-col-form meaning-form">
            <label className="span-two"><span>CURRENT READING <Hint text="Describe what is presently true. You can preserve contradictory versions in connections or notes." /></span><textarea rows={7} value={draft.description} onChange={(event) => set("description", event.target.value)} placeholder="Write the useful version, not the final version…" /></label>
            <label><span>{draft.type === "character" ? "FUNCTION IN THE STORY" : "FUNCTION IN THE GAME"}</span><input value={draft.role} onChange={(event) => set("role", event.target.value)} placeholder="What does it make possible?" /></label>
            <label><span>{draft.type === "character" ? "PRIVATE NEED" : "PLAYER NEED"}</span><input value={draft.need} onChange={(event) => set("need", event.target.value)} placeholder="What pressure keeps it active?" /></label>
            <label className="span-two"><span>CONTRADICTION <Hint text="The detail that prevents this record from collapsing into a single function or trope." /></span><input value={draft.contradiction} onChange={(event) => set("contradiction", event.target.value)} placeholder="It does one thing while proving another…" /></label>
          </div>
        )}

        {step === 3 && (
          <div className="media-step">
            <label className={draft.image ? "image-dropzone has-image" : "image-dropzone"}>
              {draft.image ? <img src={draft.image} alt="Selected record preview" /> : <><ImagePlus size={28} /><strong>Drop a cover image or choose a file</strong><span>JPG, PNG, WEBP / up to 15 MB recommended</span></>}
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => chooseImage(event.target.files?.[0])} />
              {draft.image && <span className="replace-image"><Upload size={13} /> Replace image</span>}
            </label>
            <div className="media-guidance">
              <Box size={20} />
              <div><strong>3D belongs in the media vault</strong><p>Attach GLB or GLTF assets after the record exists. The 3D inspector will generate a thumbnail and keep the original file unchanged.</p></div>
              <a href="/studio/media">Open 3D inspector ↗</a>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="links-step">
            <div className="token-field"><label><Tags size={15} /> SEARCH TAGS <Hint text="Tags help you find the record. They are not prose and can be blunt." /></label><div className="token-input">{draft.tags.map((tag) => <span key={tag}>#{tag}<button onClick={() => set("tags", draft.tags.filter((item) => item !== tag))}><X size={11} /></button></span>)}<input value={tagInput} onChange={(event) => setTagInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === ",") { event.preventDefault(); addToken("tags", tagInput); } }} placeholder="Type and press Enter" /></div></div>
            <div className="token-field"><label><ArrowRight size={15} /> KNOWN CONNECTIONS <Hint text="Loose text is allowed now. You can resolve it to another archive record later." /></label><div className="connection-input-list">{draft.connections.map((connection) => <div key={connection}><span>RELATED RECORD</span><strong>{connection}</strong><button onClick={() => set("connections", draft.connections.filter((item) => item !== connection))}><X size={12} /></button></div>)}<div className="new-connection"><input value={connectionInput} onChange={(event) => setConnectionInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addToken("connections", connectionInput); } }} placeholder="Name a character, item, mission or place" /><button onClick={() => addToken("connections", connectionInput)}>Add link</button></div></div></div>
          </div>
        )}

        {step === 5 && (
          <div className="record-review">
            <div className="review-cover">{draft.image ? <img src={draft.image} alt="" /> : <div><CurrentTypeIcon size={34} /><span>NO COVER YET</span></div>}<span>{draft.status}</span></div>
            <div className="review-copy"><span>{currentType[1].toUpperCase()} / LOCAL DRAFT</span><h3>{draft.title || "Untitled record"}</h3><p>{draft.summary || "No signal sentence written."}</p><div>{draft.tags.map((tag) => <i key={tag}>#{tag}</i>)}</div></div>
            <div className="review-checklist"><div className={draft.title ? "ok" : ""}>{draft.title ? <Check size={12} /> : "!"}<span>Identity</span><strong>{draft.title ? "Ready" : "Missing"}</strong></div><div className={draft.description ? "ok" : ""}>{draft.description ? <Check size={12} /> : "!"}<span>Meaning</span><strong>{draft.description ? "Ready" : "Optional"}</strong></div><div className={draft.image ? "ok" : ""}>{draft.image ? <Check size={12} /> : "!"}<span>Media</span><strong>{draft.image ? "Attached" : "Optional"}</strong></div></div>
            <div className="review-notice"><strong>LOCAL-FIRST MODE</strong><p>This creates the record in your browser. Cloud publication stays disabled until authenticated database storage is connected, preventing accidental public uploads.</p></div>
          </div>
        )}

        <footer className="wizard-footer">
          <button className="wizard-back" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0}><ArrowLeft size={14} /> Back</button>
          <span>{step + 1} of {steps.length}</span>
          {step < steps.length - 1 ? <button className="studio-primary-button" onClick={() => setStep((value) => Math.min(steps.length - 1, value + 1))} disabled={!canContinue}>Continue <ArrowRight size={14} /></button> : <button className="studio-primary-button publish-record" onClick={publish}><Check size={14} /> Create local record</button>}
        </footer>
      </section>
    </main>
  );
}

function Hint({ text }: { text: string }) {
  return <span className="hint" tabIndex={0}>?<span role="tooltip">{text}</span></span>;
}

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function stepTitle(step: number, type: string) {
  return ["What kind of record is this?", "Give it an identity", "Decide what it means right now", "Give the record a face", "Connect it to the world", `Review this ${type}`][step];
}

function stepHint(step: number) {
  return ["Choose the closest shape. You can change it later without losing text.", "Only the name and signal sentence are required.", "Incomplete and contradictory answers are valid production data.", "The original file stays untouched; the browser creates a preview.", "Connections turn isolated notes into a searchable world graph.", "Nothing here reaches the public archive in local-first mode."][step];
}
