"use client";
/* eslint-disable @next/next/no-img-element -- IndexedDB object URLs must stay local and bypass the image optimizer */

import { Archive, Cloud, File, FileAudio, FileImage, FileVideo, Grid2X2, HardDrive, ImagePlus, List, MoreHorizontal, Music2, Pencil, RotateCw, Search, ShieldCheck, UploadCloud, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ModelInspector } from "./model-inspector";

type VaultFile = { id: string; name: string; type: string; size: number; updated: number; blob: Blob; url?: string };

export function MediaVault() {
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadFiles = useCallback(async () => {
    const stored = await getAllVaultFiles();
    setFiles(stored.map((file) => ({ ...file, url: URL.createObjectURL(file.blob) })));
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadFiles(), 0);
    return () => window.clearTimeout(timer);
  }, [loadFiles]);

  const addFiles = async (list: FileList | File[]) => {
    setDragging(false);
    for (const file of Array.from(list)) {
      const entry: VaultFile = { id: crypto.randomUUID(), name: file.name, type: file.type || inferMime(file.name), size: file.size, updated: Date.now(), blob: file };
      await putVaultFile(entry);
    }
    setFiles((current) => { current.forEach((file) => file.url && URL.revokeObjectURL(file.url)); return []; });
    await loadFiles();
  };

  const removeFile = async (id: string) => {
    await deleteVaultFile(id);
    setFiles((current) => current.filter((file) => file.id !== id));
  };

  const renameFile = async (file: VaultFile) => {
    const nextName = prompt("Rename asset", file.name)?.trim();
    if (!nextName || nextName === file.name) return;
    const updated = new Date().getTime();
    await putVaultFile({ ...file, name: nextName, updated, url: undefined });
    await loadFiles();
  };

  const sendToWhiteboard = async (file: VaultFile) => {
    if (!categoryOf(file.type, file.name).startsWith("image")) return;
    const form = new FormData();
    form.set("file", new globalThis.File([file.blob], file.name, { type: file.type || "image/png" }));
    const response = await fetch("/api/whiteboard/assets", { method: "POST", body: form });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      alert(payload.error || "Whiteboard database upload failed.");
      return;
    }
    alert("Photo saved to the whiteboard database library.");
  };

  const rotateImageCopy = async (file: VaultFile) => {
    if (categoryOf(file.type, file.name) !== "image") return;
    const rotated = await rotateImageBlob(file.blob, file.type || "image/png");
    const updated = new Date().getTime();
    await putVaultFile({ id: crypto.randomUUID(), name: `rotated-${file.name}`, type: rotated.type, size: rotated.size, updated, blob: rotated });
    await loadFiles();
  };

  const filtered = useMemo(() => files.filter((file) => {
    const category = categoryOf(file.type, file.name);
    return (type === "all" || category === type) && file.name.toLowerCase().includes(query.toLowerCase());
  }), [files, query, type]);

  const storage = files.reduce((total, file) => total + file.size, 0);

  return (
    <main className="media-vault-page">
      <header className="studio-page-heading">
        <div><p>MEDIA VAULT / INDEXEDDB LOCAL STORAGE</p><h1>Keep the source. Inspect the copy.</h1><span>Photos, video, music, references and portable 3D assets stay in their original format.</span></div>
        <button className="studio-primary-button" onClick={() => inputRef.current?.click()}><UploadCloud size={14} /> Upload assets</button>
        <input ref={inputRef} type="file" multiple hidden accept="image/*,video/*,audio/*,.glb,.gltf,.fbx,.obj,.pdf,.txt" onChange={(event) => event.target.files && addFiles(event.target.files)} />
      </header>

      <div className="vault-status-row">
        <div><HardDrive size={17} /><span>LOCAL VAULT</span><strong>{formatBytes(storage)} stored</strong><i>Persistent in this browser</i></div>
        <div><Cloud size={17} /><span>CLOUD SYNC</span><strong>Adapter ready</strong><i>Connect Vercel Blob token</i></div>
        <div><ShieldCheck size={17} /><span>UPLOAD POLICY</span><strong>Owner-only writes</strong><i>Public visitors cannot upload</i></div>
      </div>

      <div className="media-layout">
        <section className="vault-panel">
          <div
            className={dragging ? "vault-dropzone dragging" : "vault-dropzone"}
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => { event.preventDefault(); addFiles(event.dataTransfer.files); }}
            onClick={() => inputRef.current?.click()}
          >
            <UploadCloud size={24} /><div><strong>Drop anything from the project</strong><span>Images / video / lossless audio / documents / GLB + GLTF</span></div><button>Choose files</button>
          </div>
          <div className="vault-controls">
            <div className="vault-search"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this vault…" />{query && <button onClick={() => setQuery("")}><X size={12} /></button>}</div>
            <div className="vault-types">{["all", "image", "video", "audio", "3d", "document"].map((value) => <button key={value} className={type === value ? "active" : ""} onClick={() => setType(value)}>{value === "all" ? "All" : value.toUpperCase()}</button>)}</div>
            <div className="vault-view"><button className={view === "grid" ? "active" : ""} onClick={() => setView("grid")}><Grid2X2 size={14} /></button><button className={view === "list" ? "active" : ""} onClick={() => setView("list")}><List size={14} /></button></div>
          </div>
          <div className="vault-count"><span>{filtered.length} ASSETS</span><i /> <span>SORT: NEWEST</span></div>
          {loading ? <div className="vault-empty">Reading local vault…</div> : filtered.length === 0 ? <div className="vault-empty"><Archive size={25} /><strong>{files.length ? "No assets match this view." : "The vault is empty."}</strong><span>Drop a file above. It stays available after refresh.</span></div> : (
            <div className={view === "grid" ? "vault-file-grid" : "vault-file-list"}>
              {filtered.map((file) => <VaultFileCard key={file.id} file={file} onDelete={() => removeFile(file.id)} onRename={() => renameFile(file)} onSendToWhiteboard={() => sendToWhiteboard(file)} onRotate={() => rotateImageCopy(file)} />)}
            </div>
          )}
        </section>
        <ModelInspector />
      </div>
    </main>
  );
}

