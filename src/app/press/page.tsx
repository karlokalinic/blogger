import type { Metadata } from "next";
import Image from "next/image";
import { Download } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = { title: "Press Kit", description: "VEO ZAVOD facts, images and contact information." };

export default function PressPage() {
  return (
    <main className="press-page inner-page">
      <header className="inner-hero section-shell"><div><p className="section-kicker"><span /> Press / creators / curators</p><h1>PRESS<br /><em>KIT</em></h1></div><div className="inner-hero-copy"><p>Short facts, approved images and language that can be copied without inventing a different game.</p><div className="archive-stat-line"><span>UPDATED 11 JUL 2026</span><span>BUILD 0.4.7</span></div></div></header>
      <section className="press-facts section-shell"><h2>One sentence</h2><p>VEO ZAVOD is an original PSX-styled psychological horror RPG about ordinary choices, institutional memory and returning to a winter town in inland Croatia.</p><div className="fact-grid"><div><span>DEVELOPER</span><strong>Karlo / independent</strong></div><div><span>LOCATION</span><strong>Zagreb, Croatia</strong></div><div><span>GENRE</span><strong>Psychological horror RPG</strong></div><div><span>PLATFORMS</span><strong>PC / to be confirmed</strong></div><div><span>STATUS</span><strong>Pre-production</strong></div><div><span>LANGUAGES</span><strong>Croatian / English planned</strong></div></div></section>
      <section className="press-images section-shell"><div className="section-heading compact"><div><p className="section-kicker"><span /> Approved stills</p><h2>Production images</h2></div></div><div className="press-image-grid">{[["/images/prudina-bus-stop.png", "Prudina approach"], ["/images/motel-bijeli-jelen.png", "Motel Bijeli Jelen"], ["/images/branimir.png", "Branimir Vukelić"], ["/images/municipal-evidence.png", "Municipal evidence"]].map(([src, label]) => <article key={src}><div><Image src={src} alt={label} fill sizes="(max-width: 800px) 100vw, 50vw" /></div><span>{label}</span><a href={src} download><Download size={13} /> Original PNG</a></article>)}</div></section>
      <section className="press-contact section-shell"><span>CONTACT</span><h2>For thoughtful coverage, collaboration or festival questions.</h2><p>Contact details can be added in Studio → Project settings before public outreach begins.</p></section>
      <SiteFooter />
    </main>
  );
}
