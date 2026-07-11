import Link from "next/link";
import { Rss } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-top section-shell">
        <div>
          <span className="footer-sigil">VZ</span>
          <h2>Follow the signal<br />before it clears.</h2>
        </div>
        <div className="footer-note">
          <p>One substantial development note each month. Smaller evidence whenever the build earns it. No manufactured countdowns.</p>
          <div className="follow-actions">
            <Link href="/feed.xml" className="primary-button light-button"><Rss size={14} /> RSS feed</Link>
            <Link href="/press" className="text-button light-text">Press kit <span>↗</span></Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom section-shell">
        <span>© 2026 KARLO LEGEND / INDEPENDENT DEVELOPMENT</span>
        <div><Link href="/accessibility">Accessibility</Link><Link href="/privacy">Privacy</Link><Link href="/studio">Studio</Link></div>
        <span>MADE IN ZAGREB / SIGNAL FROM PRUDINA</span>
      </div>
    </footer>
  );
}
