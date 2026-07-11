import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = { title: "About", description: "About VEO ZAVOD and the development archive." };

export default function AboutPage() {
  return (
    <main className="about-page inner-page">
      <header className="about-hero section-shell">
        <div><p className="section-kicker"><span /> About the work</p><h1>A GAME ABOUT<br /><em>WHAT REMAINS<br />NORMAL.</em></h1></div>
        <div className="about-intro"><p>VEO ZAVOD is an original psychological horror game set in inland Croatia. There are no supernatural monsters to excuse what the town has learned to tolerate.</p><span>INDEPENDENT / IN DEVELOPMENT / ZAGREB</span></div>
      </header>
      <section className="about-image"><Image src="/images/prudina-bus-stop.png" alt="The road into Prudina" fill sizes="100vw" /><span>PRUDINA / APPROACH ROAD / WINTER BUILD</span></section>
      <section className="about-body section-shell">
        <div className="about-number">01</div>
        <div><p className="section-kicker"><span /> The premise</p><h2>A place does not need to be unreal to become impossible.</h2></div>
        <div className="about-prose"><p>The game follows a return to Prudina after a family death. The route crosses a roadside motel, a municipal water problem, a dying local radio station and people who have made survival look like agreement.</p><p>Choices are ordinary actions with social weight. Deliver a bottle. Return a key. Repeat a sentence. Consequences travel through rooms, broadcasts and what characters decide you must have meant.</p></div>
      </section>
      <section className="principles section-shell">
        <div className="principle"><span>01 / REALITY</span><h3>Every fear has a source.</h3><p>Machines make sounds because parts move. Institutions become frightening because people keep them functioning.</p></div>
        <div className="principle"><span>02 / CHOICE</span><h3>No morality meter.</h3><p>The game remembers access, timing, language and witnesses. It does not flatten them into good and evil points.</p></div>
        <div className="principle"><span>03 / FORM</span><h3>PSX as memory, not costume.</h3><p>Low geometry and unstable texture are used to withhold certainty, while light and performance remain emotionally precise.</p></div>
      </section>
      <section className="creator-note section-shell"><div><span>CREATOR NOTE / KARLO</span><h2>The archive is part of the game.</h2></div><p>I wanted development to leave the same kind of evidence as the story. Finished work changes the public site. Failed approaches remain named. I can also write about life here without pretending every difficult week was secretly content strategy.</p><Link href="/devlog" className="line-link">Read the production record <ArrowRight size={14} /></Link></section>
      <SiteFooter />
    </main>
  );
}
