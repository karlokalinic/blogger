import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = { title: "Accessibility" };

export default function AccessibilityPage() {
  return <main className="legal-page inner-page"><section className="section-shell"><p className="section-kicker"><span /> Access statement</p><h1>Atmosphere should never become a barrier.</h1><div className="legal-copy"><h2>Current support</h2><p>The site supports keyboard navigation, visible focus states, semantic landmarks, reduced-motion preferences, alt text for meaningful images, labeled controls and responsive layouts. Interface sound is off by default. Decorative grain, particles and the custom pointer do not carry information.</p><h2>Studio tools</h2><p>The writing desk uses a standard textarea, the record wizard has explicit labels, and every visual status also includes text. The whiteboard is a spatial tool and is not yet fully equivalent for keyboard-only use; exported JSON preserves its text content.</p><h2>Report a problem</h2><p>Contact details will be published before outreach begins. Until then, the project is in active pre-production and accessibility bugs are tracked as production issues, not optional polish.</p></div></section><SiteFooter /></main>;
}
