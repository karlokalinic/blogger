import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return <main className="legal-page inner-page"><section className="section-shell"><p className="section-kicker"><span /> Privacy / plain language</p><h1>Your drafts are not raw material.</h1><div className="legal-copy"><h2>Public visitors</h2><p>This template uses no advertising trackers, fingerprinting or third-party analytics. Standard hosting logs may temporarily contain request metadata required to operate and protect the site.</p><h2>Creator studio</h2><p>Without cloud connections, drafts, progress, whiteboard notes and media remain in this browser using local storage or IndexedDB. Clearing browser data removes them. They are not cross-device backups.</p><h2>Connected storage</h2><p>When database and media integrations are enabled, owner-authorized records and uploads are sent only to the configured project storage. Secrets remain server-side. The private check-in is never automatically saved and never sent to an AI service.</p></div></section><SiteFooter /></main>;
}
