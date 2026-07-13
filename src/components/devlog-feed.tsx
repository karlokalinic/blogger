"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Images, Radio } from "lucide-react";
import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { DevlogPost } from "@/lib/types";

type DevlogFeedProps = {
  posts: DevlogPost[];
};

export function DevlogFeed({ posts }: DevlogFeedProps) {
  const [category, setCategory] = useState("ALL");
  const categories = useMemo(() => ["ALL", ...Array.from(new Set(posts.map((post) => post.category)))], [posts]);
  const visiblePosts = useMemo(
    () => category === "ALL" ? posts : posts.filter((post) => post.category === category),
    [category, posts],
  );

  return (
    <>
      <div className="devlog-filter section-shell" aria-label="Filter development logs">
        <div className="devlog-filter-intro"><Radio size={14} /><span>FILTER TRANSMISSIONS</span></div>
        <div className="devlog-filter-list" role="toolbar" aria-label="Development log categories">
          {categories.map((item) => {
            const count = item === "ALL" ? posts.length : posts.filter((post) => post.category === item).length;
            return (
              <button
                type="button"
                className={category === item ? "active" : ""}
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
                key={item}
              >
                {item} <span>{String(count).padStart(2, "0")}</span>
              </button>
            );
          })}
        </div>
      </div>

      <section className="devlog-list section-shell" aria-live="polite">
        <p className="devlog-result-line"><strong>{String(visiblePosts.length).padStart(2, "0")}</strong> transmissions received</p>
        {visiblePosts.map((post, index) => (
          <article
            className="devlog-list-item devlog-feed-card"
            style={{ "--stagger": Math.min(index, 6) } as CSSProperties}
            key={post.slug}
          >
            <Link href={`/devlog/${post.slug}`} className="devlog-list-image image-distort">
              <Image
                src={post.image}
                alt={post.imageAlt}
                fill
                sizes="(max-width: 900px) 100vw, 42vw"
                style={{ objectPosition: post.gallery?.[0]?.position ?? "center" }}
              />
              <span>{String(index + 1).padStart(2, "0")}</span>
              {post.gallery && <small><Images size={12} /> {post.gallery.length} CAPTURES</small>}
            </Link>
            <div className="devlog-list-copy">
              <div className="log-meta"><span>{post.number}</span><span>{post.category}</span><span>{post.date}</span></div>
              <div className="devlog-build-line"><span>{post.status.replace("-", " ")}</span><span>BUILD {post.build}</span></div>
              <h2><Link href={`/devlog/${post.slug}`}>{post.title}</Link></h2>
              <p>{post.dek}</p>
              <Link href={`/devlog/${post.slug}`} className="line-link">Read transmission <ArrowRight size={14} /></Link>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
