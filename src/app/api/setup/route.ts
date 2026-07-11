import { isStudioAuthenticated } from "@/lib/auth";
import { getSql, databaseConfigured } from "@/lib/db";

export async function POST() {
  if (!(await isStudioAuthenticated())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!databaseConfigured()) return Response.json({ error: "DATABASE_URL is not configured." }, { status: 503 });
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS archive_records (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft',
      role TEXT NOT NULL DEFAULT '',
      need TEXT NOT NULL DEFAULT '',
      contradiction TEXT NOT NULL DEFAULT '',
      tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      connections JSONB NOT NULL DEFAULT '[]'::jsonb,
      image_url TEXT,
      published BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS devlog_posts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      dek TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      visibility TEXT NOT NULL DEFAULT 'private',
      cover_url TEXT,
      published_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  return Response.json({ ok: true, tables: ["archive_records", "devlog_posts"] });
}
