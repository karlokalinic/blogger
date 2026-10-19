import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { isStudioAuthenticated } from "@/lib/auth";

export const runtime = "nodejs";

const ALLOWED_TYPES = [
  "image/png", "image/jpeg", "image/webp", "image/gif", "image/avif",
  "video/mp4", "video/webm",
  "audio/mpeg", "audio/mp3", "audio/mp4", "audio/x-m4a",
  "audio/wav", "audio/x-wav", "audio/wave", "audio/ogg", "audio/flac", "audio/x-flac",
  "application/pdf", "application/zip", "application/x-zip-compressed",
  "text/plain", "text/markdown", "application/octet-stream",
];

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ error: "Blob storage is not configured" }, { status: 503 });
  }
  const body = await request.json().catch(() => null) as HandleUploadBody | null;
  if (!body) return Response.json({ error: "Invalid upload request" }, { status: 400 });
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!(await isStudioAuthenticated())) throw new Error("Unauthorized");
        if (!pathname.startsWith("project-assets/") || pathname.includes("..") || pathname.length > 260) {
          throw new Error("Invalid upload path");
        }
        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: 50 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      // This callback is sent by Vercel Blob, not by the authenticated browser.
      // Publication is authorized separately via POST /api/posts.
      onUploadCompleted: async () => {},
    });
    return Response.json(result);
  } catch {
    return Response.json({ error: "Upload was rejected" }, { status: 403 });
  }
}
