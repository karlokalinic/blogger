"use client";
/* eslint-disable @next/next/no-img-element -- Studio previews use local data URLs and user-uploaded Blob URLs. */

import {
  Bold,
  Check,
  Clock3,
  Download,
  Eye,
  FileText,
  Heading2,
  ImagePlus,
  Italic,
  List,
  LoaderCircle,
  Maximize2,
  Minimize2,
  Pin,
  Plus,
  Quote,
  Redo2,
  Save,
  Sparkles,
  Trash2,
  Undo2,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Analysis = {
  words: number;
  sentences: number;
  readingMinutes: number;
  clarity: number;
  notes: Array<{ tone: "good" | "warn" | "info"; title: string; detail: string }>;
  repeats: string[];
};

type PaperDoc = {
  id: string;
  title: string;
  body: string;
  kind: string;
  visibility: string;
  updated: number;
};

type StudioPostRow = {
  slug: string;
  title: string;
  dek?: string;
  body?: string;
  visibility?: string;
  category?: string;
  status?: "prototype" | "implemented" | "testing" | "design-note";
  build?: string;
  cover_url?: string | null;
  cover_position?: string | null;
  header_url?: string | null;
  header_position?: string | null;
  images?: GalleryPhoto[] | string | null;
  pinned?: boolean;
};

type GalleryPhoto = { src: string; alt: string; caption: string; label: string; position?: string };
type PendingPhoto = { id: string; name: string; preview: string; file?: File; url?: string; caption: string };

const seed = `The station continued after midnight because nobody had written down who was allowed to turn it off.\n\nBranimir checked the same three dials in the same order. The first measured the transmitter. The second measured the room. The third had not been connected since 1998, but leaving it unchecked made the others feel less true.\n\nOutside, snow gathered in the dish until every voice arriving from the town sounded briefly underwater.`;

export function WritingDesk() {
  const [title, setTitle] = useState("The repeater does not hum");
  const [slug, setSlug] = useState("the-repeater-does-not-hum");
  const [dek, setDek] = useState("A field note from the production desk.");
  const [body, setBody] = useState(seed);
  const [kind, setKind] = useState("Scene / prose");
  const [visibility, setVisibility] = useState<"private" | "internal" | "public">("private");
  const [category, setCategory] = useState("WRITING");
  const [status, setStatus] = useState<"prototype" | "implemented" | "testing" | "design-note">("design-note");
  const [build, setBuild] = useState("0.4.9");
  const [pinned, setPinned] = useState(false);
  const [savedAt, setSavedAt] = useState("Not saved yet");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [focus, setFocus] = useState(false);
  const [preview, setPreview] = useState(false);
  const [activePaperId, setActivePaperId] = useState("");
  const [papers, setPapers] = useState<PaperDoc[]>([]);
  const [posts, setPosts] = useState<StudioPostRow[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [coverPosition, setCoverPosition] = useState(50);
  const [headerFile, setHeaderFile] = useState<File | null>(null);
  const [headerPreview, setHeaderPreview] = useState("");
  const [headerPosition, setHeaderPosition] = useState(50);
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const historyRef = useRef<string[]>([seed]);
  const historyIndexRef = useRef(0);

  const words = useMemo(() => body.trim() ? body.trim().split(/\s+/).length : 0, [body]);
  const paragraphs = useMemo(() => body.split(/\n\s*\n/).filter(Boolean).length, [body]);

  const editorState = useCallback((savedAtValue?: string) => ({
    title,
    slug,
    dek,
    body,
    kind,
    visibility,
    category,
    status,
    build,
    pinned,
    coverPreview,
    coverPosition,
    headerPreview,
    headerPosition,
    photos: photos.map((photo) => ({ id: photo.id, name: photo.name, preview: photo.preview, url: photo.url, caption: photo.caption })),
    savedAt: savedAtValue,
  }), [body, build, category, coverPosition, coverPreview, dek, headerPosition, headerPreview, kind, photos, pinned, slug, status, title, visibility]);

  const loadEditorState = useCallback((draft: Partial<ReturnType<typeof editorState>>) => {
    setTitle(draft.title || "Untitled");
    setSlug(draft.slug || slugify(draft.title || "untitled"));
    setDek(draft.dek || "");
    setBody(draft.body || "");
    setKind(draft.kind || "Scene / prose");
    setVisibility((draft.visibility as "private" | "internal" | "public") || "private");
    setCategory(draft.category || "WRITING");
    setStatus((draft.status as "prototype" | "implemented" | "testing" | "design-note") || "design-note");
    setBuild(draft.build || "0.4.9");
    setPinned(Boolean(draft.pinned));
    setCoverPreview(draft.coverPreview || "");
    setHeaderPreview(draft.headerPreview || "");
    setCoverPosition(Number(draft.coverPosition ?? 50));
    setHeaderPosition(Number(draft.headerPosition ?? 50));
    setPhotos((draft.photos as PendingPhoto[]) || []);
    setCoverFile(null);
    setHeaderFile(null);
    historyRef.current = [draft.body || ""];
    historyIndexRef.current = 0;
  }, []);

  const updateTitle = (value: string) => {
    setTitle(value);
    setSlug((current) => current && current !== slugify(title) ? current : slugify(value));
  };

  const updateBody = (value: string) => {
    setBody(value);
    const history = historyRef.current.slice(0, historyIndexRef.current + 1);
    if (history.at(-1) !== value) {
      history.push(value);
      if (history.length > 60) history.shift();
      historyRef.current = history;
      historyIndexRef.current = history.length - 1;
    }
  };

  const undo = () => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    setBody(historyRef.current[historyIndexRef.current]);
  };

  const redo = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    setBody(historyRef.current[historyIndexRef.current]);
  };

  const wrapSelection = useCallback((before: string, after = before) => {
    const element = textareaRef.current;
    if (!element) return;
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const next = `${body.slice(0, start)}${before}${body.slice(start, end)}${after}${body.slice(end)}`;
    updateBody(next);
    requestAnimationFrame(() => {
      element.focus();
      element.setSelectionRange(start + before.length, end + before.length);
    });
  }, [body]);

  const analyze = async () => {
    setAnalyzing(true);
    try {
      const response = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: body }) });
      if (!response.ok) throw new Error("Analysis unavailable");
      setAnalysis(await response.json());
    } finally {
      setAnalyzing(false);
    }
  };

  const exportDraft = () => {
    const blob = new Blob([`# ${title}\n\n${body}\n`], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${slug || slugify(title) || "draft"}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const refreshPapers = useCallback(async () => setPapers(await getPaperDocuments()), []);

  const refreshPosts = useCallback(async () => {
    try {
      const response = await fetch("/api/posts?all=1", { cache: "no-store" });
      if (!response.ok) return;
      const payload = await response.json();
      setPosts((payload.posts || []) as StudioPostRow[]);
    } catch {
      setPosts([]);
    }
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const draft = JSON.parse(window.localStorage.getItem("veo-writing-draft") || "null");
        if (draft) {
          loadEditorState(draft);
          setSavedAt(draft.savedAt ? `Restored ${new Date(draft.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Restored");
        }
      } catch { /* a malformed local draft should never block the editor */ }
      void refreshPapers();
      void refreshPosts();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [loadEditorState, refreshPapers, refreshPosts]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = new Date().toISOString();
      window.localStorage.setItem("veo-writing-draft", JSON.stringify(editorState(saved)));
      setSavedAt(`Saved locally ${new Date(saved).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [editorState]);

  const savePaper = async () => {
    const doc: PaperDoc = { id: activePaperId || crypto.randomUUID(), title, body, kind, visibility, updated: new Date().getTime() };
    await putPaperDocument(doc);
    setActivePaperId(doc.id);
    setSavedAt(`Paper saved ${new Date(doc.updated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
    await refreshPapers();
  };

  const loadPaper = (paper: PaperDoc) => {
    setActivePaperId(paper.id);
    setTitle(paper.title);
    setSlug(slugify(paper.title));
    setBody(paper.body);
    setKind(paper.kind);
    setVisibility((paper.visibility as "private" | "internal" | "public") || "private");
    historyRef.current = [paper.body];
    historyIndexRef.current = 0;
    setSavedAt(`Loaded paper ${new Date(paper.updated).toLocaleDateString()}`);
  };

  const deletePaper = async (id: string) => {
    if (!confirm("Delete this saved paper from the local asset vault?")) return;
    await deleteVaultFile(id);
    if (activePaperId === id) setActivePaperId("");
    await refreshPapers();
  };

  const chooseImage = async (file: File | undefined, target: "cover" | "header") => {
    if (!file || !file.type.startsWith("image/")) return;
    const previewUrl = await fileToDataUrl(file);
    if (target === "cover") {
      setCoverFile(file);
      setCoverPreview(previewUrl);
    } else {
      setHeaderFile(file);
      setHeaderPreview(previewUrl);
    }
  };

  const addPhotos = async (list: FileList | null) => {
    if (!list) return;
    const next = await Promise.all(Array.from(list).filter((file) => file.type.startsWith("image/")).map(async (file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      preview: await fileToDataUrl(file),
      file,
      caption: "",
    })));
    setPhotos((current) => [...current, ...next]);
  };

  const savePost = async (publish: boolean) => {
    setPublishing(true);
    setPublishMessage("");
    try {
      const coverUrl = coverFile ? await uploadImage(coverFile) : coverPreview || null;
      const headerUrl = headerFile ? await uploadImage(headerFile) : headerPreview || null;
      const uploadedPhotos = await Promise.all(photos.map(async (photo, index) => ({
        src: photo.file ? await uploadImage(photo.file) : photo.url || photo.preview,
        alt: photo.caption || photo.name,
        caption: photo.caption || photo.name,
        label: `PHOTO ${String(index + 1).padStart(2, "0")}`,
        position: "50% 50%",
      })));
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slug || slugify(title),
          title,
          dek,
          body,
          visibility: publish ? "public" : visibility,
          coverUrl,
          coverPosition: `50% ${coverPosition}%`,
          headerUrl,
          headerPosition: `50% ${headerPosition}%`,
          category,
          status,
          build,
          images: uploadedPhotos,
          pinned,
          publish,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Database write failed.");
      setPublishMessage(publish ? "Published to the public devlog." : "Saved as a database draft.");
      await refreshPosts();
    } catch (error) {
      setPublishMessage(error instanceof Error ? error.message : "Database write failed.");
    } finally {
      setPublishing(false);
    }
  };

  const loadPost = (post: StudioPostRow) => {
    setTitle(post.title);
    setSlug(post.slug);
    setDek(post.dek || "");
    setBody(post.body || bodyFromSeedPost(post));
    setVisibility((post.visibility as "private" | "internal" | "public") || "public");
    setCategory(post.category || "WRITING");
    setStatus(post.status || "implemented");
    setBuild(post.build || "0.4.9");
    setPinned(Boolean(post.pinned));
    setCoverPreview(post.cover_url || "");
    setHeaderPreview(post.header_url || "");
    setCoverPosition(verticalPosition(post.cover_position));
    setHeaderPosition(verticalPosition(post.header_position));
    setCoverFile(null);
    setHeaderFile(null);
    setPhotos(parseGallery(post.images).map((item) => ({ id: crypto.randomUUID(), name: item.caption || item.alt || item.label, preview: item.src, url: item.src, caption: item.caption || "" })));
    setPublishMessage(`Loaded ${post.title}`);
  };

  return (
    <main className={focus ? "writing-desk focus-mode" : "writing-desk"}>
      <header className="writing-topline">
        <div>
          <span>WRITING DESK / PAPER + DATABASE</span>
          <div className="save-state"><Check size={12} /> {savedAt}</div>
        </div>
        <div className="writing-actions">
          <button onClick={savePaper}><FileText size={14} /> Save paper</button>
          <button onClick={() => savePost(false)} disabled={publishing}>{publishing ? <LoaderCircle className="spin" size={14} /> : <Save size={14} />} Save DB draft</button>
          <button onClick={() => savePost(true)} className="active" disabled={publishing}>{publishing ? <LoaderCircle className="spin" size={14} /> : <Upload size={14} />} Publish</button>
          <button onClick={() => setPreview((value) => !value)} className={preview ? "active" : ""}><Eye size={14} /> {preview ? "Edit" : "Preview"}</button>
          <button onClick={exportDraft}><Download size={14} /> Export .md</button>
          <button onClick={() => setFocus((value) => !value)} aria-label={focus ? "Exit focus mode" : "Enter focus mode"}>{focus ? <Minimize2 size={15} /> : <Maximize2 size={15} />}</button>
        </div>
      </header>

      {publishMessage && <div className={publishMessage.includes("failed") || publishMessage.includes("not configured") ? "publish-error writing-publish-message" : "writing-publish-message"}>{publishMessage}</div>}

      <div className="writing-settings writing-settings-expanded">
        <label><span>DOCUMENT TYPE</span><select value={kind} onChange={(event) => setKind(event.target.value)}><option>Scene / prose</option><option>Dialogue script</option><option>Devlog post</option><option>World lore</option><option>Life log</option><option>Private thought</option></select></label>
        <label><span>POST VISIBILITY</span><select value={visibility} onChange={(event) => setVisibility(event.target.value as "private" | "internal" | "public")}><option value="private">Private draft</option><option value="internal">Internal canon</option><option value="public">Public when published</option></select></label>
        <label><span>URL SLUG</span><input value={slug} onChange={(event) => setSlug(slugify(event.target.value))} /></label>
        <label><span>DEK / SUMMARY</span><input value={dek} onChange={(event) => setDek(event.target.value)} /></label>
        <label><span>CATEGORY</span><input value={category} onChange={(event) => setCategory(event.target.value.toUpperCase())} /></label>
        <label><span>STATUS</span><select value={status} onChange={(event) => setStatus(event.target.value as "prototype" | "implemented" | "testing" | "design-note")}><option value="prototype">Prototype</option><option value="implemented">Implemented</option><option value="testing">Testing</option><option value="design-note">Design note</option></select></label>
        <label><span>BUILD</span><input value={build} onChange={(event) => setBuild(event.target.value)} /></label>
        <button className={pinned ? "pin-toggle active" : "pin-toggle"} onClick={() => setPinned((value) => !value)}><Pin size={13} /> {pinned ? "Pinned" : "Pin post"}</button>
        <div className="writing-counts"><span>{words} WORDS</span><span>{paragraphs} PARAGRAPHS</span><span>~{Math.max(1, Math.ceil(words / 220))} MIN READ</span></div>
      </div>

      <div className="post-media-controls">
        <ImagePicker title="Header image" preview={headerPreview} position={headerPosition} onPosition={setHeaderPosition} onChoose={(file) => chooseImage(file, "header")} />
        <ImagePicker title="Cover photo" preview={coverPreview} position={coverPosition} onPosition={setCoverPosition} onChoose={(file) => chooseImage(file, "cover")} />
        <div className="post-photo-bin">
          <label><ImagePlus size={18} /><strong>Add post photos</strong><span>As many supporting images as the post needs.</span><input type="file" accept="image/*" multiple onChange={(event) => addPhotos(event.target.files)} /></label>
          <div>{photos.map((photo) => <div key={photo.id}><img src={photo.preview} alt="" /><input value={photo.caption} onChange={(event) => setPhotos((items) => items.map((item) => item.id === photo.id ? { ...item, caption: event.target.value } : item))} placeholder="Caption" /><button onClick={() => setPhotos((items) => items.filter((item) => item.id !== photo.id))}><Trash2 size={12} /></button></div>)}</div>
        </div>
      </div>

      <div className="writing-workspace">
        <section className="editor-panel">
          <div className="editor-toolbar" role="toolbar" aria-label="Text formatting">
            <button onClick={undo} title="Undo"><Undo2 size={15} /></button><button onClick={redo} title="Redo"><Redo2 size={15} /></button><i />
            <button onClick={() => wrapSelection("**")} title="Bold"><Bold size={15} /></button><button onClick={() => wrapSelection("_")} title="Italic"><Italic size={15} /></button>
            <button onClick={() => wrapSelection("## ", "")} title="Heading"><Heading2 size={15} /></button><button onClick={() => wrapSelection("> ", "")} title="Quote"><Quote size={15} /></button><button onClick={() => wrapSelection("- ", "")} title="List"><List size={15} /></button>
            <button onClick={() => { setTitle("Untitled document"); setSlug(""); setBody(""); setDek(""); setActivePaperId(""); setPhotos([]); }} title="New document"><Plus size={15} /></button>
            <span>Markdown-safe formatting</span>
          </div>
          <div className="document-sheet">
            <input className="document-title" value={title} onChange={(event) => updateTitle(event.target.value)} aria-label="Document title" />
            <div className="document-rule"><span>{kind.toUpperCase()}</span><i /></div>
            {preview ? (
              <div className="document-preview">
                {body.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph.replace(/^##\s*/, "").replace(/\*\*|_/g, "")}</p>)}
              </div>
            ) : (
              <textarea ref={textareaRef} value={body} onChange={(event) => updateBody(event.target.value)} spellCheck aria-label="Draft body" />
            )}
          </div>
        </section>

        {!focus && (
          <aside className="feedback-panel writing-library-panel">
            <div className="feedback-heading">
              <div><Sparkles size={15} /><span>FREE TEXT DIAGNOSTIC</span></div>
              <small>Rule-based. Your text is not sent to an AI.</small>
            </div>
            <button className="analyze-button" onClick={analyze} disabled={analyzing || words < 8}>{analyzing ? "Reading the draft…" : analysis ? "Analyze again" : "Analyze this draft"}</button>
            {!analysis ? (
              <div className="analysis-empty"><span>01</span><p>It checks rhythm, repetition, sentence load and vague filler. It does not rewrite your voice.</p><span>02</span><p>Suggestions are evidence, not orders. Ignore anything that makes the text less yours.</p></div>
            ) : (
              <div className="analysis-results">
                <div className="clarity-dial" style={{ "--score": `${analysis.clarity * 3.6}deg` } as React.CSSProperties}><div><strong>{analysis.clarity}</strong><span>READABILITY</span></div></div>
                <div className="analysis-metrics"><div><Clock3 size={13} /><span>{analysis.readingMinutes} min</span></div><div><Save size={13} /><span>{analysis.sentences} sentences</span></div></div>
                <div className="analysis-note-list">
                  {analysis.notes.map((note) => <div className={note.tone} key={note.title}><i /><p><strong>{note.title}</strong>{note.detail}</p></div>)}
                </div>
                {analysis.repeats.length > 0 && <div className="repeat-list"><span>REPEATED SIGNALS</span><div>{analysis.repeats.map((word) => <i key={word}>{word}</i>)}</div></div>}
              </div>
            )}
            <LibrarySection title="Saved papers" empty="No paper documents saved yet." items={papers.map((paper) => ({ id: paper.id, title: paper.title, meta: `${paper.kind} / ${new Date(paper.updated).toLocaleDateString()}`, pinned: false, onOpen: () => loadPaper(paper), onDelete: () => deletePaper(paper.id) }))} />
            <LibrarySection title="Database posts" empty="No database posts loaded." items={posts.map((post) => ({ id: post.slug, title: post.title, meta: `${post.visibility || "public"} / ${post.category || "POST"}`, pinned: Boolean(post.pinned), onOpen: () => loadPost(post) }))} />
          </aside>
        )}
      </div>
    </main>
  );
}

function ImagePicker({ title, preview, position, onPosition, onChoose }: { title: string; preview: string; position: number; onPosition: (value: number) => void; onChoose: (file?: File) => void }) {
  return (
    <div className="post-image-picker">
      <label>
        {preview ? <img src={preview} alt="" style={{ objectPosition: `50% ${position}%` }} /> : <><ImagePlus size={22} /><strong>{title}</strong><span>Upload JPG, PNG or WEBP</span></>}
        <input type="file" accept="image/*" onChange={(event) => onChoose(event.target.files?.[0])} />
      </label>
      <div><span>{title.toUpperCase()} POSITION</span><input type="range" min="0" max="100" value={position} onChange={(event) => onPosition(Number(event.target.value))} /></div>
    </div>
  );
}

function LibrarySection({ title, empty, items }: { title: string; empty: string; items: Array<{ id: string; title: string; meta: string; pinned: boolean; onOpen: () => void; onDelete?: () => void }> }) {
  return (
    <section className="writing-library-section">
      <header><span>{title}</span><strong>{items.length}</strong></header>
      {items.length ? items.map((item) => (
        <div className="library-row" key={item.id}>
          <button onClick={item.onOpen}><strong>{item.title}</strong><span>{item.pinned && <Pin size={10} />} {item.meta}</span></button>
          {item.onDelete && <button onClick={item.onDelete} aria-label={`Delete ${item.title}`}><Trash2 size={12} /></button>}
        </div>
      )) : <p>{empty}</p>}
    </section>
  );
}

async function uploadImage(file: File) {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch("/api/upload", { method: "POST", body: form });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Image upload failed.");
  return payload.url as string;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function verticalPosition(value?: string | null) {
  const parts = value?.match(/(\d+)%/g) || [];
  return Number((parts[1] || parts[0] || "50%").replace("%", ""));
}

function parseGallery(value: StudioPostRow["images"]): GalleryPhoto[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function bodyFromSeedPost(post: StudioPostRow) {
  const bodyValue = (post as unknown as { body?: string | Array<{ heading?: string; paragraphs: string[] }> }).body;
  if (typeof bodyValue === "string") return bodyValue;
  if (Array.isArray(bodyValue)) return bodyValue.map((section) => `${section.heading ? `## ${section.heading}\n\n` : ""}${section.paragraphs.join("\n\n")}`).join("\n\n");
  return "";
}

function openVault() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("veo-zavod-vault", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("files", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function putPaperDocument(doc: PaperDoc) {
  const db = await openVault();
  const blob = new Blob([`# ${doc.title}\n\n${doc.body}`], { type: "text/markdown;charset=utf-8" });
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("files", "readwrite");
    transaction.objectStore("files").put({
      id: doc.id,
      name: `${slugify(doc.title) || "paper"}.md`,
      type: "text/markdown",
      size: blob.size,
      updated: doc.updated,
      blob,
      paper: true,
      title: doc.title,
      body: doc.body,
      kind: doc.kind,
      visibility: doc.visibility,
    });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

async function getPaperDocuments() {
  const db = await openVault();
  const rows = await new Promise<Array<PaperDoc & { paper?: boolean; blob?: Blob }>>((resolve, reject) => {
    const request = db.transaction("files", "readonly").objectStore("files").getAll();
    request.onsuccess = () => resolve(request.result as Array<PaperDoc & { paper?: boolean; blob?: Blob }>);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return Promise.all(rows.filter((row) => row.paper).map(async (row) => ({
    id: row.id,
    title: row.title || "Untitled paper",
    body: row.body || await row.blob?.text() || "",
    kind: row.kind || "Scene / prose",
    visibility: row.visibility || "private",
    updated: row.updated || Date.now(),
  }))).then((docs) => docs.sort((a, b) => b.updated - a.updated));
}

async function deleteVaultFile(id: string) {
  const db = await openVault();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("files", "readwrite");
    transaction.objectStore("files").delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}
