"use client";

import { Download, Eraser, Hand, Link2, Minus, MousePointer2, Pencil, Plus, Redo2, StickyNote, Trash2, Undo2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Note = { id: string; x: number; y: number; text: string; color: "bone" | "red" | "blue" | "green"; width: number };
type Point = { x: number; y: number };
type Stroke = { id: string; points: Point[]; color: string; width: number };

const starterNotes: Note[] = [
  { id: "n1", x: 190, y: 150, text: "Why does the last bus stop here if nobody gets off?", color: "bone", width: 230 },
  { id: "n2", x: 620, y: 340, text: "Branimir hears the consequence before he knows the choice.", color: "red", width: 250 },
  { id: "n3", x: 1050, y: 175, text: "MOTEL\n11 keys / 14 rooms\nWho has the copies?", color: "blue", width: 220 },
  { id: "n4", x: 790, y: 700, text: "NORMAL ACTION:\nReturn the municipal key.", color: "green", width: 220 },
];

export function WorldWhiteboard() {
  const [notes, setNotes] = useState<Note[]>(starterNotes);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [tool, setTool] = useState<"select" | "draw" | "erase">("select");
  const [zoom, setZoom] = useState(0.8);
  const [saved, setSaved] = useState("Board ready");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef<Stroke | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const local = JSON.parse(window.localStorage.getItem("veo-whiteboard") || "null");
        if (local) { setNotes(local.notes || starterNotes); setStrokes(local.strokes || []); }
      } catch { /* starter board remains */ }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      window.localStorage.setItem("veo-whiteboard", JSON.stringify({ notes, strokes }));
      setSaved(`Saved ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
    }, 450);
    return () => clearTimeout(timer);
  }, [notes, strokes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.lineCap = "round";
    context.lineJoin = "round";
    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      context.beginPath();
      context.strokeStyle = stroke.color;
      context.lineWidth = stroke.width;
      context.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (const point of stroke.points.slice(1)) context.lineTo(point.x, point.y);
      context.stroke();
    }
  }, [strokes]);

  const pointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / zoom, y: (event.clientY - rect.top) / zoom };
  };

  const pointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (tool === "select") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointFromEvent(event);
    if (tool === "erase") {
      const closest = strokes.findLast((stroke) => stroke.points.some((item) => Math.hypot(item.x - point.x, item.y - point.y) < 18));
      if (closest) setStrokes((items) => items.filter((item) => item.id !== closest.id));
      return;
    }
    drawingRef.current = { id: crypto.randomUUID(), points: [point], color: "rgba(180, 43, 37, .78)", width: 3 };
  };

  const pointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || tool !== "draw") return;
    drawingRef.current.points.push(pointFromEvent(event));
    setStrokes((items) => [...items.filter((item) => item.id !== drawingRef.current?.id), { ...drawingRef.current! }]);
  };

  const pointerUp = () => { drawingRef.current = null; };

  const addNote = () => {
    setNotes((items) => [...items, { id: crypto.randomUUID(), x: 460 + Math.random() * 260, y: 250 + Math.random() * 220, text: "New fragment…", color: "bone", width: 220 }]);
    setTool("select");
  };

  const exportBoard = () => {
    const blob = new Blob([JSON.stringify({ notes, strokes, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "veo-zavod-worldboard.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="whiteboard-page">
      <header className="whiteboard-header">
        <div><p>WORLD WHITEBOARD / BOARD 01</p><h1>Prudina — loose structure</h1><span>{saved} / local-first</span></div>
        <div className="whiteboard-header-actions"><button onClick={exportBoard}><Download size={14} /> Export</button><button className="studio-primary-button" onClick={addNote}><Plus size={14} /> New note</button></div>
      </header>
      <div className="whiteboard-frame">
        <div className="whiteboard-toolbar" role="toolbar" aria-label="Whiteboard tools">
          <button className={tool === "select" ? "active" : ""} onClick={() => setTool("select")} title="Select and move notes"><MousePointer2 size={17} /></button>
          <button title="Pan board (use scroll or trackpad)"><Hand size={17} /></button>
          <i />
          <button className={tool === "draw" ? "active" : ""} onClick={() => setTool("draw")} title="Draw freehand"><Pencil size={17} /></button>
          <button className={tool === "erase" ? "active" : ""} onClick={() => setTool("erase")} title="Erase a stroke"><Eraser size={17} /></button>
          <button onClick={addNote} title="Add sticky note"><StickyNote size={17} /></button>
          <button title="Connections are represented by red lines"><Link2 size={17} /></button>
          <i />
          <button onClick={() => setStrokes((items) => items.slice(0, -1))} title="Undo last stroke"><Undo2 size={17} /></button>
          <button title="Redo is available in exported board history" disabled><Redo2 size={17} /></button>
          <button onClick={() => { if (confirm("Clear every drawing stroke? Notes will stay.")) setStrokes([]); }} title="Clear drawings"><Trash2 size={17} /></button>
        </div>
        <div className="whiteboard-zoom"><button onClick={() => setZoom((value) => Math.max(0.45, value - 0.1))}><Minus size={13} /></button><span>{Math.round(zoom * 100)}%</span><button onClick={() => setZoom((value) => Math.min(1.25, value + 0.1))}><Plus size={13} /></button></div>
        <div className="whiteboard-viewport" ref={boardRef}>
          <div className={`world-board tool-${tool}`} style={{ transform: `scale(${zoom})` }}>
            <svg className="board-connections" width="1800" height="1200" viewBox="0 0 1800 1200" aria-hidden="true">
              <path d="M420 245 C520 240 525 380 620 410" /><path d="M870 420 C1020 410 945 275 1050 245" /><path d="M745 555 C730 650 780 670 800 700" />
            </svg>
            <canvas ref={canvasRef} width={1800} height={1200} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} />
            {notes.map((note) => <BoardNote key={note.id} note={note} zoom={zoom} enabled={tool === "select"} onChange={(next) => setNotes((items) => items.map((item) => item.id === next.id ? next : item))} onDelete={() => setNotes((items) => items.filter((item) => item.id !== note.id))} />)}
            <div className="board-title-stamp"><span>VEO ZAVOD / RELATION MAP</span><strong>NOT CANON UNTIL IT SURVIVES A BUILD</strong></div>
          </div>
        </div>
      </div>
      <div className="whiteboard-tip"><span>TIP 03</span><p>Mess is data. Name a note only when naming it helps you find or connect it.</p><button>×</button></div>
    </main>
  );
}

function BoardNote({ note, zoom, enabled, onChange, onDelete }: { note: Note; zoom: number; enabled: boolean; onChange: (note: Note) => void; onDelete: () => void }) {
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const down = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!enabled || (event.target as HTMLElement).closest("textarea, button")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, ox: note.x, oy: note.y };
  };
  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    onChange({ ...note, x: Math.max(0, dragRef.current.ox + (event.clientX - dragRef.current.x) / zoom), y: Math.max(0, dragRef.current.oy + (event.clientY - dragRef.current.y) / zoom) });
  };
  return (
    <div className={`board-note note-${note.color}`} style={{ left: note.x, top: note.y, width: note.width }} onPointerDown={down} onPointerMove={move} onPointerUp={() => { dragRef.current = null; }}>
      <div className="note-grip"><span>•••</span><button onClick={onDelete} aria-label="Delete note">×</button></div>
      <textarea value={note.text} onChange={(event) => onChange({ ...note, text: event.target.value })} aria-label="Whiteboard note" />
      <div className="note-colors">{(["bone", "red", "blue", "green"] as const).map((color) => <button key={color} className={color} onClick={() => onChange({ ...note, color })} aria-label={`Make note ${color}`} />)}</div>
    </div>
  );
}
