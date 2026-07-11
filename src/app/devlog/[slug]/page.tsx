import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Share2 } from "lucide-react";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { devlogs, findPost } from "@/lib/content";

export function generateStaticParams() {
  return devlogs.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) return { title: "Transmission not found" };
  return { title: post.title, description: post.dek, openGraph: { images: [post.image] } };
}

export default async function DevlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) notFound();
  const index = devlogs.findIndex((candidate) => candidate.slug === post.slug);
  const next = devlogs[(index + 1) % devlogs.length];

  return (
    <main className="article-page">
      <header className="article-header section-shell">
        <Link href="/devlog" className="back-link"><ArrowLeft size={14} /> All development logs</Link>
        <div className="log-meta"><span>{post.number}</span><span>{post.category}</span><span>{post.date}</span><span>{post.readTime}</span></div>
        <h1>{post.title}</h1>
        <p>{post.dek}</p>
      </header>
      <div className="article-cover">
        <Image src={post.image} alt="" fill priority sizes="100vw" />
        <span>PRODUCTION CAPTURE / BUILD 0.4.7</span>
      </div>
      <article className="article-body section-shell">
        <aside className="article-rail"><span>TRANSMISSION {post.number.replace("LOG ", "")}</span><button><Share2 size={14} /> Share</button></aside>
        <div className="article-prose">
          {post.body.map((section, sectionIndex) => (
            <section key={sectionIndex}>
              {section.heading && <h2>{section.heading}</h2>}
              {section.paragraphs.map((paragraph, paragraphIndex) => <p className={sectionIndex === 0 && paragraphIndex === 0 ? "dropcap" : ""} key={paragraph}>{paragraph}</p>)}
            </section>
          ))}
          <div className="article-rule"><span /> END OF RECEIVED SIGNAL <span /></div>
        </div>
      </article>
      <Link href={`/devlog/${next.slug}`} className="next-record">
        <span>NEXT TRANSMISSION / {next.number}</span><strong>{next.title}</strong><ArrowRight size={23} />
      </Link>
      <SiteFooter />
    </main>
  );
}
