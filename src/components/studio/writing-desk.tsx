"use client";

import {
  Bold,
  Check,
  Clock3,
  Download,
  Eye,
  Heading2,
  Italic,
  List,
  Maximize2,
  Minimize2,
  Quote,
  Redo2,
  Save,
  Sparkles,
  Undo2,
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

const seed = `The station continued after midnight because nobody had written down who was allowed to turn it off.\n\nBranimir checked the same three dials in the same order. The first measured the transmitter. The second measured the room. The third had not been connected since 1998, but leaving it unchecked made the others feel less true.\n\nOutside, snow gathered in the dish until every voice arriving from the town sounded briefly underwater.`;

export function WritingDesk() {
  const [title, setTitle] = useState("The repeater does not hum");
  const [body, setBody] = useState(seed);
  const [kind, setKind] = useState("Scene / prose");
  const [visibility, setVisibility] = useState("Private draft");
  const [savedAt, setSavedAt] = useState("Not saved yet");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [focus, setFocus] = useState(false);
  const [preview, setPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const historyRef = useRef<string[]>([seed]);
  const historyIndexRef = useRef(0);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const draft = JSON.parse(window.localStorage.getItem("veo-writing-draft") || "null");
        if (draft) {
          setTitle(draft.title || "Untitled");
          setBody(draft.body || "");
          setKind(draft.kind || "Scene / prose");
          setVisibility(draft.visibility || "Private draft");
          setSavedAt(draft.savedAt ? `Restored ${new Date(draft.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Restored");
          historyRef.current = [draft.body || ""];
        }
      } catch { /* a malformed local draft should never block the editor */ }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = new Date().toISOString();
      window.localStorage.setItem("veo-writing-draft", JSON.stringify({ title, body, kind, visibility, savedAt: saved }));
      setSavedAt(`Saved locally ${new Date(saved).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [body, kind, title, visibility]);

  const words = useMemo(() => body.trim() ? body.trim().split(/\s+/).length : 0, [body]);
  const paragraphs = useMemo(() => body.split(/\n\s*\n/).filter(Boolean).length, [body]);

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
    anchor.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "draft"}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className={focus ? "writing-desk focus-mode" : "writing-desk"}>
      <header className="writing-topline">
        <div>
          <span>WRITING DESK / AUTOSAVE ON</span>
          <div className="save-state"><Check size={12} /> {savedAt}</div>
        </div>
        <div className="writing-actions">
          <button onClick={() => setPreview((value) => !value)} className={preview ? "active" : ""}><Eye size={14} /> {preview ? "Edit" : "Preview"}</button>
          <button onClick={exportDraft}><Download size={14} /> Export .md</button>
          <button onClick={() => setFocus((value) => !value)} aria-label={focus ? "Exit focus mode" : "Enter focus mode"}>{focus ? <Minimize2 size={15} /> : <Maximize2 size={15} />}</button>
        </div>
      </header>

      <div className="writing-settings">
        <label><span>DOCUMENT TYPE</span><select value={kind} onChange={(event) => setKind(event.target.value)}><option>Scene / prose</option><option>Dialogue script</option><option>Devlog post</option><option>World lore</option><option>Life log</option><option>Private thought</option></select></label>
        <label><span>VISIBILITY</span><select value={visibility} onChange={(event) => setVisibility(event.target.value)}><option>Private draft</option><option>Internal canon</option><option>Public when published</option></select></label>
        <div className="writing-counts"><span>{words} WORDS</span><span>{paragraphs} PARAGRAPHS</span><span>~{Math.max(1, Math.ceil(words / 220))} MIN READ</span></div>
      </div>

      <div className="writing-workspace">
        <section className="editor-panel">
          <div className="editor-toolbar" role="toolbar" aria-label="Text formatting">
            <button onClick={undo} title="Undo"><Undo2 size={15} /></button><button onClick={redo} title="Redo"><Redo2 size={15} /></button><i />
            <button onClick={() => wrapSelection("**")} title="Bold"><Bold size={15} /></button><button onClick={() => wrapSelection("_")} title="Italic"><Italic size={15} /></button>
            <button onClick={() => wrapSelection("## ", "")} title="Heading"><Heading2 size={15} /></button><button onClick={() => wrapSelection("> ", "")} title="Quote"><Quote size={15} /></button><button onClick={() => wrapSelection("- ", "")} title="List"><List size={15} /></button>
            <span>Markdown-safe formatting</span>
          </div>
          <div className="document-sheet">
            <input className="document-title" value={title} onChange={(event) => setTitle(event.target.value)} aria-label="Document title" />
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
          <aside className="feedback-panel">
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
            <div className="writing-goal"><div><span>TODAY&apos;S GENTLE LIMIT</span><strong>{Math.min(words, 500)} / 500 useful words</strong></div><div><i style={{ width: `${Math.min(100, words / 5)}%` }} /></div><p>Stopping while you still know what comes next is allowed.</p></div>
          </aside>
        )}
      </div>
    </main>
  );
}
