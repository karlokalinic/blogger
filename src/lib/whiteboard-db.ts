import "server-only";
import { getSql } from "@/lib/db";

type Sql = ReturnType<typeof getSql>;

export async function ensureWhiteboardTables(sql: Sql = getSql()) {
  await sql`
    CREATE TABLE IF NOT EXISTS whiteboard_boards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT 'Untitled board',
      summary TEXT NOT NULL DEFAULT '',
      viewport JSONB NOT NULL DEFAULT '{"x":0,"y":0,"zoom":1}'::jsonb,
      elements JSONB NOT NULL DEFAULT '[]'::jsonb,
      links JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS whiteboard_assets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      size BIGINT NOT NULL DEFAULT 0,
      url TEXT NOT NULL,
      pathname TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}