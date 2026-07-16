import { getDevlogPosts } from "@/lib/published-content";

export const dynamic = "force-dynamic";

export async function GET() {
  const devlogs = await getDevlogPosts();
  const base = "https://karlolegendblog.vercel.app";
  const items = devlogs.map((post) => `<item><title>${escapeXml(post.title)}</title><link>${base}/devlog/${post.slug}</link><guid>${base}/devlog/${post.slug}</guid><description>${escapeXml(post.dek)}</description><pubDate>${new Date(post.date.replace(/(\d{2}) ([A-Z]{3}) (\d{4})/, "$1 $2 $3")).toUTCString()}</pubDate></item>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>VEO ZAVOD — Development Signal</title><link>${base}</link><description>Production notes from an original psychological horror game.</description><language>en</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}

function escapeXml(value: string) { return value.replace(/[<>&'\"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", "\"": "&quot;" })[char] || char); }
