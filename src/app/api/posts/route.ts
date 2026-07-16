import { z } from "zod";
import { revalidatePath } from "next/cache";
import { devlogs } from "@/lib/content";
import { isStudioAuthenticated } from "@/lib/auth";
import { databaseConfigured, getSql } from "@/lib/db";

export const runtime = "nodejs";

const imageSchema = z.object({
  src: z.string().max(20_000),
  alt: z.string().max(240).default(""),
  caption: z.string().max(700).default(""),
  label: z.string().max(80).default("STUDIO PHOTO"),
  position: z.string().max(40).optional(),
});

const postSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).max(140),
  title: z.string().min(1).max(220),
  dek: z.string().max(800).default(""),
  body: z.string().max(500_000).default(""),
  visibility: z.enum(["private", "internal", "public"]).default("private"),
  coverUrl: z.string().max(20_000).nullable().optional(),
  coverPosition: z.string().max(40).default("50% 50%"),
  headerUrl: z.string().max(20_000).nullable().optional(),
  headerPosition: z.string().max(40).default("50% 50%"),
  category: z.string().max(80).default("STUDIO POST"),
  status: z.enum(["prototype", "implemented", "testing", "design-note"]).default("implemented"),
  build: z.string().max(40).default("0.4.9"),
  readTime: z.string().max(40).default(""),
  images: z.array(imageSchema).max(200).default([]),
  pinned: z.boolean().default(false),
  publish: z.boolean().default(false),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const includeAll = url.searchParams.get("all") === "1";
  if (includeAll && !(await isStudioAuthenticated())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!databaseConfigured()) return Response.json({ source: "seed", posts: devlogs });
  const sql = getSql();
  const posts = includeAll
    ? await sql`SELECT * FROM devlog_posts ORDER BY pinned DESC, COALESCE(published_at, updated_at) DESC`
    : await sql`SELECT * FROM devlog_posts WHERE visibility = 'public' AND published_at IS NOT NULL ORDER BY pinned DESC, published_at DESC`;
  return Response.json({ source: "database", posts });
}

export async function POST(request: Request) {
  if (!(await isStudioAuthenticated())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!databaseConfigured()) return Response.json({ error: "DATABASE_URL is not configured. Connect Neon and run Studio → Project settings → Initialize missing tables." }, { status: 503 });
  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Post validation failed", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  const value = parsed.data;
  const visibility = value.publish ? "public" : value.visibility;
  const publishedAt = value.publish ? new Date().toISOString() : null;
  const sql = getSql();
  const rows = await sql`
    INSERT INTO devlog_posts (slug, title, dek, body, visibility, cover_url, cover_position, header_url, header_position, category, status, build, read_time, images, pinned, published_at)
    VALUES (${value.slug}, ${value.title}, ${value.dek}, ${value.body}, ${visibility}, ${value.coverUrl ?? null}, ${value.coverPosition}, ${value.headerUrl ?? null}, ${value.headerPosition}, ${value.category}, ${value.status}, ${value.build}, ${value.readTime}, ${JSON.stringify(value.images)}::jsonb, ${value.pinned}, ${publishedAt})
    ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, dek = EXCLUDED.dek, body = EXCLUDED.body, visibility = EXCLUDED.visibility, cover_url = EXCLUDED.cover_url, cover_position = EXCLUDED.cover_position, header_url = EXCLUDED.header_url, header_position = EXCLUDED.header_position, category = EXCLUDED.category, status = EXCLUDED.status, build = EXCLUDED.build, read_time = EXCLUDED.read_time, images = EXCLUDED.images, pinned = EXCLUDED.pinned, published_at = COALESCE(EXCLUDED.published_at, devlog_posts.published_at), updated_at = NOW()
    RETURNING *
  `;
  revalidatePath("/");
  revalidatePath("/devlog");
  revalidatePath(`/devlog/${value.slug}`);
  return Response.json({ post: rows[0] }, { status: 201 });
}
