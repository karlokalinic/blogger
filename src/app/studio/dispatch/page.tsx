"use client";

import Link from "next/link";
import { upload } from "@vercel/blob/client";
import { useEffect, useState } from "react";
import styles from "./dispatch.module.css";

type Visibility = "private" | "public";
type Attachment = { id: string; name: string; type: string; size: number };
type Entry = {
  slug: string;
  title: string;
  project: string;
  technical: string;
  prose: string;
  visibility: Visibility;
  attachments: Attachment[];
  uploaded?: Record<string, string>;
  updated: string;
};

const PROJECTS = ["VEO ZAVOD / SLEGNUĆE", "ZRAKOPERKA", "PUTNIK", "PRUDINA ONLINE", "GRADOMRAZ", "PRIJATELJSKI ULOG", "LABORATORIJ", "OSOBNI DNEVNIK"];
const STORAGE_INDEX = "karlo-dispatch-index-v1";
const STORAGE_PREFIX = "karlo-dispatch-entry-v1:";
const DB_NAME = "karlo-dispatch-files-v1";
const MAX_FILE = 50 * 1024 * 1024;
const ALLOWED_EXTENSIONS = /\.(png|jpe?g|webp|gif|avif|mp4|webm|mp3|m4a|wav|ogg|flac|pdf|zip|txt|md)$/i;

function freshEntry(): Entry {
  return {
    slug: "zapis-" + crypto.randomUUID().slice(0, 12),
    title: "",
    project: "VEO ZAVOD / SLEGNUĆE",
    technical: "",
    prose: "",
    visibility: "private",
    attachments: [],
    uploaded: {},
    updated: new Date().toISOString(),
  };
}

function openVault(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("files")) request.result.createObjectStore("files");
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function vaultTransaction<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore, resolve: (value: T) => void) => void): Promise<T> {
  const db = await openVault();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("files", mode);
    let result: T;
    action(tx.objectStore("files"), (value) => { result = value; });
    tx.oncomplete = () => { db.close(); resolve(result); };
    tx.onerror = () => { db.close(); reject(tx.error); };
    tx.onabort = () => { db.close(); reject(tx.error); };
  });
}

function saveFile(id: string, file: File) {
  return vaultTransaction<void>("readwrite", (store) => { store.put(file, id); });
}
function readFile(id: string): Promise<File | undefined> {
  return vaultTransaction<File | undefined>("readonly", (store, resolve) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result as File | undefined);
  });
}
function removeFile(id: string) {
  return vaultTransaction<void>("readwrite", (store) => { store.delete(id); });
}

function readIndex(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_INDEX) || "[]");
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string").slice(0, 200) : [];
  } catch { return []; }
}

function formatSize(bytes: number) {
  return (bytes / (1024 * 1024)).toLocaleString("hr-HR", { maximumFractionDigits: 1 }) + " MB";
}

function createPostBody(entry: Entry, linkedAssets: Array<{ name: string; type: string; url: string }>) {
  const sections = [];
  if (entry.technical.trim()) sections.push("## TEHNIČKI DNEVNIK\n\n" + entry.technical.trim());
  if (entry.prose.trim()) sections.push("## PROZNI DNEVNIK\n\n" + entry.prose.trim());
  const external = linkedAssets.filter((file) => !file.type.startsWith("image/"));
  if (external.length) {
    sections.push("## DATOTEKE\n\n" + external.map((file) => {
      const name = file.name.replace(/[|\r\n\[\]]/g, " ").slice(0, 180);
      const kind = file.type.startsWith("video/") ? "video" : file.type.startsWith("audio/") ? "audio" : "file";
      return "[[asset|" + kind + "|" + name + "|" + file.url + "]]";
    }).join("\n\n"));
  }
  return sections.join("\n\n");
}

