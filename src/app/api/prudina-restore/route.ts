import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { z } from "zod";
import { databaseConfigured, getSql } from "@/lib/db";
import { starterPrudinaState } from "@/lib/prudina-game";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "prudina_restore_save";

const stateSchema = z.record(z.string(), z.unknown());

type SaveRow = { state: unknown; updated_ms: string | number };

async function ensureTable() {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS prudina_restore_saves (
      save_key TEXT PRIMARY KEY,
      state JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  return sql;
}

async function saveKey() {
  const jar = await cookies();
  const existing = jar.get(COOKIE_NAME)?.value;
  if (existing) return existing;
  const next = randomUUID();
  jar.set(COOKIE_NAME, next, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  return next;
}

export async function GET() {
  if (!databaseConfigured()) return Response.json({ error: "DATABASE_URL is not configured. Prudina Restore autosave requires the database." }, { status: 503 });
  const key = await saveKey();
  const sql = await ensureTable();
  const rows = await sql`
    SELECT state, EXTRACT(EPOCH FROM updated_at) * 1000 AS updated_ms
    FROM prudina_restore_saves
    WHERE save_key = ${key}
  ` as SaveRow[];
  if (rows[0]) return Response.json({ source: "database", state: rows[0].state, savedAt: Math.round(Number(rows[0].updated_ms)) });
  const state = starterPrudinaState();
  await sql`INSERT INTO prudina_restore_saves (save_key, state) VALUES (${key}, ${JSON.stringify(state)}::jsonb)`;
  return Response.json({ source: "database", state, savedAt: Date.now() });
}

export async function POST(request: Request) {
  if (!databaseConfigured()) return Response.json({ error: "DATABASE_URL is not configured. Prudina Restore autosave requires the database." }, { status: 503 });
  const parsed = stateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Save validation failed." }, { status: 400 });
  const key = await saveKey();
  const sql = await ensureTable();
  const rows = await sql`
    INSERT INTO prudina_restore_saves (save_key, state, updated_at)
    VALUES (${key}, ${JSON.stringify(parsed.data)}::jsonb, NOW())
    ON CONFLICT (save_key) DO UPDATE SET state = EXCLUDED.state, updated_at = NOW()
    RETURNING EXTRACT(EPOCH FROM updated_at) * 1000 AS updated_ms
  ` as Array<{ updated_ms: string | number }>;
  return Response.json({ ok: true, savedAt: Math.round(Number(rows[0]?.updated_ms ?? Date.now())) });
}