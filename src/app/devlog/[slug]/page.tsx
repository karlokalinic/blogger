import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, FlaskConical, SquareTerminal } from "lucide-react";
import { notFound } from "next/navigation";
import { ArticleProgress } from "@/components/article-progress";
import { CharacterModelShowcase } from "@/components/character-model-showcase";
import { ScreenshotGallery } from "@/components/screenshot-gallery";
import { ShareButton } from "@/components/share-button";
import { SiteFooter } from "@/components/site-footer";
import { getDevlogPost, getDevlogPosts } from "@/lib/published-content";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getDevlogPost(slug);
  if (!post) return { title: "Transmission not found" };
  return { title: post.title, description: post.dek, openGraph: { images: [post.image] } };
}

export default async function DevlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const devlogs = await getDevlogPosts();
  const post = devlogs.find((candidate) => candidate.slug === slug) ?? await getDevlogPost(slug);
  if (!post) notFound();
  const index = devlogs.findIndex((candidate) => candidate.slug === post.slug);
  const next = devlogs[(index + 1) % devlogs.length];

  return (
    <main className="article-page">
      <ArticleProgress />
      <header className="article-header section-shell">
        <Link href="/devlog" className="back-link"><ArrowLeft size={14} /> All development logs</Link>
        <div className="log-meta"><span>{post.number}</span><span>{post.category}</span><span>{post.date}</span><span>{post.readTime}</span><span>BUILD {post.build}</span></div>
        <h1>{post.title}</h1>
        <p>{post.dek}</p>
        <div className="article-status"><i /> {post.status.replace("-", " ")} / documented {post.date.toLowerCase()}</div>
      </header>
      {post.headerImage && (
        <div className="article-header-photo">
          <Image src={post.headerImage} alt={`${post.title} header image`} fill priority sizes="100vw" style={{ objectPosition: post.headerPosition ?? "50% 50%" }} />
        </div>
      )}
      <div className="article-cover">
        <Image src={post.image} alt={post.imageAlt} fill priority sizes="100vw" style={{ objectPosition: post.coverPosition ?? "50% 50%" }} />
        <span>{post.captureLabel ?? `PRODUCTION CAPTURE / BUILD ${post.build}`}</span>
      </div>
      {post.model && <CharacterModelShowcase model={post.model.url} pack={post.model.pack} obj={post.model.obj} name={post.model.name} />}
      {post.gallery && <ScreenshotGallery shots={post.gallery} title={post.title} />}
      {post.facts && (
        <section className="production-facts section-shell" aria-label="Build facts">
          {post.facts.map((fact) => <div key={fact.label}><span>{fact.label}</span><strong>{fact.value}</strong></div>)}
        </section>
      )}
      <article className="article-body section-shell">
        <aside className="article-rail"><span>TRANSMISSION {post.number.replace("LOG ", "")}</span><span>BUILD {post.build}</span><ShareButton title={post.title} /></aside>
        <div className="article-prose">
          {post.body.map((section, sectionIndex) => (
            <section key={section.heading ?? `opening-${sectionIndex}`}>
              {section.heading && <h2>{section.heading}</h2>}
              {section.paragraphs.map((paragraph, paragraphIndex) => renderArticleBlock(paragraph, sectionIndex, paragraphIndex))}
            </section>
          ))}
          {post.code && (
            <section className="article-code-block">
              <div><span><SquareTerminal size={14} /> {post.code.filename}</span><small>{post.code.language}</small></div>
              <pre><code>{post.code.snippet}</code></pre>
            </section>
          )}
          {post.tryIt && (
            <section className="try-build">
              <div className="try-build-heading"><FlaskConical size={18} /><span>RUN THIS ROUTE</span></div>
              <h2>Try it. Break it. Write down where.</h2>
              <ol>
                {post.tryIt.map((step) => <li key={step}><CheckCircle2 size={16} /><span>{step}</span></li>)}
              </ol>
            </section>
          )}
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

function renderArticleBlock(paragraph: string, sectionIndex: number, paragraphIndex: number) {
  const image = paragraph.match(/^!\[(.*)\]\((.+)\)$/);
  if (image) {
    return (
      <figure className="article-inline-image" key={`${sectionIndex}-${paragraphIndex}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Markdown-authored body images can be local, blob-backed or remote. */}
        <img src={image[2]} alt={image[1]} />
        {image[1] && <figcaption>{image[1]}</figcaption>}
      </figure>
    );
  }
  return <p className={sectionIndex === 0 && paragraphIndex === 0 ? "dropcap" : ""} key={`${sectionIndex}-${paragraphIndex}`}>{paragraph}</p>;
}
