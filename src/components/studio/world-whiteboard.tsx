"use client";
/* eslint-disable @next/next/no-img-element -- Whiteboard images are user-selected local object URLs or data exports. */

import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowRight,
  Bold,
  Circle,
  Copy,
  FileJson,
  FileText,
  FolderOpen,
  Hand,
  Heading1,
  Heading2,
  ImagePlus,
  Italic,
  Link2,
  Lock,
  Maximize2,
  Minimize2,
  MousePointer2,
  Move,
  Moon,
  PanelRightOpen,
  Plus,
  Presentation,
  Redo2,
  RotateCw,
  Save,
  Search,
  Sparkles,
  Square,
  Table2,
  Trash2,
  Type,
  Undo2,
  Unlock,
  UploadCloud,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Point = { x: number; y: number };
type Viewport = { x: number; y: number; zoom: number };
type TextAlign = "left" | "center" | "right" | "justify";
type Tool = "select" | "pan" | "text" | "link";
type HudEdge = "left" | "right" | "top" | "bottom";
type PatchIntent = "move" | "resize" | "rotate" | "edit";
type ContextMenuState = { x: number; y: number; world: Point; targetId?: string } | null;
type BoardAsset = { id: string; name: string; type: string; size: number; updated: number; url: string; pathname?: string };
type LegacyBoardAsset = Omit<BoardAsset, "url"> & { blob?: Blob; url?: string };
type BaseElement = { id: string; x: number; y: number; width: number; height: number; rotation?: number };
type TextElement = BaseElement & { kind: "text"; text: string; fontFamily: string; fontSize: number; color: string; fill: string; bold: boolean; italic: boolean; align: TextAlign };
type ImageElement = BaseElement & { kind: "image"; assetId?: string; src?: string; name: string; fit: "cover" | "contain" };
type ShapeElement = BaseElement & { kind: "shape"; shape: "rect" | "ellipse" | "arrow"; fill: string; stroke: string; strokeWidth: number; label?: string };
type TableElement = BaseElement & { kind: "table"; rows: number; columns: number; cells: string[]; fill: string; color: string; borderColor: string; fontSize: number };
type BoardElement = TextElement | ImageElement | ShapeElement | TableElement;
type BoardLink = { id: string; from: string; to: string; label: string };
type BoardFile = { id: string; name: string; summary: string; createdAt: number; updatedAt: number; viewport: Viewport; elements: BoardElement[]; links: BoardLink[] };

const BOARD_DB = "karlo-whiteboard-files";
const BOARD_STORE = "boards";
const ASSET_STORE = "assets";
const VAULT_DB = "veo-zavod-vault";
const VAULT_STORE = "files";
const BOARD_CHANNEL = "karlo-whiteboard-sync";
const WHITEBOARD_API = "/api/whiteboard";
const WHITEBOARD_ASSET_API = "/api/whiteboard/assets";

const fonts = [
  { label: "Editorial", value: "Georgia, 'Times New Roman', serif" },
  { label: "Studio Sans", value: "var(--font-geist-sans), sans-serif" },
  { label: "Mono", value: "var(--font-geist-mono), monospace" },
  { label: "Storyboard", value: "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif" },
  { label: "Notebook", value: "'Trebuchet MS', Verdana, sans-serif" },
];