export default function DispatchPage() {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [index, setIndex] = useState<string[]>([]);
  const [saveState, setSaveState] = useState("Učitavanje…");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [publicLink, setPublicLink] = useState("");
  const [customProject, setCustomProject] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const ids = readIndex();
        setIndex(ids);
        const loaded = ids.length ? localStorage.getItem(STORAGE_PREFIX + ids[0]) : null;
        const parsed = loaded ? JSON.parse(loaded) as Entry : freshEntry();
        setEntry(parsed);
        setCustomProject(!PROJECTS.includes(parsed.project));
        setSaveState("Lokalni nacrt učitan");
      } catch {
        setEntry(freshEntry());
        setSaveState("Novi lokalni nacrt");
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!entry) return;
    const timer = window.setTimeout(() => {
      try {
        const updated = { ...entry, updated: new Date().toISOString() };
        localStorage.setItem(STORAGE_PREFIX + entry.slug, JSON.stringify(updated));
        const ids = [entry.slug, ...readIndex().filter((id) => id !== entry.slug)].slice(0, 200);
        localStorage.setItem(STORAGE_INDEX, JSON.stringify(ids));
        setIndex(ids);
        setSaveState("Lokalno spremljeno · " + new Date().toLocaleTimeString("hr-HR", { hour: "2-digit", minute: "2-digit" }));
      } catch {
        setSaveState("POGREŠKA: preglednik nije spremio nacrt. Izvezi tekst.");
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [entry]);

  function change(fields: Partial<Entry>) {
    setEntry((current) => current ? { ...current, ...fields } : current);
    setPublicLink("");
  }

  function newEntry() {
    const created = freshEntry();
    setEntry(created);
    setNotice("Otvoren je novi zapis. Prethodni lokalni zapisi ostaju dostupni.");
    setPublicLink("");
    setCustomProject(false);
  }

  function loadEntry(id: string) {
    const raw = localStorage.getItem(STORAGE_PREFIX + id);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Entry;
      setEntry(parsed);
      setCustomProject(!PROJECTS.includes(parsed.project));
      setNotice("");
      setPublicLink("");
    } catch { setNotice("Zapis nije moguće pročitati."); }
  }

  async function addFiles(list: FileList | null) {
    if (!entry || !list?.length) return;
    const accepted: Attachment[] = [];
    const rejected: string[] = [];
    for (const file of Array.from(list)) {
      if (entry.attachments.length + accepted.length >= 12) { rejected.push(file.name + " (najviše 12 privitaka)"); continue; }
      if (file.size > MAX_FILE || !ALLOWED_EXTENSIONS.test(file.name)) { rejected.push(file.name + " (format ili > 50 MB)"); continue; }
      const id = crypto.randomUUID();
      try {
        await saveFile(id, file);
        accepted.push({ id, name: file.name, size: file.size, type: file.type || "application/octet-stream" });
      } catch { rejected.push(file.name + " (lokalna pohrana nije uspjela)"); }
    }
    if (accepted.length) change({ attachments: [...entry.attachments, ...accepted] });
    setNotice(
      (accepted.length ? "Datoteke su spremljene samo u ovom pregledniku. " : "") +
      (rejected.length ? "Nisu dodane: " + rejected.join(", ") : "")
    );
  }

  async function removeAttachment(id: string) {
    await removeFile(id).catch(() => undefined);
    change({ attachments: entry?.attachments.filter((file) => file.id !== id) || [] });
  }

  function exportText() {
    if (!entry) return;
    const data = "# " + (entry.title || "Bez naslova") + "\nProjekt: " + entry.project + "\nVidljivost: " + entry.visibility +
      "\n\n" + createPostBody(entry, []) +
      "\n\nPrivitci (lokalno):\n" + entry.attachments.map((file) => "- " + file.name).join("\n");
    const url = URL.createObjectURL(new Blob([data], { type: "text/markdown;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = entry.slug + ".md";
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function saveToCloud() {
    if (!entry || busy) return;
    if (!entry.title.trim() || !(entry.technical.trim() || entry.prose.trim())) {
      setNotice("Naslov i barem jedan zapis su obvezni.");
      return;
    }
    if (entry.visibility === "public" && !window.confirm("OBJAVITI JAVNO? Tekst i odabrane datoteke postat će dostupni svakome. Objavljene datoteke ostaju javne i ako kasnije sakriješ zapis.")) return;
    setBusy(true);
    setNotice("Spremanje…");
    const linkedAssets: Array<{ name: string; type: string; url: string }> = [];
    const uploaded = { ...entry.uploaded };
    try {
      if (entry.visibility === "public") {
        for (const attachment of entry.attachments) {
          let url = uploaded[attachment.id];
          if (!url) {
            const file = await readFile(attachment.id);
            if (!file) throw new Error("Nedostaje lokalna datoteka: " + attachment.name);
            const safeName = attachment.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
            const result = await upload("project-assets/" + entry.slug + "/" + safeName, file, {
              access: "public",
              handleUploadUrl: "/api/upload-client",
            });
            if (!result.url.startsWith("https://")) throw new Error("Poslužitelj nije vratio sigurnu adresu datoteke.");
            url = result.url;
            uploaded[attachment.id] = url;
            // Persist each completed upload immediately: retries must not duplicate files.
            try { localStorage.setItem(STORAGE_PREFIX + entry.slug, JSON.stringify({ ...entry, uploaded })); } catch {}
            setEntry((current) => current?.slug === entry.slug ? { ...current, uploaded: { ...uploaded } } : current);
          }
          linkedAssets.push({ name: attachment.name, type: attachment.type, url });
        }
        setEntry((current) => current?.slug === entry.slug ? { ...current, uploaded } : current);
      }
      const images = linkedAssets.filter((file) => file.type.startsWith("image/")).map((file) => ({
        src: file.url, alt: file.name, caption: "", label: "RADNI MATERIJAL",
      }));
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: entry.slug, title: entry.title.trim(),
          dek: "Projekt: " + entry.project + " · " + (entry.technical.trim() ? "tehnički" : "") +
            (entry.technical.trim() && entry.prose.trim() ? " + " : "") + (entry.prose.trim() ? "prozni" : "") + " zapis",
          body: createPostBody(entry, linkedAssets), visibility: entry.visibility,
          category: entry.project.toUpperCase().slice(0, 80),
          status: "design-note", build: "JOURNAL", images,
          publish: entry.visibility === "public",
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Pohrana u bazu nije uspjela.");
      if (entry.visibility === "public") {
        setPublicLink("/devlog/" + entry.slug);
        setNotice("OBJAVLJENO. Zapis je dostupan na javnoj stranici.");
      } else {
        setNotice("PRIVATNI TEKST SPREMLJEN U BAZU. Privitci su još uvijek samo na ovom uređaju.");
      }
    } catch (error) {
      setNotice("NEUSPJEH: " + (error instanceof Error ? error.message : "Nepoznata pogreška") +
        (linkedAssets.length ? " Već prenesene datoteke mogu biti javno dostupne i potrebno ih je pregledati u Blob pohrani." : ""));
    } finally { setBusy(false); }
  }

  if (!entry) return <div className={styles.wrapper}>Učitavanje dnevnika…</div>;

  return (
    <div className={styles.wrapper}>
      <header className={styles.heading}>
        <div><div className={styles.eyebrow}>KARLOLEGEND / STUDIO / 001</div>
          <h1>DNEVNIK RADA</h1>
          <p>Tekst. Snimka. Projekt. Odluka o vidljivosti. Bez editiranja koda.</p>
        </div>
        <button className={styles.secondaryButton} onClick={newEntry}>+ Novi zapis</button>
      </header>
      <div className={styles.layout}>
        <aside className={styles.aside}>
          <div className={styles.eyebrow}>LOKALNI ZAPISI</div>
          {index.map((id) => {
            let item: Entry | null = null;
            try { item = JSON.parse(localStorage.getItem(STORAGE_PREFIX + id) || "null") as Entry | null; } catch {}
            if (!item) return null;
            return <button key={id} className={id === entry.slug ? styles.activeDraft : styles.draft} onClick={() => loadEntry(id)}>
              <strong>{item.title || "Bez naslova"}</strong><span>{item.project}</span>
            </button>;
          })}
          <p className={styles.small}>Nacrti i neobjavljeni privitci čuvaju se u pregledniku ovog uređaja. To nije sigurnosna kopija.</p>
          <Link href="/studio/write" className={styles.textLink}>Otvori postojeći Writing Desk →</Link>
        </aside>
        <section className={styles.editor}>
          <div className={styles.formRow}>
            <label className={styles.field}><span>NASLOV</span>
              <input value={entry.title} onChange={(e) => change({ title: e.target.value })} placeholder="Što se danas dogodilo?" maxLength={220} />
            </label>
            <label className={styles.field}><span>PROJEKT</span>
              <select value={customProject ? "other" : entry.project} onChange={(e) => {
                if (e.target.value === "other") { setCustomProject(true); change({ project: "" }); }
                else { setCustomProject(false); change({ project: e.target.value }); }
              }}>
                {PROJECTS.map((project) => <option key={project} value={project}>{project}</option>)}
                <option value="other">Drugi projekt…</option>
              </select>
            </label>
          </div>
          {customProject && <label className={styles.field}><span>NOVI NAZIV PROJEKTA</span>
            <input value={entry.project} onChange={(e) => change({ project: e.target.value })} maxLength={80} placeholder="Naziv projekta" />
          </label>}
          <label className={styles.field}><span>01 / TEHNIČKI LOG</span>
            <textarea rows={8} value={entry.technical} onChange={(e) => change({ technical: e.target.value })} placeholder="Verzija, izmijenjene datoteke, problem, konkretan zahvat, test, preostale greške…"/>
          </label>
          <label className={styles.field}><span>02 / PROZNI DNEVNIK</span>
            <textarea rows={8} value={entry.prose} onChange={(e) => change({ prose: e.target.value })} placeholder="Što se dogodilo u radu? Koja odluka ima smisla tek sada? Što ostaje neriješeno?"/>
          </label>
          <div className={styles.attachments}>
            <div><div className={styles.eyebrow}>03 / MATERIJALI</div><p>Slike, screen recordings, zvuk, PDF i buildovi (najviše 12 × 50 MB).</p></div>
            <label className={styles.fileLabel}>+ Dodaj datoteke<input type="file" multiple accept="image/*,video/mp4,video/webm,audio/*,.pdf,.zip,.txt,.md" onChange={(e) => { void addFiles(e.target.files); e.target.value = ""; }}/></label>
          </div>
          {entry.attachments.length > 0 && <div className={styles.assetList}>
            {entry.attachments.map((file) => <div key={file.id} className={styles.asset}>
              <span><strong>{file.name}</strong><small>{formatSize(file.size)} · lokalna datoteka</small></span>
              <button onClick={() => void removeAttachment(file.id)} aria-label={"Ukloni " + file.name}>Ukloni</button>
            </div>)}
          </div>}
          <div className={styles.publication}>
            <div><div className={styles.eyebrow}>04 / PRISTUP</div>
              <p>Privatni zapis nije dostupan javnosti. Objavljeni privitci prenose se u javnu pohranu.</p>
            </div>
            <div className={styles.visibility}>
              <button aria-pressed={entry.visibility === "private"} className={entry.visibility === "private" ? styles.selected : ""} onClick={() => change({ visibility: "private" })}>Privatno</button>
              <button aria-pressed={entry.visibility === "public"} className={entry.visibility === "public" ? styles.selected : ""} onClick={() => change({ visibility: "public" })}>Javno</button>
            </div>
          </div>
          <div className={styles.actions}>
            <span className={styles.small} role="status">{saveState}</span>
            <button className={styles.secondaryButton} onClick={exportText}>Izvezi .md</button>
            <button className={styles.primaryButton} disabled={busy} onClick={() => void saveToCloud()}>
              {busy ? "Spremanje…" : entry.visibility === "public" ? "Objavi na webu" : "Spremi privatni tekst u oblak"}
            </button>
          </div>
          {notice && <div className={styles.notice} role="status">{notice}</div>}
          {publicLink && <Link className={styles.textLink} href={publicLink} target="_blank">Otvori javni zapis ↗</Link>}
        </section>
      </div>
    </div>
  );
}
