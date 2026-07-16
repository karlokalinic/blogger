import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import { isStudioAuthenticated } from "@/lib/auth";
import { databaseConfigured, getSql } from "@/lib/db";
import { ensureWhiteboardTables } from "@/lib/whiteboard-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AssetRow = {
  id: string;
  name: string;
  type: string;
  size: string | number;
  url: string;
  pathname: string | null;
  updated_ms: string | number;
};

export async function POST(request: Request) {
  if (!(await isStudioAuthenticated())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!databaseConfigured()) return Response.json({ error: "DATABASE_URL is not configured. Whiteboard asset storage is required." }, { status: 503 });
  const data = await request.formData().catch(() => null);
  if (!data) return Response.json({ error: "Invalid upload request." }, { status: 400 });
  const file = data.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No image file received." }, { status: 400 });
  if (!file.type.startsWith("image/")) return Response.json({ error: "Whiteboard assets must be images." }, { status: 400 });
  if (file.size > 50 * 1024 * 1024) return Response.json({ error: "Images larger than 50 MB are not supported." }, { status: 413 });

  const idValue = data.get("id");
  const id = typeof idValue === "string" && idValue.trim() ? idValue.trim().slice(0, 140) : randomUUID();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
  const type = file.type || "image/png";
  let url: string;
  let pathname: string | null = null;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`whiteboard-assets/${Date.now()}-${safeName}`, file, { access: "public", addRandomSuffix: true });
    url = blob.url;
    pathname = blob.pathname;
  } else {
    const buffer = Buffer.from(await file.arrayBuffer());
    url = `data:${type};base64,${buffer.toString("base64")}`;
  }

  const sql = getSql();
  await ensureWhiteboardTables(sql);
  const rows = await sql`
    INSERT INTO whiteboard_assets (id, name, type, size, url, pathname, updated_at)
    VALUES (${id}, ${file.name}, ${type}, ${file.size}, ${url}, ${pathname}, NOW())
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      type = EXCLUDED.type,
      size = EXCLUDED.size,
      url = EXCLUDED.url,
      pathname = EXCLUDED.pathname,
      updated_at = NOW()
    RETURNING id, name, type, size, url, pathname,
      EXTRACT(EPOCH FROM updated_at) * 1000 AS updated_ms
  ` as AssetRow[];
  return Response.json({ asset: normalizeAsset(rows[0]), storedIn: pathname ? "blob" : "database" }, { status: 201 });
}

export async function DELETE(request: Request) {
  if (!(await isStudioAuthenticated())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!databaseConfigured()) return Response.json({ error: "DATABASE_URL is not configured. Whiteboard asset storage is required." }, { status: 503 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Missing asset id." }, { status: 400 });
  const sql = getSql();
  await ensureWhiteboardTables(sql);
  await sql`DELETE FROM whiteboard_assets WHERE id = ${id}`;
  return Response.json({ ok: true });
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