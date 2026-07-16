import "server-only";
import { archiveEntries, devlogs, findEntry as findSeedEntry, findPost as findSeedPost } from "@/lib/content";
import { databaseConfigured, getSql } from "@/lib/db";
import type { ArchiveEntry, ArchiveType, DevlogPost, DevlogShot } from "@/lib/types";

type ArchiveRecordRow = {
  slug: string;
  type: ArchiveType;
  title: string;
  summary: string;
  description: string;
  status: "canon" | "draft" | "cut";
  role: string;
  need: string;
  contradiction: string;
  tags: string[] | string;
  connections: string[] | string;
  image_url: string | null;
  image_position: string | null;
  published: boolean;
  updated_at: string | Date;
};

type DevlogPostRow = {
  slug: string;
  title: string;
  dek: string;
  body: string;
  visibility: string;
  cover_url: string | null;
  cover_position: string | null;
  header_url: string | null;
  header_position: string | null;
  category: string | null;
  status: "prototype" | "implemented" | "testing" | "design-note" | null;
  build: string | null;
  read_time: string | null;
  images: DevlogShot[] | string | null;
  pinned: boolean | null;
  published_at: string | Date | null;
  updated_at: string | Date;
};

export async function getArchiveEntries({ includeUnpublished = false } = {}) {
  if (!databaseConfigured()) return archiveEntries;
  try {
    const sql = getSql();
    const rows = includeUnpublished
      ? await sql`SELECT * FROM archive_records ORDER BY updated_at DESC`
      : await sql`SELECT * FROM archive_records WHERE published = true ORDER BY updated_at DESC`;
    return mergeBySlug((rows as ArchiveRecordRow[]).map(mapArchiveRow), archiveEntries);
  } catch {
    return archiveEntries;
  }
}

export async function getArchiveEntry(slug: string) {
  const entries = await getArchiveEntries({ includeUnpublished: false });
  return entries.find((entry) => entry.slug === slug) ?? findSeedEntry(slug);
}

export async function getDevlogPosts({ includePrivate = false } = {}) {
  if (!databaseConfigured()) return devlogs;
  try {
    const sql = getSql();
    const rows = includePrivate
      ? await sql`SELECT * FROM devlog_posts ORDER BY pinned DESC, COALESCE(published_at, updated_at) DESC`
      : await sql`SELECT * FROM devlog_posts WHERE visibility = 'public' AND published_at IS NOT NULL ORDER BY pinned DESC, published_at DESC`;
    return mergeBySlug((rows as DevlogPostRow[]).map(mapDevlogRow), devlogs);
  } catch {
    return devlogs;
  }
}

export async function getDevlogPost(slug: string) {
  const posts = await getDevlogPosts({ includePrivate: false });
  return posts.find((post) => post.slug === slug) ?? findSeedPost(slug);
}

function mergeBySlug<T extends { slug: string }>(primary: T[], fallback: T[]) {
  const seen = new Set<string>();
  const merged: T[] = [];
  for (const item of primary) {
    merged.push(item);
    seen.add(item.slug);
  }
  for (const item of fallback) {
    if (!seen.has(item.slug)) merged.push(item);
  }
  return merged;
}

function mapArchiveRow(row: ArchiveRecordRow): ArchiveEntry {
  const updated = formatDate(row.updated_at);
  return {
    slug: row.slug,
    type: row.type,
    title: row.title,
    eyebrow: `${row.type.toUpperCase()} // DATABASE`,
    summary: row.summary,
    description: splitParagraphs(row.description),
    image: row.image_url || "/images/prudina-bus-stop.png",
    imagePosition: row.image_position || "50% 50%",
    status: row.status,
    progress: row.published ? 100 : 35,
    tags: parseJsonArray(row.tags),
    connections: parseJsonArray(row.connections),
    updated,
    facts: [
      row.role && { label: "Function", value: row.role },
      row.need && { label: "Need", value: row.need },
      row.contradiction && { label: "Contradiction", value: row.contradiction },
      { label: "Source", value: "Studio database" },
    ].filter(Boolean) as Array<{ label: string; value: string }>,
  };
}

function mapDevlogRow(row: DevlogPostRow): DevlogPost {
  const published = row.published_at ?? row.updated_at;
  const bodySections = splitBody(row.body);
  const words = row.body.trim() ? row.body.trim().split(/\s+/).length : 0;
  const gallery = parseJsonArray(row.images).filter((item): item is DevlogShot => typeof item === "object" && Boolean(item) && "src" in item);
  return {
    slug: row.slug,
    number: row.pinned ? "PINNED" : "LOG DB",
    title: row.title,
    dek: row.dek,
    date: formatDate(published),
    readTime: row.read_time || `${Math.max(1, Math.ceil(words / 220))} MIN`,
    category: row.category || "STUDIO POST",
    image: row.cover_url || row.header_url || "/images/prudina-bus-stop.png",
    coverPosition: row.cover_position || "50% 50%",
    headerImage: row.header_url || undefined,
    headerPosition: row.header_position || "50% 50%",
    imageAlt: `${row.title} cover image`,
    captureLabel: row.cover_url ? "STUDIO COVER / DATABASE" : "STUDIO TRANSMISSION / DATABASE",
    status: row.status || "implemented",
    build: row.build || "0.4.9",
    pinned: Boolean(row.pinned),
    gallery: gallery.length ? gallery : undefined,
    body: bodySections,
  };
}

function splitBody(body: string): DevlogPost["body"] {
  const sections: DevlogPost["body"] = [];
  let current: { heading?: string; paragraphs: string[] } = { paragraphs: [] };
  for (const block of body.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean)) {
    if (block.startsWith("## ")) {
      if (current.heading || current.paragraphs.length) sections.push(current);
      current = { heading: block.replace(/^##\s+/, ""), paragraphs: [] };
    } else if (/^!\[.*\]\(.+\)$/.test(block)) {
      current.paragraphs.push(block);
    } else {
      current.paragraphs.push(block);
    }
  }
  if (current.heading || current.paragraphs.length) sections.push(current);
  return sections.length ? sections : [{ paragraphs: ["No body copy has been published for this post yet."] }];
}

function splitParagraphs(value: string) {
  return value.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
}

function parseJsonArray(value: unknown) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "UNPUBLISHED";
  return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).toUpperCase();
}
