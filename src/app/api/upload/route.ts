import { put } from "@vercel/blob";
import { isStudioAuthenticated } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await isStudioAuthenticated())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return Response.json({ error: "Cloud media storage is not connected. The local vault remains available." }, { status: 503 });
  const data = await request.formData();
  const file = data.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file received." }, { status: 400 });
  if (file.size > 50 * 1024 * 1024) return Response.json({ error: "Use direct client upload for files larger than 50 MB." }, { status: 413 });
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
  const blob = await put(`project-assets/${Date.now()}-${safeName}`, file, { access: "public", addRandomSuffix: true });
  return Response.json({ url: blob.url, pathname: blob.pathname, size: file.size, contentType: file.type });
}