function VaultFileCard({ file, onDelete, onRename, onSendToWhiteboard, onRotate }: { file: VaultFile; onDelete: () => void; onRename: () => void; onSendToWhiteboard: () => void; onRotate: () => void }) {
  const category = categoryOf(file.type, file.name);
  return (
    <article className="vault-file-card">
      <div className={`vault-preview preview-${category}`}>
        {category === "image" && file.url ? <img src={file.url} alt="" /> : category === "video" && file.url ? <video src={file.url} muted /> : category === "audio" && file.url ? <><Music2 size={23} /><audio controls preload="metadata" src={file.url} /></> : iconFor(category)}
        <span>{category.toUpperCase()}</span>
      </div>
      <div className="vault-file-info"><strong title={file.name}>{file.name}</strong><span>{formatBytes(file.size)} / {new Date(file.updated).toLocaleDateString()}</span></div>
      <div className="vault-quick-actions">
        <button onClick={onRename}><Pencil size={11} /> Rename</button>
        {category === "image" && <button className="send-board" onClick={onSendToWhiteboard}><ImagePlus size={11} /> Whiteboard</button>}
        {category === "image" && <button onClick={onRotate}><RotateCw size={11} /> Rotate</button>}
      </div>
      <div className="file-menu"><button><MoreHorizontal size={14} /></button><div><a href={file.url} download={file.name}>Download original</a><button onClick={onRename}>Rename</button>{category === "image" && <button onClick={onRotate}>Rotate 90° copy</button>}{category === "image" && <button onClick={onSendToWhiteboard}>Send to whiteboard</button>}<button onClick={onDelete}>Remove from vault</button></div></div>
    </article>
  );
}

function iconFor(category: string) {
  if (category === "audio") return <FileAudio size={29} />;
  if (category === "video") return <FileVideo size={29} />;
  if (category === "image") return <FileImage size={29} />;
  return <File size={29} />;
}

function categoryOf(mime: string, name: string) {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (/\.(glb|gltf|fbx|obj)$/i.test(name)) return "3d";
  return "document";
}

function inferMime(name: string) {
  if (/\.(glb|gltf)$/i.test(name)) return "model/gltf-binary";
  return "application/octet-stream";
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index > 1 ? 1 : 0)} ${units[index]}`;
}

function openVault() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("veo-zavod-vault", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("files", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function putVaultFile(file: VaultFile) {
  const db = await openVault();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("files", "readwrite");
    transaction.objectStore("files").put({ ...file, url: undefined });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

async function getAllVaultFiles() {
  const db = await openVault();
  const files = await new Promise<VaultFile[]>((resolve, reject) => {
    const request = db.transaction("files", "readonly").objectStore("files").getAll();
    request.onsuccess = () => resolve(request.result as VaultFile[]);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return files.sort((a, b) => b.updated - a.updated);
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

async function rotateImageBlob(blob: Blob, type: string) {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.height;
  canvas.height = bitmap.width;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable.");
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate(Math.PI / 2);
  context.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((rotated) => rotated ? resolve(rotated) : reject(new Error("Could not rotate image.")), type);
  });
}
