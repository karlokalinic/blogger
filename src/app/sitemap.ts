import type { MetadataRoute } from "next";
import { archiveEntries, devlogs } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://karlolegendblog.vercel.app";
  const staticRoutes = ["", "/archive", "/devlog", "/about", "/press", "/accessibility", "/privacy"];
  return [
    ...staticRoutes.map((route) => ({ url: `${base}${route}`, lastModified: new Date(), changeFrequency: route === "" ? "weekly" as const : "monthly" as const, priority: route === "" ? 1 : 0.7 })),
    ...archiveEntries.map((entry) => ({ url: `${base}/archive/${entry.slug}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.65 })),
    ...devlogs.map((post) => ({ url: `${base}/devlog/${post.slug}`, lastModified: new Date(post.date), changeFrequency: "yearly" as const, priority: 0.6 })),
  ];
}
