import { z } from "zod";
import { isStudioAuthenticated } from "@/lib/auth";
import { databaseConfigured, getSql } from "@/lib/db";
import { ensureWhiteboardTables } from "@/lib/whiteboard-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const viewportSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  zoom: z.number().finite().min(0.05).max(8),
});

const jsonObjectSchema = z.record(z.string(), z.unknown());

const boardSchema = z.object({
  id: z.string().min(1).max(140),
  name: z.string().min(1).max(240),
  summary: z.string().max(2000).default(""),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
  viewport: viewportSchema,
  elements: z.array(jsonObjectSchema).max(5000),
  links: z.array(jsonObjectSchema).max(5000),
});

type BoardRow = {
  id: string;
  name: string;
  summary: string;
  viewport: unknown;
  elements: unknown;
  links: unknown;
  created_ms: string | number;
  updated_ms: string | number;
};

type AssetRow = {
  id: string;
  name: string;
  type: string;
  size: string | number;
  url: string;
  pathname: string | null;
  updated_ms: string | number;
};

export async function GET() {
  if (!(await isStudioAuthenticated())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!databaseConfigured()) return Response.json({ error: "DATABASE_URL is not configured. Whiteboard database storage is required." }, { status: 503 });
  const sql = getSql();
  await ensureWhiteboardTables(sql);
  const boards = await sql`
    SELECT id, name, summary, viewport, elements, links,
      EXTRACT(EPOCH FROM created_at) * 1000 AS created_ms,
      EXTRACT(EPOCH FROM updated_at) * 1000 AS updated_ms
    FROM whiteboard_boards
    ORDER BY updated_at DESC
  ` as BoardRow[];
  const assets = await sql`
    SELECT id, name, type, size, url, pathname,
      EXTRACT(EPOCH FROM updated_at) * 1000 AS updated_ms
    FROM whiteboard_assets
    ORDER BY updated_at DESC
  ` as AssetRow[];
  return Response.json({ source: "database", boards: boards.map(normalizeBoard), assets: assets.map(normalizeAsset) });
}

export async function POST(request: Request) {
  if (!(await isStudioAuthenticated())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!databaseConfigured()) return Response.json({ error: "DATABASE_URL is not configured. Whiteboard database storage is required." }, { status: 503 });
  const parsed = boardSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Board validation failed", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  const value = parsed.data;
  const sql = getSql();
  await ensureWhiteboardTables(sql);
  const rows = await sql`
    INSERT INTO whiteboard_boards (id, name, summary, viewport, elements, links, created_at, updated_at)
    VALUES (${value.id}, ${value.name}, ${value.summary}, ${JSON.stringify(value.viewport)}::jsonb, ${JSON.stringify(value.elements)}::jsonb, ${JSON.stringify(value.links)}::jsonb, to_timestamp(${value.createdAt} / 1000.0), NOW())
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      summary = EXCLUDED.summary,
      viewport = EXCLUDED.viewport,
      elements = EXCLUDED.elements,
      links = EXCLUDED.links,
      updated_at = NOW()
    RETURNING id, name, summary, viewport, elements, links,
      EXTRACT(EPOCH FROM created_at) * 1000 AS created_ms,
      EXTRACT(EPOCH FROM updated_at) * 1000 AS updated_ms
  ` as BoardRow[];
  return Response.json({ board: normalizeBoard(rows[0]) }, { status: 201 });
}

export async function DELETE(request: Request) {
  if (!(await isStudioAuthenticated())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!databaseConfigured()) return Response.json({ error: "DATABASE_URL is not configured. Whiteboard database storage is required." }, { status: 503 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Missing board id." }, { status: 400 });
  const sql = getSql();
  await ensureWhiteboardTables(sql);
  await sql`DELETE FROM whiteboard_boards WHERE id = ${id}`;
  return Response.json({ ok: true });
}

function normalizeBoard(row: BoardRow) {
  return {
    id: row.id,
    name: row.name,
    summary: row.summary,
    createdAt: Math.round(Number(row.created_ms)),
    updatedAt: Math.round(Number(row.updated_ms)),
    viewport: row.viewport,
    elements: row.elements,
    links: row.links,
  };
}

function normalizeAsset(row: AssetRow) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    size: Number(row.size),
    updated: Math.round(Number(row.updated_ms)),
    url: row.url,
    pathname: row.pathname ?? undefined,
  };
}