const palette = ["#181b18", "#a82f2a", "#315f6f", "#5f765a", "#a57940", "#ece8dc", "#ffffff", "#000000"];
const fills = ["#fffdf3", "#f4dfc1", "#dbe8e0", "#d8e2ee", "#efd7d2", "#171a17", "transparent"];
const shapeFills = ["transparent", "#fffdf3", "#dbe8e0", "#efd7d2", "#1f2b26", "#111411"];
const resizeHandles = ["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const;
type ResizeHandle = typeof resizeHandles[number];

const textStyles = [
  { label: "Body", icon: Type, patch: { fontSize: 19, bold: false, italic: false, fill: "transparent", color: "#ece8dc" } },
  { label: "Heading", icon: Heading1, patch: { fontSize: 34, bold: true, italic: false, fill: "transparent", color: "#fff8db" } },
  { label: "Subtitle", icon: Heading2, patch: { fontSize: 23, bold: false, italic: true, fill: "transparent", color: "#d8c997" } },
  { label: "Note", icon: FileText, patch: { fontSize: 19, bold: false, italic: false, fill: "#fffdf3", color: "#20231f" } },
];

const starterBoard = (): BoardFile => ({
  id: uid(),
  name: "Worldboard 01 - modular causes",
  summary: "Characters, places, motives, cause-effect chains.",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  viewport: { x: 0, y: 0, zoom: 0.88 },
  elements: [
    makeTextElement({ x: -300, y: -90, text: "MOTEL\nkeys, room numbers, missing copies", fill: "#fff8db", color: "#24231f", width: 260, height: 160, fontSize: 24, bold: true }),
    makeTextElement({ x: 120, y: 80, text: "Branimir hears the consequence before he understands the choice.", fill: "#f0d1cc", color: "#3b1714", width: 310, height: 170, fontSize: 20 }),
    makeTextElement({ x: 560, y: -170, text: "CAUSE -> EFFECT\nWhat changes if the bus never stops?", fill: "#d9e7ed", color: "#162b34", width: 340, height: 150, fontSize: 18 }),
  ],
  links: [],
});

export function WorldWhiteboard() {
  const [boards, setBoards] = useState<BoardFile[]>([]);
  const [board, setBoard] = useState<BoardFile | null>(null);
  const [assets, setAssets] = useState<BoardAsset[]>([]);
  const [tool, setTool] = useState<Tool>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [linkStartId, setLinkStartId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Opening board files...");
  const [libraryOpen, setLibraryOpen] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [hudOpen, setHudOpen] = useState(false);
  const [hudEdge, setHudEdge] = useState<HudEdge>("left");
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [nightMode, setNightMode] = useState(true);
  const [aspectLocked, setAspectLocked] = useState(true);
  const [marquee, setMarquee] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const panRef = useRef<{ pointer: Point; viewport: Viewport } | null>(null);
  const marqueeRef = useRef<{ start: Point; current: Point } | null>(null);
  const historyRef = useRef<BoardFile[]>([]);
  const futureRef = useRef<BoardFile[]>([]);
  const clipboardRef = useRef<BoardElement[]>([]);

  const refreshBoards = useCallback(async (activeId?: string) => {
    const stored = await getAllBoards();
    setBoards(stored);
    if (activeId) {
      const active = stored.find((item) => item.id === activeId);
      if (active) setBoard(active);
    }
  }, []);
  const refreshAssets = useCallback(async () => {
    const stored = await getAllAssets();
    setAssets(stored);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1100px)");
    const syncPanels = () => {
      setLibraryOpen(!media.matches);
      setInspectorOpen(!media.matches);
    };
    syncPanels();
    media.addEventListener("change", syncPanels);
    return () => media.removeEventListener("change", syncPanels);
  }, []);

  useEffect(() => {
    let cancelled = false;
    channelRef.current = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(BOARD_CHANNEL) : null;
    channelRef.current?.addEventListener("message", (event) => {
      if (event.data?.type === "board-saved") void refreshBoards(event.data.boardId);
      if (event.data?.type === "assets-saved") void refreshAssets();
    });
    void (async () => {
      await ensureDb();
      await migrateLegacyBrowserStorage(setStatus);
      let stored = await getAllBoards();
      if (!stored.length) {
        const first = starterBoard();
        await putBoard(first);
        stored = [first];
      }
      if (cancelled) return;
      setBoards(stored);
      const requested = new URLSearchParams(window.location.search).get("board");
      setBoard(stored.find((item) => item.id === requested) ?? stored[0]);
      setStatus("Database autosave is on");
      await refreshAssets();
    })().catch((error) => setStatus(error instanceof Error ? error.message : "Whiteboard database failed to open"));
    return () => {
      cancelled = true;
      channelRef.current?.close();
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!board) return;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      const next = { ...board, updatedAt: Date.now() };
      void putBoard(next).then(() => {
        setBoards((items) => sortBoards(items.map((item) => item.id === next.id ? next : item)));
        setStatus(`Saved ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
        channelRef.current?.postMessage({ type: "board-saved", boardId: next.id });
      });
    }, 420);
  }, [board]);

  const selected = useMemo(() => board?.elements.find((item) => item.id === selectedId) ?? null, [board, selectedId]);
  const selectedElements = useMemo(() => board?.elements.filter((item) => selectedIds.includes(item.id)) ?? [], [board, selectedIds]);
  const imageAssets = useMemo(() => assets.filter((asset) => asset.type.startsWith("image/") && asset.name.toLowerCase().includes(query.toLowerCase())), [assets, query]);

  const updateBoard = useCallback((updater: (current: BoardFile) => BoardFile, recordHistory = true) => setBoard((current) => {
    if (!current) return current;
    const next = updater(current);
    if (recordHistory && next !== current) {
      historyRef.current = [...historyRef.current.slice(-79), structuredClone(current)];
      futureRef.current = [];
    }
    return next;
  }), []);
  const isCompact = () => window.matchMedia("(max-width: 1100px)").matches;
  const selectElement = (id: string, additive = false) => {
    setContextMenu(null);
    setEditingId(null);
    setSelectedId(id);
    setSelectedIds((current) => additive && !current.includes(id) ? [...current, id] : [id]);
    if (!isCompact()) setInspectorOpen(true);
  };
  const clearSelection = () => {
    setSelectedId(null);
    setSelectedIds([]);
    setEditingId(null);
    setContextMenu(null);
  };
  const undoBoard = () => {
    const previous = historyRef.current.pop();
    if (!previous || !board) return;
    futureRef.current = [...futureRef.current.slice(-79), structuredClone(board)];
    setBoard(previous);
    setSelectedId(null);
    setSelectedIds([]);
    setEditingId(null);
    setStatus("Undo");
  };
  const redoBoard = () => {
    const next = futureRef.current.pop();
    if (!next || !board) return;
    historyRef.current = [...historyRef.current.slice(-79), structuredClone(board)];
    setBoard(next);
    setSelectedId(null);
    setSelectedIds([]);
    setEditingId(null);
    setStatus("Redo");
  };
  const copySelection = () => {
    if (!board || !selectedIds.length) return;
    clipboardRef.current = board.elements.filter((element) => selectedIds.includes(element.id)).map((element) => structuredClone(element));
    setStatus(`${clipboardRef.current.length} copied`);
  };
  const pasteSelection = () => {
    if (!board || !clipboardRef.current.length) return;
    const copies = clipboardRef.current.map((element) => ({ ...structuredClone(element), id: uid(), x: element.x + 36, y: element.y + 36 } as BoardElement));
    updateBoard((current) => ({ ...current, elements: [...current.elements, ...copies] }));
    setSelectedIds(copies.map((element) => element.id));
    setSelectedId(copies[0]?.id ?? null);
    setStatus(`${copies.length} pasted`);
  };
  const createBoard = async () => {
    const next = starterBoard();
    next.name = `Untitled board ${boards.length + 1}`;
    next.elements = [];
    next.links = [];
    await putBoard(next);
    setBoards((items) => sortBoards([next, ...items]));
    openBoard(next);
  };
  const duplicateBoard = async () => {
    if (!board) return;
    const createdAt = timestamp();
    const copy: BoardFile = { ...structuredClone(board), id: uid(), name: `${board.name} copy`, createdAt, updatedAt: createdAt };
    await putBoard(copy);
    setBoards((items) => sortBoards([copy, ...items]));
    openBoard(copy);
  };
  const deleteBoard = async (id: string) => {
    if (boards.length <= 1 || !confirm("Delete this board file from local drafts?")) return;
    await removeBoard(id);
    const remaining = boards.filter((item) => item.id !== id);
    setBoards(remaining);
    if (board?.id === id) openBoard(remaining[0]);
  };
  const openBoard = (next: BoardFile) => {
    setBoard(next);
    setSelectedId(null);
    setSelectedIds([]);
    setEditingId(null);
    setLinkStartId(null);
    const url = new URL(window.location.href);
    url.searchParams.set("board", next.id);
    window.history.replaceState(null, "", url);
  };

  const screenToWorld = (point: Point) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    const local = rect ? { x: point.x - rect.left, y: point.y - rect.top } : point;
    const view = board?.viewport ?? { x: 0, y: 0, zoom: 1 };
    return { x: (local.x - view.x) / view.zoom, y: (local.y - view.y) / view.zoom };
  };
  const addText = (point?: Point) => {
    if (!board) return;
    const position = point ?? screenToWorld({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    const element = makeTextElement({ x: position.x - 120, y: position.y - 60, text: "Write the thought before it escapes.", width: 270, height: 150, fill: "transparent", color: "#ece8dc" });
    updateBoard((current) => ({ ...current, elements: [...current.elements, element] }));
    setSelectedId(element.id);
    setSelectedIds([element.id]);
    setEditingId(element.id);
    setTool("select");
    setContextMenu(null);
    setHudOpen(false);
  };
  const addNote = (point?: Point) => {
    if (!board) return;
    const position = point ?? screenToWorld({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    const element = makeTextElement({ x: position.x - 140, y: position.y - 75, text: "New note", width: 280, height: 150, fill: "#fffdf3", color: "#20231f" });
    updateBoard((current) => ({ ...current, elements: [...current.elements, element] }));
    setSelectedId(element.id);
    setSelectedIds([element.id]);
    setEditingId(element.id);
    setTool("select");
    setContextMenu(null);
    setHudOpen(false);
  };
  const addShape = (shape: ShapeElement["shape"], point?: Point) => {
    if (!board) return;
    const position = point ?? screenToWorld({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    const element = makeShapeElement({ shape, x: position.x - 90, y: position.y - 55 });
    updateBoard((current) => ({ ...current, elements: [...current.elements, element] }));
    setSelectedId(element.id);
    setSelectedIds([element.id]);
    setTool("select");
    setContextMenu(null);
  };
  const addTable = (point?: Point) => {
    if (!board) return;
    const position = point ?? screenToWorld({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    const element = makeTableElement({ x: position.x - 190, y: position.y - 110 });
    updateBoard((current) => ({ ...current, elements: [...current.elements, element] }));
    setSelectedId(element.id);
    setSelectedIds([element.id]);
    setTool("select");
    setContextMenu(null);
  };
  const addTemplate = (template: "document" | "profile" | "narrative" | "visualization" | "relationship") => {
    if (!board) return;
    const center = screenToWorld({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    const baseX = center.x - 380;
    const baseY = center.y - 250;
    const elements: BoardElement[] = template === "document" ? [
      makeTextElement({ x: baseX, y: baseY, width: 520, height: 80, text: "DOCUMENT TITLE", fontSize: 34, bold: true, fill: "transparent", color: "#fff8db" }),
      makeTextElement({ x: baseX, y: baseY + 98, width: 520, height: 280, text: "Subtitle / thesis\n\nBody text can be justified in the inspector so this reads like a real page, not a sticky note.", align: "justify", fill: "transparent", color: "#ece8dc" }),
    ] : template === "profile" ? [
      makeShapeElement({ shape: "rect", x: baseX, y: baseY, width: 260, height: 340, fill: "#101a16", stroke: "#d8c997" }),
      makeTextElement({ x: baseX + 290, y: baseY, width: 360, height: 92, text: "PROFILE / NAME", fontSize: 31, bold: true, fill: "transparent", color: "#fff8db" }),
      makeTextElement({ x: baseX + 290, y: baseY + 110, width: 360, height: 220, text: "Role\nNeed\nContradiction\nSecret", fill: "#fffdf3", color: "#20231f" }),
    ] : template === "narrative" ? [
      makeTextElement({ x: baseX, y: baseY, text: "INCITING PRESSURE", fill: "#fffdf3", color: "#20231f" }),
      makeShapeElement({ shape: "arrow", x: baseX + 330, y: baseY + 38, width: 220, height: 60 }),
      makeTextElement({ x: baseX + 590, y: baseY, text: "CHOICE / COST", fill: "#efd7d2", color: "#3b1714" }),
      makeTextElement({ x: baseX + 260, y: baseY + 210, width: 340, height: 160, text: "Consequence that changes the board.", fill: "#dbe8e0", color: "#162b34" }),
    ] : template === "visualization" ? [
      makeShapeElement({ shape: "ellipse", x: baseX + 160, y: baseY, width: 240, height: 150, fill: "#1f2b26", stroke: "#d8c997", label: "SYSTEM" }),
      makeShapeElement({ shape: "rect", x: baseX, y: baseY + 220, width: 240, height: 140, fill: "transparent", stroke: "#ece8dc", label: "INPUT" }),
      makeShapeElement({ shape: "arrow", x: baseX + 270, y: baseY + 260, width: 190, height: 60 }),
      makeShapeElement({ shape: "rect", x: baseX + 490, y: baseY + 220, width: 240, height: 140, fill: "transparent", stroke: "#ece8dc", label: "OUTPUT" }),
    ] : [
      makeTextElement({ x: baseX, y: baseY, text: "PERSON A", fill: "#fffdf3", color: "#20231f" }),
      makeTextElement({ x: baseX + 520, y: baseY, text: "PERSON B", fill: "#fffdf3", color: "#20231f" }),
      makeShapeElement({ shape: "arrow", x: baseX + 310, y: baseY + 50, width: 190, height: 60, label: "wants" }),
      makeTextElement({ x: baseX + 220, y: baseY + 190, width: 320, height: 140, text: "Dynamic: leverage, wound, dependency, false promise.", fill: "#efd7d2", color: "#3b1714" }),
    ];
    updateBoard((current) => ({ ...current, elements: [...current.elements, ...elements] }));
    setSelectedIds(elements.map((element) => element.id));
    setSelectedId(elements[0]?.id ?? null);
    setContextMenu(null);
  };
  const addImage = (asset: BoardAsset, point?: Point) => {
    if (!board) return;
    const position = point ?? screenToWorld({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    const element: ImageElement = { id: uid(), kind: "image", assetId: asset.id, name: asset.name, x: position.x - 180, y: position.y - 120, width: 360, height: 240, fit: "cover" };
    updateBoard((current) => ({ ...current, elements: [...current.elements, element] }));
    setSelectedId(element.id);
    setSelectedIds([element.id]);
    setTool("select");
    setContextMenu(null);
    setHudOpen(false);
  };
  const importFiles = async (files: FileList | File[] | null) => {
    if (!files) return;
    const incoming = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (!incoming.length) {
      setStatus("No image files were found in that selection");
      return;
    }
    const uploaded: BoardAsset[] = [];
    for (const file of incoming) uploaded.push(await uploadAsset(file));
    await refreshAssets();
    setHudOpen(true);
    setStatus(`${uploaded.length} photo${uploaded.length === 1 ? "" : "s"} stored in the database library`);
    channelRef.current?.postMessage({ type: "assets-saved" });
  };
  const applyElementPatch = (id: string, patch: Partial<BoardElement>, intent: PatchIntent = "edit") => {
    const source = board?.elements.find((element) => element.id === id);
    if (intent === "move" && source && selectedIds.includes(id) && selectedIds.length > 1) {
      const deltaX = (patch.x ?? source.x) - source.x;
      const deltaY = (patch.y ?? source.y) - source.y;
      updateBoard((current) => ({
        ...current,
        elements: current.elements.map((element) => selectedIds.includes(element.id) ? { ...element, x: element.x + deltaX, y: element.y + deltaY } : element),
      }));
      return;
    }
    updateBoard((current) => ({ ...current, elements: current.elements.map((element) => element.id === id ? ({ ...element, ...patch } as BoardElement) : element) }));
  };
  const deleteElements = (ids: string[]) => {
    if (!ids.length) return;
    updateBoard((current) => ({
      ...current,
      elements: current.elements.filter((element) => !ids.includes(element.id)),
      links: current.links.filter((link) => !ids.includes(link.from) && !ids.includes(link.to)),
    }));
    setSelectedId(null);
    setSelectedIds([]);
    setEditingId(null);
    setContextMenu(null);
  };
  const duplicateSelection = () => {
    if (!board || !selectedIds.length) return;
    const idMap = new Map<string, string>();
    const copies = board.elements.filter((element) => selectedIds.includes(element.id)).map((element) => {
      const nextId = uid();
      idMap.set(element.id, nextId);
      return { ...structuredClone(element), id: nextId, x: element.x + 34, y: element.y + 34 } as BoardElement;
    });
    const copiedLinks = board.links
      .filter((link) => idMap.has(link.from) && idMap.has(link.to))
      .map((link) => ({ ...link, id: uid(), from: idMap.get(link.from)!, to: idMap.get(link.to)! }));
    updateBoard((current) => ({ ...current, elements: [...current.elements, ...copies], links: [...current.links, ...copiedLinks] }));
    setSelectedIds(copies.map((element) => element.id));
    setSelectedId(copies[0]?.id ?? null);
    setContextMenu(null);
  };
  const scaleSelection = (scale: number) => {
    if (!selectedIds.length) return;
    updateBoard((current) => ({
      ...current,
      elements: current.elements.map((element) => selectedIds.includes(element.id) ? { ...element, width: Math.max(80, element.width * scale), height: Math.max(56, element.height * scale) } : element),
    }));
    setContextMenu(null);
  };
  const rotateSelection = (delta: number) => {
    if (!selectedIds.length) return;
    updateBoard((current) => ({
      ...current,
      elements: current.elements.map((element) => selectedIds.includes(element.id) ? { ...element, rotation: Math.round((element.rotation ?? 0) + delta) } : element),
    }));
    setContextMenu(null);
  };
  const connectElement = (targetId: string) => {
    if (!board || !linkStartId || linkStartId === targetId) return;
    const exists = board.links.some((link) => link.from === linkStartId && link.to === targetId);
    if (!exists) updateBoard((current) => ({ ...current, links: [...current.links, { id: uid(), from: linkStartId, to: targetId, label: "causes" }] }));
    setLinkStartId(null);
    setTool("select");
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = Boolean(target?.closest("textarea, input, select, [contenteditable='true']"));
      if (typing) return;
      const command = event.ctrlKey || event.metaKey;
      if (command && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redoBoard();
        else undoBoard();
      } else if (command && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redoBoard();
      } else if (command && event.key.toLowerCase() === "c") {
        event.preventDefault();
        copySelection();
      } else if (command && event.key.toLowerCase() === "v") {
        event.preventDefault();
        pasteSelection();
      } else if (command && event.key.toLowerCase() === "d") {
        event.preventDefault();
        duplicateSelection();
      } else if (command && event.key.toLowerCase() === "a" && board) {
        event.preventDefault();
        const ids = board.elements.map((element) => element.id);
        setSelectedIds(ids);
        setSelectedId(ids[0] ?? null);
      } else if ((event.key === "Delete" || event.key === "Backspace") && selectedIds.length) {
        event.preventDefault();
        deleteElements(selectedIds);
      } else if (event.key === "Escape") {
        clearSelection();
        setTool("select");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const startPan = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!board) return;
    const target = event.target as HTMLElement;
    const isBoardSurface = target.classList.contains("wb-viewport") || target.classList.contains("wb-infinite-grid");
    if (isBoardSurface && tool === "select" && event.button === 0) {
      const world = screenToWorld({ x: event.clientX, y: event.clientY });
      clearSelection();
      try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Pointer capture is best effort during rapid touch cancellation. */ }
      marqueeRef.current = { start: world, current: world };
      setMarquee({ x: world.x, y: world.y, width: 0, height: 0 });
      return;
    }
    if (tool !== "pan" && event.button !== 1) return;
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Pointer capture is best effort during rapid touch cancellation. */ }
    panRef.current = { pointer: { x: event.clientX, y: event.clientY }, viewport: board.viewport };
  };
  const movePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    revealHud(event.clientX, event.clientY);
    const selectionBox = marqueeRef.current;
    if (board && selectionBox) {
      selectionBox.current = screenToWorld({ x: event.clientX, y: event.clientY });
      setMarquee(normalizeRect(selectionBox.start, selectionBox.current));
      return;
    }
    const pan = panRef.current;
    if (!board || !pan) return;
    const deltaX = event.clientX - pan.pointer.x;
    const deltaY = event.clientY - pan.pointer.y;
    updateBoard((current) => ({ ...current, viewport: { ...current.viewport, x: pan.viewport.x + deltaX, y: pan.viewport.y + deltaY } }));
  };
  const finishSurfacePointer = () => {
    if (board && marqueeRef.current) {
      const box = normalizeRect(marqueeRef.current.start, marqueeRef.current.current);
      const ids = board.elements.filter((element) => rectsIntersect(box, element)).map((element) => element.id);
      setSelectedIds(ids);
      setSelectedId(ids[0] ?? null);
      marqueeRef.current = null;
      setMarquee(null);
    }
    panRef.current = null;
  };
  const zoomAt = (delta: number) => board && updateBoard((current) => ({ ...current, viewport: { ...current.viewport, zoom: clamp(current.viewport.zoom + delta, 0.22, 2.2) } }));
  const revealHud = (clientX: number, clientY: number) => {
    if (!focusMode) return;
    const edgeSize = 18;
    const open = (hudEdge === "left" && clientX <= edgeSize) ||
      (hudEdge === "right" && clientX >= window.innerWidth - edgeSize) ||
      (hudEdge === "top" && clientY <= edgeSize) ||
      (hudEdge === "bottom" && clientY >= window.innerHeight - edgeSize);
    if (open) setHudOpen(true);
  };
  const openContextMenu = (event: React.MouseEvent, targetId?: string) => {
    event.preventDefault();
    const additive = event.shiftKey || event.ctrlKey || event.metaKey;
    if (targetId) selectElement(targetId, additive);
    else clearSelection();
    setContextMenu({ x: event.clientX, y: event.clientY, world: screenToWorld({ x: event.clientX, y: event.clientY }), targetId });
  };
  const toggleFocusMode = () => {
    setFocusMode((value) => {
      const next = !value;
      if (next) {
        setLibraryOpen(false);
        setInspectorOpen(false);
        setHudOpen(false);
      }
      return next;
    });
  };
  const exportJson = () => board && downloadText(`${slugify(board.name)}.board.json`, JSON.stringify(board, null, 2), "application/json");
  const exportPdf = () => {
    if (!board) return;
    const printWindow = window.open("", "_blank", "width=1280,height=900");
    if (!printWindow) return;
    printWindow.document.write(exportHtml(board, assets, "pdf"));
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => printWindow.print(), 350);
  };
  const exportPpt = () => board && downloadText(`${slugify(board.name)}.ppt`, exportHtml(board, assets, "ppt"), "application/vnd.ms-powerpoint");

  if (!board) return <main className="wb-app"><div className="wb-loading"><Sparkles size={18} /> Opening local board files...</div></main>;

  return (
    <main className={`${focusMode ? "wb-app focus" : "wb-app"} ${nightMode ? "night" : ""}`} onPointerMove={(event) => revealHud(event.clientX, event.clientY)}>
      <aside className={libraryOpen ? "wb-left open" : "wb-left"}>
        <div className="wb-panel-head"><div><span>BOARD FILES</span><strong>{boards.length} drafts</strong></div><button onClick={() => setLibraryOpen(false)} aria-label="Hide library"><X size={14} /></button></div>
        <div className="wb-board-actions"><button onClick={createBoard}><Plus size={13} /> New board</button><button onClick={duplicateBoard}><Copy size={13} /> Duplicate</button></div>
        <div className="wb-template-strip"><button onClick={() => addTemplate("document")}>Document</button><button onClick={() => addTemplate("profile")}>Profile</button><button onClick={() => addTemplate("narrative")}>Narrative</button><button onClick={() => addTemplate("visualization")}>Visual map</button><button onClick={() => addTemplate("relationship")}>Relationship</button></div>
        <div className="wb-board-list">{boards.map((item) => <article key={item.id} className={item.id === board.id ? "active" : ""}><button onClick={() => openBoard(item)}><strong>{item.name}</strong><span>{item.elements.length} objects / {new Date(item.updatedAt).toLocaleDateString()}</span></button><a href={`/studio/whiteboard?board=${item.id}`} target="_blank" title="Open this board in a separate tab"><PanelRightOpen size={12} /></a><button onClick={() => deleteBoard(item.id)} aria-label="Delete board"><Trash2 size={12} /></button></article>)}</div>
        <div className="wb-library-head"><div><span>PHOTO LIBRARY</span><strong>drag or click to place</strong></div><button onClick={() => fileInputRef.current?.click()}><UploadCloud size={13} /></button></div>
        <label className="wb-search"><Search size={13} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find photo..." /></label>
        <div className="wb-asset-list">{imageAssets.length === 0 ? <div className="wb-empty"><ImagePlus size={20} /><span>No images yet. Import local photos.</span></div> : imageAssets.map((asset) => <button key={asset.id} draggable onDragStart={(event) => event.dataTransfer.setData("application/x-board-asset", asset.id)} onClick={() => addImage(asset)}>{asset.url && <img src={asset.url} alt="" />}<span>{asset.name}</span></button>)}</div>
      </aside>

      <section className="wb-workspace">
        <header className="wb-topbar">
          {!libraryOpen && <button onClick={() => setLibraryOpen(true)}><FolderOpen size={15} /> Library</button>}
          <input value={board.name} onChange={(event) => updateBoard((current) => ({ ...current, name: event.target.value }))} aria-label="Board file name" />
          <div className="wb-save"><Save size={13} /><span>{status}</span></div>
          <div className="wb-top-actions"><button onClick={toggleFocusMode}>{focusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />} {focusMode ? "Exit" : "Focus"}</button><button onClick={exportPdf}><FileText size={14} /> PDF</button><button onClick={exportPpt}><Presentation size={14} /> PPT</button><button onClick={exportJson}><FileJson size={14} /> JSON</button></div>
        </header>

        <div className="wb-toolbar" role="toolbar" aria-label="Whiteboard tools"><button onClick={undoBoard} title="Undo Ctrl+Z"><Undo2 size={16} /></button><button onClick={redoBoard} title="Redo Ctrl+Y"><Redo2 size={16} /></button><i /><button className={tool === "select" ? "active" : ""} onClick={() => setTool("select")} title="Select and drag-select"><MousePointer2 size={16} /></button><button className={tool === "pan" ? "active" : ""} onClick={() => setTool("pan")} title="Pan"><Hand size={16} /></button><button onClick={() => addText()} title="Plain text"><Type size={16} /></button><button onClick={() => addNote()} title="Note card"><FileText size={16} /></button><button onClick={() => fileInputRef.current?.click()} title="Import photo"><ImagePlus size={16} /></button><button onClick={() => addTable()} title="Table"><Table2 size={16} /></button><button onClick={() => addShape("rect")} title="Rectangle"><Square size={16} /></button><button onClick={() => addShape("ellipse")} title="Circle"><Circle size={16} /></button><button onClick={() => addShape("arrow")} title="Arrow"><ArrowRight size={16} /></button><button className={tool === "link" ? "active" : ""} onClick={() => setTool("link")} title="Dynamic relationship connector"><Link2 size={16} /></button><i /><button className={aspectLocked ? "active" : ""} onClick={() => setAspectLocked((value) => !value)} title={aspectLocked ? "Proportional resize on" : "Free resize/crop on"}>{aspectLocked ? <Lock size={16} /> : <Unlock size={16} />}</button><button className={nightMode ? "active" : ""} onClick={() => setNightMode((value) => !value)} title="Blackboard night mode"><Moon size={16} /></button>{selectedIds.length > 1 && <b>{selectedIds.length} selected</b>}</div>

        <div
          ref={viewportRef}
          className={`wb-viewport tool-${tool}`}
          onContextMenu={(event) => openContextMenu(event)}
          onPointerDown={startPan}
          onPointerMove={movePointer}
          onPointerUp={finishSurfacePointer}
          onPointerCancel={finishSurfacePointer}
          onLostPointerCapture={finishSurfacePointer}
          onWheel={(event) => { if (event.ctrlKey || event.metaKey) { event.preventDefault(); zoomAt(event.deltaY > 0 ? -0.08 : 0.08); } }}
          onDoubleClick={(event) => { if ((event.target as HTMLElement).classList.contains("wb-viewport")) addText(screenToWorld({ x: event.clientX, y: event.clientY })); }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const asset = assets.find((item) => item.id === event.dataTransfer.getData("application/x-board-asset"));
            if (asset) addImage(asset, screenToWorld({ x: event.clientX, y: event.clientY }));
            else if (event.dataTransfer.files?.length) void importFiles(event.dataTransfer.files);
          }}
        >
          <div className="wb-infinite-grid" style={{ backgroundPosition: `${board.viewport.x}px ${board.viewport.y}px` }} />
          <div className="wb-world" style={{ transform: `translate(${board.viewport.x}px, ${board.viewport.y}px) scale(${board.viewport.zoom})` }}>
            <svg className="wb-links" width="1" height="1">{board.links.map((link) => <BoardLinkPath key={link.id} link={link} elements={board.elements} onDelete={() => updateBoard((current) => ({ ...current, links: current.links.filter((item) => item.id !== link.id) }))} />)}</svg>
            {marquee && <div className="wb-marquee" style={{ left: marquee.x, top: marquee.y, width: marquee.width, height: marquee.height }} />}
            {board.elements.map((element) => (
              <BoardElementView
                key={element.id}
                element={element}
                asset={element.kind === "image" ? assets.find((asset) => asset.id === element.assetId) : undefined}
                selected={selectedIds.includes(element.id)}
                primarySelected={selectedId === element.id}
                editing={editingId === element.id}
                tool={tool}
                zoom={board.viewport.zoom}
                aspectLocked={aspectLocked}
                onSelect={(additive) => { if (tool === "link" && linkStartId) connectElement(element.id); else { selectElement(element.id, additive); if (tool === "link") setLinkStartId(element.id); } }}
                onBeginEdit={() => { selectElement(element.id); setEditingId(element.id); }}
                onEndEdit={() => setEditingId(null)}
                onOpenMenu={(event) => openContextMenu(event, element.id)}
                onChange={(patch, intent) => applyElementPatch(element.id, patch, intent)}
                onDelete={() => deleteElements([element.id])}
              />
            ))}
          </div>
          <ViewHud board={board} onZoom={zoomAt} onReset={() => updateBoard((current) => ({ ...current, viewport: { x: 0, y: 0, zoom: 0.88 } }))} />
        </div>

        <EdgeHud
          open={hudOpen}
          edge={hudEdge}
          assets={imageAssets}
          onClose={() => setHudOpen(false)}
          onEdgeChange={setHudEdge}
          onText={() => addText()}
          onImport={() => fileInputRef.current?.click()}
          onLibrary={() => setLibraryOpen(true)}
          onInspector={() => setInspectorOpen(true)}
          onAddImage={addImage}
        />
      </section>

      <aside className={inspectorOpen ? "wb-inspector open" : "wb-inspector"}><button className="wb-inspector-toggle" onClick={() => setInspectorOpen((value) => !value)}><PanelRightOpen size={14} /></button><Inspector selected={selected} board={board} selectedCount={selectedElements.length} updateBoard={updateBoard} updateElement={(id, patch) => applyElementPatch(id, patch, "edit")} deleteElement={(id) => deleteElements([id])} /></aside>
      <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={(event) => { void importFiles(event.target.files); event.currentTarget.value = ""; }} />

      {contextMenu && <ContextMenu menu={contextMenu} hasSelection={selectedIds.length > 0} edge={hudEdge} onEdgeChange={setHudEdge} onTextHere={() => addText(contextMenu.world)} onImport={() => fileInputRef.current?.click()} onDuplicate={duplicateSelection} onBigger={() => scaleSelection(1.16)} onSmaller={() => scaleSelection(0.86)} onRotateLeft={() => rotateSelection(-15)} onRotateRight={() => rotateSelection(15)} onInspect={() => setInspectorOpen(true)} onDelete={() => deleteElements(selectedIds)} />}
    </main>
  );
}

function BoardElementView({ element, asset, selected, primarySelected, editing, tool, zoom, aspectLocked, onSelect, onBeginEdit, onEndEdit, onOpenMenu, onChange, onDelete }: { element: BoardElement; asset?: BoardAsset; selected: boolean; primarySelected: boolean; editing: boolean; tool: Tool; zoom: number; aspectLocked: boolean; onSelect: (additive: boolean) => void; onBeginEdit: () => void; onEndEdit: () => void; onOpenMenu: (event: React.MouseEvent) => void; onChange: (patch: Partial<BoardElement>, intent: PatchIntent) => void; onDelete: () => void }) {
  type DragState = { mode: "move" | "resize" | "rotate"; pointer: Point; origin: Point; size: Point; rotation: number; handle?: ResizeHandle; center?: Point; startAngle?: number };
  const articleRef = useRef<HTMLElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const src = element.kind === "image" ? asset?.url ?? element.src : undefined;
  const applyDrag = (clientX: number, clientY: number) => {
    const drag = dragRef.current;
    if (!drag) return;
    if (drag.mode === "move") {
      const deltaX = (clientX - drag.pointer.x) / zoom;
      const deltaY = (clientY - drag.pointer.y) / zoom;
      onChange({ x: drag.origin.x + deltaX, y: drag.origin.y + deltaY }, "move");
      return;
    }
    if (drag.mode === "resize") {
      const deltaX = (clientX - drag.pointer.x) / zoom;
      const deltaY = (clientY - drag.pointer.y) / zoom;
      onChange(resizePatch(drag, deltaX, deltaY, aspectLocked), "resize");
      return;
    }
    if (drag.center && typeof drag.startAngle === "number") {
      const angle = radiansToDegrees(Math.atan2(clientY - drag.center.y, clientX - drag.center.x));
      onChange({ rotation: Math.round(drag.rotation + angle - drag.startAngle) }, "rotate");
      return;
    }
    const deltaX = clientX - drag.pointer.x;
    onChange({ rotation: Math.round(drag.rotation + deltaX * 0.75) }, "rotate");
  };
  const attachWindowDrag = () => {
    const handlePointerMove = (event: PointerEvent) => applyDrag(event.clientX, event.clientY);
    const handleMouseMove = (event: MouseEvent) => applyDrag(event.clientX, event.clientY);
    const cleanup = () => {
      dragRef.current = null;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("pointerup", cleanup);
      window.removeEventListener("pointercancel", cleanup);
      window.removeEventListener("mouseup", cleanup);
      window.removeEventListener("blur", cleanup);
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("pointerup", cleanup);
    window.addEventListener("pointercancel", cleanup);
    window.addEventListener("mouseup", cleanup);
    window.addEventListener("blur", cleanup);
  };
  const beginMove = (event: React.PointerEvent<HTMLElement>) => {
    if (tool !== "select" && tool !== "link") return;
    if ((event.target as HTMLElement).closest("textarea, input, select, button, .wb-resize, .wb-rotate-handle")) return;
    event.preventDefault();
    onSelect(event.shiftKey || event.ctrlKey || event.metaKey);
    if (tool === "link") return;
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Pointer capture can fail after a cancelled touch. */ }
    dragRef.current = { mode: "move", pointer: { x: event.clientX, y: event.clientY }, origin: { x: element.x, y: element.y }, size: { x: element.width, y: element.height }, rotation: element.rotation ?? 0 };
  };
  const beginResize = (event: React.PointerEvent<HTMLButtonElement>, handle: ResizeHandle) => {
    event.preventDefault();
    event.stopPropagation();
    onSelect(false);
    dragRef.current = { mode: "resize", pointer: { x: event.clientX, y: event.clientY }, origin: { x: element.x, y: element.y }, size: { x: element.width, y: element.height }, rotation: element.rotation ?? 0, handle };
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Pointer capture can fail after a cancelled touch. */ }
    attachWindowDrag();
  };
  const beginResizeMouse = (event: React.MouseEvent<HTMLButtonElement>, handle: ResizeHandle) => {
    if (dragRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    onSelect(false);
    dragRef.current = { mode: "resize", pointer: { x: event.clientX, y: event.clientY }, origin: { x: element.x, y: element.y }, size: { x: element.width, y: element.height }, rotation: element.rotation ?? 0, handle };
    attachWindowDrag();
  };
  const beginRotate = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onSelect(false);
    const rect = articleRef.current?.getBoundingClientRect();
    const center = rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : { x: event.clientX, y: event.clientY };
    dragRef.current = { mode: "rotate", pointer: { x: event.clientX, y: event.clientY }, origin: { x: element.x, y: element.y }, size: { x: element.width, y: element.height }, rotation: element.rotation ?? 0, center, startAngle: radiansToDegrees(Math.atan2(event.clientY - center.y, event.clientX - center.x)) };
    attachWindowDrag();
  };
  const move = (event: React.PointerEvent<HTMLElement>) => {
    applyDrag(event.clientX, event.clientY);
  };
  const style = element.kind === "text" ? { fontFamily: element.fontFamily, fontSize: element.fontSize, color: element.color, background: element.fill, fontWeight: element.bold ? 800 : 450, fontStyle: element.italic ? "italic" : "normal", textAlign: element.align } : undefined;
  return (
    <article ref={articleRef} className={`wb-element ${element.kind} ${selected ? "selected" : ""} ${primarySelected ? "primary" : ""} ${editing ? "editing" : ""}`} style={{ left: element.x, top: element.y, width: element.width, height: element.height, transform: `rotate(${element.rotation ?? 0}deg)` }} onPointerDown={beginMove} onPointerMove={move} onPointerUp={() => { dragRef.current = null; }} onPointerCancel={() => { dragRef.current = null; }} onLostPointerCapture={() => { dragRef.current = null; }} onContextMenu={(event) => { event.stopPropagation(); onOpenMenu(event); }} onDoubleClick={() => element.kind === "text" && onBeginEdit()}>
      <div className="wb-element-grip"><Move size={12} /><span>{element.kind === "image" ? element.name : selected ? "double click to edit text" : "text"}</span><button onClick={onDelete}><X size={12} /></button></div>
      {element.kind === "text" ? editing ? <textarea autoFocus className="wb-text-editor" value={element.text} onBlur={onEndEdit} onChange={(event) => onChange({ text: event.target.value }, "edit")} style={style} /> : <div className="wb-text-content" style={style}>{element.text}</div> : element.kind === "image" ? src ? <img src={src} alt={element.name} style={{ objectFit: element.fit }} /> : <div className="wb-missing-image">Missing image</div> : element.kind === "shape" ? <ShapeContent element={element} /> : <TableContent element={element} />}
      {selected && <><button className="wb-rotate-grab" aria-label="Rotate object" onPointerDown={beginRotate}><RotateCw size={13} /></button>{resizeHandles.map((handle) => <button key={handle} className={`wb-resize ${handle}`} aria-label={`Resize ${handle}`} onPointerDown={(event) => beginResize(event, handle)} onMouseDown={(event) => beginResizeMouse(event, handle)} onPointerMove={move} onPointerUp={() => { dragRef.current = null; }} />)}</>}
    </article>
  );
}

function ContextMenu({ menu, hasSelection, edge, onEdgeChange, onTextHere, onImport, onDuplicate, onBigger, onSmaller, onRotateLeft, onRotateRight, onInspect, onDelete }: { menu: NonNullable<ContextMenuState>; hasSelection: boolean; edge: HudEdge; onEdgeChange: (edge: HudEdge) => void; onTextHere: () => void; onImport: () => void; onDuplicate: () => void; onBigger: () => void; onSmaller: () => void; onRotateLeft: () => void; onRotateRight: () => void; onInspect: () => void; onDelete: () => void }) {
  return <div className="wb-context-menu" style={{ left: menu.x, top: menu.y }} onPointerDown={(event) => event.stopPropagation()}><button onClick={onTextHere}><Type size={14} /> Text here</button><button onClick={onImport}><ImagePlus size={14} /> Import image</button>{hasSelection && <><i /><button onClick={onDuplicate}><Copy size={14} /> Duplicate</button><button onClick={onBigger}><Maximize2 size={14} /> Bigger</button><button onClick={onSmaller}><Minimize2 size={14} /> Smaller</button><button onClick={onRotateLeft}><RotateCw size={14} /> Rotate -15</button><button onClick={onRotateRight}><RotateCw size={14} /> Rotate +15</button><button onClick={onInspect}><PanelRightOpen size={14} /> Inspector</button><button className="danger" onClick={onDelete}><Trash2 size={14} /> Delete</button></>}<i /><label><span>Edge HUD</span><select value={edge} onChange={(event) => onEdgeChange(event.target.value as HudEdge)}><option value="left">Left edge</option><option value="right">Right edge</option><option value="top">Top edge</option><option value="bottom">Bottom edge</option></select></label></div>;
}

function EdgeHud({ open, edge, assets, onClose, onEdgeChange, onText, onImport, onLibrary, onInspector, onAddImage }: { open: boolean; edge: HudEdge; assets: BoardAsset[]; onClose: () => void; onEdgeChange: (edge: HudEdge) => void; onText: () => void; onImport: () => void; onLibrary: () => void; onInspector: () => void; onAddImage: (asset: BoardAsset) => void }) {
  return <div className={`wb-edge-hud ${open ? "open" : ""} ${edge}`} onPointerEnter={() => undefined}><div className="wb-edge-hud-head"><strong>Drop HUD</strong><button onClick={onClose}><X size={13} /></button></div><div className="wb-edge-actions"><button onClick={onText}><Type size={14} /> Text</button><button onClick={onImport}><ImagePlus size={14} /> Image</button><button onClick={onLibrary}><FolderOpen size={14} /> Files</button><button onClick={onInspector}><PanelRightOpen size={14} /> Edit</button></div><label><span>Appears from</span><select value={edge} onChange={(event) => onEdgeChange(event.target.value as HudEdge)}><option value="left">Left edge</option><option value="right">Right edge</option><option value="top">Top edge</option><option value="bottom">Bottom edge</option></select></label>{assets.length > 0 && <div className="wb-edge-assets">{assets.slice(0, 8).map((asset) => <button key={asset.id} onClick={() => onAddImage(asset)}>{asset.url && <img src={asset.url} alt="" />}<span>{asset.name}</span></button>)}</div>}</div>;
}

function Inspector({ selected, board, selectedCount, updateBoard, updateElement, deleteElement }: { selected: BoardElement | null; board: BoardFile; selectedCount: number; updateBoard: (updater: (current: BoardFile) => BoardFile) => void; updateElement: (id: string, patch: Partial<BoardElement>) => void; deleteElement: (id: string) => void }) {
  const resizeTable = (rows: number, columns: number) => {
    if (!selected || selected.kind !== "table") return;
    const safeRows = clamp(Math.round(rows), 1, 12);
    const safeColumns = clamp(Math.round(columns), 1, 8);
    const cells = Array.from({ length: safeRows * safeColumns }, (_, index) => selected.cells[index] ?? "");
    updateElement(selected.id, { rows: safeRows, columns: safeColumns, cells } as Partial<BoardElement>);
  };
  const commonControls = selected && <div className="wb-two"><label><span>Width</span><input type="number" value={Math.round(selected.width)} onChange={(event) => updateElement(selected.id, { width: Number(event.target.value) })} /></label><label><span>Height</span><input type="number" value={Math.round(selected.height)} onChange={(event) => updateElement(selected.id, { height: Number(event.target.value) })} /></label><label><span>X</span><input type="number" value={Math.round(selected.x)} onChange={(event) => updateElement(selected.id, { x: Number(event.target.value) })} /></label><label><span>Y</span><input type="number" value={Math.round(selected.y)} onChange={(event) => updateElement(selected.id, { y: Number(event.target.value) })} /></label></div>;

  return <div className="wb-inspector-inner"><div className="wb-panel-head"><div><span>INSPECTOR</span><strong>{selectedCount > 1 ? `${selectedCount} objects` : selected ? selected.kind : "board"}</strong></div></div>{!selected ? <div className="wb-field-stack"><label><span>Board summary</span><textarea value={board.summary} onChange={(event) => updateBoard((current) => ({ ...current, summary: event.target.value }))} /></label><div className="wb-hint"><Sparkles size={16} /><p>Database autosave is active. Shortcuts: Ctrl+Z undo, Ctrl+Y redo, Ctrl+C/V copy/paste, Ctrl+A select all, Delete remove.</p></div></div> : selected.kind === "text" ? <div className="wb-field-stack"><div className="wb-text-style-grid">{textStyles.map((style) => { const Icon = style.icon; return <button key={style.label} onClick={() => updateElement(selected.id, style.patch as Partial<BoardElement>)}><Icon size={13} />{style.label}</button>; })}</div><label><span>Font</span><select value={selected.fontFamily} onChange={(event) => updateElement(selected.id, { fontFamily: event.target.value })}>{fonts.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}</select></label><div className="wb-two"><label><span>Size</span><input type="number" min="8" max="180" value={selected.fontSize} onChange={(event) => updateElement(selected.id, { fontSize: Number(event.target.value) })} /></label><label><span>Rotate</span><input type="number" value={selected.rotation ?? 0} onChange={(event) => updateElement(selected.id, { rotation: Number(event.target.value) })} /></label></div>{commonControls}<label><span>Text color</span><ColorRow value={selected.color} onChange={(color) => updateElement(selected.id, { color })} colors={palette} /></label><label><span>Fill / none for plain text</span><ColorRow value={selected.fill} onChange={(fill) => updateElement(selected.id, { fill })} colors={fills} /></label><div className="wb-style-row"><button className={selected.bold ? "active" : ""} onClick={() => updateElement(selected.id, { bold: !selected.bold })}><Bold size={13} /> Bold</button><button className={selected.italic ? "active" : ""} onClick={() => updateElement(selected.id, { italic: !selected.italic })}><Italic size={13} /> Italic</button></div><div className="wb-style-row align"><button className={selected.align === "left" ? "active" : ""} onClick={() => updateElement(selected.id, { align: "left" })}><AlignLeft size={13} /></button><button className={selected.align === "center" ? "active" : ""} onClick={() => updateElement(selected.id, { align: "center" })}><AlignCenter size={13} /></button><button className={selected.align === "right" ? "active" : ""} onClick={() => updateElement(selected.id, { align: "right" })}><AlignRight size={13} /></button><button className={selected.align === "justify" ? "active" : ""} onClick={() => updateElement(selected.id, { align: "justify" })}><AlignJustify size={13} /></button></div><button className="wb-danger" onClick={() => deleteElement(selected.id)}><Trash2 size={13} /> Delete text</button></div> : selected.kind === "image" ? <div className="wb-field-stack">{commonControls}<label><span>Crop / zoom mode</span><select value={selected.fit} onChange={(event) => updateElement(selected.id, { fit: event.target.value as ImageElement["fit"] })}><option value="cover">Cover frame / crop sides</option><option value="contain">Contain whole image</option></select></label><label><span>Rotate</span><input type="number" value={selected.rotation ?? 0} onChange={(event) => updateElement(selected.id, { rotation: Number(event.target.value) })} /></label><button className="wb-danger" onClick={() => deleteElement(selected.id)}><Trash2 size={13} /> Delete image</button></div> : selected.kind === "shape" ? <div className="wb-field-stack">{commonControls}<label><span>Label</span><input value={selected.label ?? ""} onChange={(event) => updateElement(selected.id, { label: event.target.value })} /></label><label><span>Fill</span><ColorRow value={selected.fill} onChange={(fill) => updateElement(selected.id, { fill })} colors={shapeFills} /></label><label><span>Stroke</span><ColorRow value={selected.stroke} onChange={(stroke) => updateElement(selected.id, { stroke })} colors={palette} /></label><label><span>Stroke width</span><input type="number" min="1" max="18" value={selected.strokeWidth} onChange={(event) => updateElement(selected.id, { strokeWidth: Number(event.target.value) })} /></label><button className="wb-danger" onClick={() => deleteElement(selected.id)}><Trash2 size={13} /> Delete shape</button></div> : <div className="wb-field-stack">{commonControls}<div className="wb-two"><label><span>Rows</span><input type="number" min="1" max="12" value={selected.rows} onChange={(event) => resizeTable(Number(event.target.value), selected.columns)} /></label><label><span>Columns</span><input type="number" min="1" max="8" value={selected.columns} onChange={(event) => resizeTable(selected.rows, Number(event.target.value))} /></label></div><label><span>Table fill</span><ColorRow value={selected.fill} onChange={(fill) => updateElement(selected.id, { fill })} colors={shapeFills} /></label><label><span>Text color</span><ColorRow value={selected.color} onChange={(color) => updateElement(selected.id, { color })} colors={palette} /></label><div className="wb-table-editor" style={{ gridTemplateColumns: `repeat(${selected.columns}, minmax(0, 1fr))` }}>{selected.cells.map((cell, index) => <input key={index} value={cell} onChange={(event) => { const cells = [...selected.cells]; cells[index] = event.target.value; updateElement(selected.id, { cells } as Partial<BoardElement>); }} />)}</div><button className="wb-danger" onClick={() => deleteElement(selected.id)}><Trash2 size={13} /> Delete table</button></div>}</div>;
}

function ViewHud({ board, onZoom, onReset }: { board: BoardFile; onZoom: (delta: number) => void; onReset: () => void }) {
  return <div className="wb-view-hud"><button onClick={() => onZoom(-0.08)} title="Zoom out"><ZoomOut size={14} /></button><strong>{Math.round(board.viewport.zoom * 100)}%</strong><button onClick={() => onZoom(0.08)} title="Zoom in"><ZoomIn size={14} /></button><button onClick={onReset}>Reset</button><span>Viewing {Math.round(-board.viewport.x / board.viewport.zoom)}, {Math.round(-board.viewport.y / board.viewport.zoom)}</span></div>;
}

function ShapeContent({ element }: { element: ShapeElement }) {
  const label = element.label?.trim();
  return <svg className="wb-shape-content" viewBox={`0 0 ${Math.max(1, element.width)} ${Math.max(1, element.height)}`} preserveAspectRatio="none">{element.shape === "ellipse" ? <ellipse cx={element.width / 2} cy={element.height / 2} rx={Math.max(1, element.width / 2 - element.strokeWidth)} ry={Math.max(1, element.height / 2 - element.strokeWidth)} fill={element.fill} stroke={element.stroke} strokeWidth={element.strokeWidth} /> : element.shape === "arrow" ? <g><line x1={8} y1={element.height / 2} x2={element.width - 28} y2={element.height / 2} stroke={element.stroke} strokeWidth={element.strokeWidth} strokeLinecap="round" /><path d={`M ${element.width - 30} ${element.height / 2 - 18} L ${element.width - 6} ${element.height / 2} L ${element.width - 30} ${element.height / 2 + 18} Z`} fill={element.stroke} /></g> : <rect x={element.strokeWidth / 2} y={element.strokeWidth / 2} width={Math.max(1, element.width - element.strokeWidth)} height={Math.max(1, element.height - element.strokeWidth)} fill={element.fill} stroke={element.stroke} strokeWidth={element.strokeWidth} />}{label && <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill={element.stroke} fontSize="18" fontWeight="700">{label}</text>}</svg>;
}

function TableContent({ element }: { element: TableElement }) {
  return <div className="wb-table-content" style={{ gridTemplateColumns: `repeat(${element.columns}, minmax(0, 1fr))`, background: element.fill, color: element.color, borderColor: element.borderColor, fontSize: element.fontSize }}>{element.cells.map((cell, index) => <div key={index} style={{ borderColor: element.borderColor }}>{cell}</div>)}</div>;
}

function resizePatch(drag: { origin: Point; size: Point; handle?: ResizeHandle }, deltaX: number, deltaY: number, locked: boolean): Partial<BoardElement> {
  const handle = drag.handle ?? "se";
  const minimum = { width: 56, height: 42 };
  let x = drag.origin.x;
  let y = drag.origin.y;
  let width = drag.size.x;
  let height = drag.size.y;
  if (handle.includes("e")) width = drag.size.x + deltaX;
  if (handle.includes("s")) height = drag.size.y + deltaY;
  if (handle.includes("w")) { width = drag.size.x - deltaX; x = drag.origin.x + deltaX; }
  if (handle.includes("n")) { height = drag.size.y - deltaY; y = drag.origin.y + deltaY; }
  width = Math.max(minimum.width, width);
  height = Math.max(minimum.height, height);
  if (locked) {
    const ratio = drag.size.x / Math.max(1, drag.size.y);
    const horizontal = handle.includes("e") || handle.includes("w");
    const vertical = handle.includes("n") || handle.includes("s");
    if (horizontal && !vertical) height = width / ratio;
    else if (!horizontal && vertical) width = height * ratio;
    else if (Math.abs(deltaX) >= Math.abs(deltaY)) height = width / ratio;
    else width = height * ratio;
    if (handle.includes("w")) x = drag.origin.x + drag.size.x - width;
    if (handle.includes("n")) y = drag.origin.y + drag.size.y - height;
  }
  return { x, y, width, height } as Partial<BoardElement>;
}

function ColorRow({ value, colors, onChange }: { value: string; colors: string[]; onChange: (value: string) => void }) {
  return <div className="wb-colors">{colors.map((color) => <button key={color} className={value === color ? "active" : ""} style={{ background: color === "transparent" ? "linear-gradient(45deg, transparent 45%, #a82f2a 45% 55%, transparent 55%)" : color }} onClick={() => onChange(color)} />)}<input type="color" value={value === "transparent" ? "#ffffff" : value} onChange={(event) => onChange(event.target.value)} /></div>;
}
function BoardLinkPath({ link, elements, onDelete }: { link: BoardLink; elements: BoardElement[]; onDelete: () => void }) {
  const from = elements.find((element) => element.id === link.from);
  const to = elements.find((element) => element.id === link.to);
  if (!from || !to) return null;
  const start = centerOf(from);
  const end = centerOf(to);
  const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
  return <g><path d={`M ${start.x} ${start.y} C ${mid.x} ${start.y}, ${mid.x} ${end.y}, ${end.x} ${end.y}`} /><foreignObject x={mid.x - 34} y={mid.y - 14} width="68" height="28"><button onClick={onDelete} className="wb-link-label">{link.label}</button></foreignObject></g>;
}
function makeTextElement(values: Partial<TextElement> & Pick<Partial<TextElement>, "x" | "y" | "text">): TextElement { return { id: uid(), kind: "text", x: values.x ?? 0, y: values.y ?? 0, width: values.width ?? 280, height: values.height ?? 160, text: values.text ?? "New thought", fontFamily: values.fontFamily ?? fonts[0].value, fontSize: values.fontSize ?? 19, color: values.color ?? "#20231f", fill: values.fill ?? "#fffdf3", bold: values.bold ?? false, italic: values.italic ?? false, align: values.align ?? "left", rotation: values.rotation ?? 0 }; }
function makeShapeElement(values: Partial<ShapeElement> & Pick<ShapeElement, "shape" | "x" | "y">): ShapeElement { return { id: uid(), kind: "shape", shape: values.shape, x: values.x, y: values.y, width: values.width ?? (values.shape === "arrow" ? 220 : 190), height: values.height ?? (values.shape === "arrow" ? 70 : 140), fill: values.fill ?? "transparent", stroke: values.stroke ?? "#ece8dc", strokeWidth: values.strokeWidth ?? 4, label: values.label, rotation: values.rotation ?? 0 }; }
function makeTableElement(values: Partial<TableElement> & Pick<Partial<TableElement>, "x" | "y">): TableElement { const rows = values.rows ?? 4; const columns = values.columns ?? 3; return { id: uid(), kind: "table", x: values.x ?? 0, y: values.y ?? 0, width: values.width ?? 380, height: values.height ?? 220, rows, columns, cells: values.cells ?? Array.from({ length: rows * columns }, (_, index) => index < columns ? `Header ${index + 1}` : ""), fill: values.fill ?? "#101a16", color: values.color ?? "#ece8dc", borderColor: values.borderColor ?? "rgba(236,232,220,.38)", fontSize: values.fontSize ?? 14, rotation: values.rotation ?? 0 }; }
function centerOf(element: BoardElement) { return { x: element.x + element.width / 2, y: element.y + element.height / 2 }; }
function normalizeRect(a: Point, b: Point) { const x = Math.min(a.x, b.x); const y = Math.min(a.y, b.y); return { x, y, width: Math.abs(a.x - b.x), height: Math.abs(a.y - b.y) }; }
function rectsIntersect(rect: { x: number; y: number; width: number; height: number }, element: BoardElement) { return rect.x <= element.x + element.width && rect.x + rect.width >= element.x && rect.y <= element.y + element.height && rect.y + rect.height >= element.y; }
function clamp(value: number, min: number, max: number) { return Math.max(min, Math.min(max, value)); }
function radiansToDegrees(value: number) { return value * 180 / Math.PI; }
function timestamp() { return Date.now(); }
function uid() { return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function sortBoards(items: BoardFile[]) { return [...items].sort((a, b) => b.updatedAt - a.updatedAt); }
function slugify(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "board"; }
function downloadText(name: string, text: string, type: string) { const url = URL.createObjectURL(new Blob([text], { type })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click(); URL.revokeObjectURL(url); }
function exportHtml(board: BoardFile, assets: BoardAsset[], mode: "pdf" | "ppt") { const bounds = board.elements.reduce((box, element) => ({ minX: Math.min(box.minX, element.x), minY: Math.min(box.minY, element.y), maxX: Math.max(box.maxX, element.x + element.width), maxY: Math.max(box.maxY, element.y + element.height) }), { minX: -200, minY: -200, maxX: 1200, maxY: 800 }); const offsetX = bounds.minX - 80; const offsetY = bounds.minY - 80; const width = bounds.maxX - bounds.minX + 160; const height = bounds.maxY - bounds.minY + 160; const elements = board.elements.map((element) => { const style = `left:${element.x - offsetX}px;top:${element.y - offsetY}px;width:${element.width}px;height:${element.height}px;transform:rotate(${element.rotation ?? 0}deg);`; if (element.kind === "text") return `<div class="text" style="${style}font-family:${element.fontFamily};font-size:${element.fontSize}px;color:${element.color};background:${element.fill};font-weight:${element.bold ? 800 : 450};font-style:${element.italic ? "italic" : "normal"};text-align:${element.align};">${escapeHtml(element.text).replaceAll("\n", "<br />")}</div>`; if (element.kind === "image") { const asset = assets.find((item) => item.id === element.assetId); const src = element.src ?? asset?.url ?? ""; return `<div class="photo" style="${style}"><img src="${src}" /></div>`; } if (element.kind === "shape") return `<div class="shape" style="${style}border:${element.strokeWidth}px solid ${element.stroke};background:${element.fill};border-radius:${element.shape === "ellipse" ? "50%" : "0"};">${escapeHtml(element.label ?? "")}</div>`; return `<div class="table" style="${style}display:grid;grid-template-columns:repeat(${element.columns},1fr);background:${element.fill};color:${element.color};border:1px solid ${element.borderColor};font-size:${element.fontSize}px;">${element.cells.map((cell) => `<span>${escapeHtml(cell)}</span>`).join("")}</div>`; }).join("\n"); return `<!doctype html><html><head><meta charset="utf-8" /><title>${escapeHtml(board.name)}</title><style>@page{size:landscape;margin:10mm}body{margin:0;background:#101410;color:#ece8dc;font-family:Georgia,serif}.slide{position:relative;width:${width}px;height:${height}px;background:#172018;background-image:linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px);background-size:40px 40px;overflow:hidden}.text,.photo,.shape,.table{position:absolute;box-sizing:border-box;box-shadow:0 8px 24px rgba(0,0,0,.18);white-space:normal}.text{padding:14px}.photo{padding:0;background:#111}.photo img{width:100%;height:100%;object-fit:cover}.shape{display:grid;place-items:center;font-weight:700}.table span{padding:8px;border:1px solid rgba(255,255,255,.22)}</style></head><body><section class="slide">${elements}</section>${mode === "ppt" ? "" : "<script>setTimeout(()=>print(),250)</script>"}</body></html>`; }
function escapeHtml(value: string) { return value.replace(/[&<>"]/g, (match) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[match] ?? match)); }
async function ensureDb() { await getWhiteboardState(); }
async function putBoard(board: BoardFile) { const response = await fetch(WHITEBOARD_API, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(board) }); const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(payload.error || "Whiteboard save failed"); return payload.board as BoardFile; }
async function removeBoard(id: string) { const response = await fetch(`${WHITEBOARD_API}?id=${encodeURIComponent(id)}`, { method: "DELETE" }); if (!response.ok) { const payload = await response.json().catch(() => ({})); throw new Error(payload.error || "Board delete failed"); } }
async function getAllBoards() { return sortBoards((await getWhiteboardState()).boards); }
async function getAllAssets() { return (await getWhiteboardState()).assets.sort((a, b) => b.updated - a.updated); }
async function getWhiteboardState(): Promise<{ boards: BoardFile[]; assets: BoardAsset[] }> { const response = await fetch(WHITEBOARD_API, { cache: "no-store" }); const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(payload.error || "Whiteboard database is unavailable"); return { boards: payload.boards ?? [], assets: payload.assets ?? [] }; }
async function uploadAsset(file: File | Blob, id?: string, fallbackName = "whiteboard-image.png") { const form = new FormData(); const name = file instanceof File ? file.name : fallbackName; form.set("file", file instanceof File ? file : new File([file], name, { type: file.type || "image/png" })); if (id) form.set("id", id); const response = await fetch(WHITEBOARD_ASSET_API, { method: "POST", body: form }); const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(payload.error || "Image upload failed"); return payload.asset as BoardAsset; }
async function migrateLegacyBrowserStorage(setStatus: (message: string) => void) { const [state, legacyBoards, legacyAssets, vaultImages, queuedImports] = await Promise.all([getWhiteboardState(), getLegacyBoards(), getLegacyAssets(), getLegacyVaultImages(), getQueuedImports()]); const remoteIds = new Set(state.assets.map((asset) => asset.id)); const remoteNames = new Set(state.assets.map((asset) => `${asset.name}:${asset.size}`)); let migratedAssets = 0; for (const asset of [...legacyAssets, ...vaultImages]) { if (!asset.blob || remoteIds.has(asset.id) || remoteNames.has(`${asset.name}:${asset.size}`)) continue; await uploadAsset(asset.blob, asset.id, asset.name); migratedAssets += 1; } for (const item of queuedImports) { const blob = await dataUrlToBlob(item.src).catch(() => null); if (!blob || remoteNames.has(`${item.name}:${blob.size}`)) continue; await uploadAsset(blob, undefined, item.name); migratedAssets += 1; } const remoteBoardIds = new Set(state.boards.map((item) => item.id)); let migratedBoards = 0; for (const item of legacyBoards) { if (remoteBoardIds.has(item.id)) continue; await putBoard(item); migratedBoards += 1; } if (migratedAssets || migratedBoards || queuedImports.length) { await clearLegacyWhiteboardStorage(); await deleteLegacyVaultImages(vaultImages.map((asset) => asset.id)); window.localStorage.removeItem("veo-whiteboard-imports"); setStatus(`Migrated ${migratedBoards} board${migratedBoards === 1 ? "" : "s"} and ${migratedAssets} image${migratedAssets === 1 ? "" : "s"}; browser copies cleared`); } }
async function getLegacyBoards() { const db = await openExistingDb(BOARD_DB); if (!db || !db.objectStoreNames.contains(BOARD_STORE)) return []; const boards = await getAllFromStore<BoardFile>(db, BOARD_STORE); db.close(); return boards; }
async function getLegacyAssets() { const db = await openExistingDb(BOARD_DB); if (!db || !db.objectStoreNames.contains(ASSET_STORE)) return []; const assets = await getAllFromStore<LegacyBoardAsset>(db, ASSET_STORE); db.close(); return assets; }
async function getLegacyVaultImages() { const db = await openExistingDb(VAULT_DB); if (!db || !db.objectStoreNames.contains(VAULT_STORE)) return []; const files = await getAllFromStore<LegacyBoardAsset>(db, VAULT_STORE); db.close(); return files.filter((file) => file.type?.startsWith("image/") && file.blob); }
function getQueuedImports() { try { return JSON.parse(window.localStorage.getItem("veo-whiteboard-imports") || "[]") as Array<{ name: string; src: string }>; } catch { return []; } }
function openExistingDb(name: string) { return new Promise<IDBDatabase | null>((resolve) => { const request = indexedDB.open(name); request.onsuccess = () => resolve(request.result); request.onerror = () => resolve(null); }); }
function getAllFromStore<T>(db: IDBDatabase, storeName: string) { return new Promise<T[]>((resolve, reject) => { const request = db.transaction(storeName, "readonly").objectStore(storeName).getAll(); request.onsuccess = () => resolve(request.result as T[]); request.onerror = () => reject(request.error); }); }
function clearLegacyWhiteboardStorage() { return new Promise<void>((resolve) => { const request = indexedDB.deleteDatabase(BOARD_DB); request.onsuccess = () => resolve(); request.onerror = () => resolve(); request.onblocked = () => resolve(); }); }
async function deleteLegacyVaultImages(ids: string[]) { if (!ids.length) return; const db = await openExistingDb(VAULT_DB); if (!db || !db.objectStoreNames.contains(VAULT_STORE)) return; await new Promise<void>((resolve) => { const transaction = db.transaction(VAULT_STORE, "readwrite"); const store = transaction.objectStore(VAULT_STORE); ids.forEach((id) => store.delete(id)); transaction.oncomplete = () => resolve(); transaction.onerror = () => resolve(); }); db.close(); }
async function dataUrlToBlob(src: string) { return fetch(src).then((response) => response.blob()); }