import { z } from "zod";
import { revalidatePath } from "next/cache";
import { archiveEntries } from "@/lib/content";
import { isStudioAuthenticated } from "@/lib/auth";
import { databaseConfigured, getSql } from "@/lib/db";

export const runtime = "nodejs";

const recordSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).max(120),
  type: z.enum(["character", "location", "mission", "item", "faction", "note"]),
  title: z.string().min(1).max(180),
  summary: z.string().max(500).default(""),
  description: z.string().max(50_000).default(""),
  status: z.enum(["draft", "canon", "cut"]).default("draft"),
  role: z.string().max(500).default(""),
  need: z.string().max(500).default(""),
  contradiction: z.string().max(1000).default(""),
  tags: z.array(z.string().max(60)).max(30).default([]),
  connections: z.array(z.string().max(180)).max(80).default([]),
  imageUrl: z.string().max(20_000).nullable().optional(),
  imagePosition: z.string().max(40).default("50% 50%"),
  published: z.boolean().default(false),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const includeAll = url.searchParams.get("all") === "1";
  if (includeAll && !(await isStudioAuthenticated())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!databaseConfigured()) return Response.json({ source: "seed", records: archiveEntries });
  const sql = getSql();
  const records = includeAll
    ? await sql`SELECT * FROM archive_records ORDER BY updated_at DESC`
    : await sql`SELECT * FROM archive_records WHERE published = true ORDER BY updated_at DESC`;
  return Response.json({ source: "database", records });
}

export async function POST(request: Request) {
  if (!(await isStudioAuthenticated())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!databaseConfigured()) return Response.json({ error: "Cloud database is not connected. The studio kept your record locally." }, { status: 503 });
  const parsed = recordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Record validation failed", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  const value = parsed.data;
  const sql = getSql();
  const rows = await sql`
    INSERT INTO archive_records (slug, type, title, summary, description, status, role, need, contradiction, tags, connections, image_url, image_position, published)
    VALUES (${value.slug}, ${value.type}, ${value.title}, ${value.summary}, ${value.description}, ${value.status}, ${value.role}, ${value.need}, ${value.contradiction}, ${JSON.stringify(value.tags)}::jsonb, ${JSON.stringify(value.connections)}::jsonb, ${value.imageUrl ?? null}, ${value.imagePosition}, ${value.published})
    ON CONFLICT (slug) DO UPDATE SET type = EXCLUDED.type, title = EXCLUDED.title, summary = EXCLUDED.summary, description = EXCLUDED.description, status = EXCLUDED.status, role = EXCLUDED.role, need = EXCLUDED.need, contradiction = EXCLUDED.contradiction, tags = EXCLUDED.tags, connections = EXCLUDED.connections, image_url = EXCLUDED.image_url, image_position = EXCLUDED.image_position, published = EXCLUDED.published, updated_at = NOW()
    RETURNING *
  `;
  revalidatePath("/archive");
  revalidatePath(`/archive/${value.slug}`);
  return Response.json({ record: rows[0] }, { status: 201 });
}
