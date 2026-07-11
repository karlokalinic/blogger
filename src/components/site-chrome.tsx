"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Radio, X } from "lucide-react";
import { useState } from "react";
import { Atmosphere } from "./atmosphere";
import { SignalAudioDock } from "./signal-audio-dock";
import { SoundToggle } from "./sound-toggle";

const links = [
  ["/", "Signal"],
  ["/archive", "World archive"],
  ["/devlog", "Devlog"],
  ["/about", "About"],
] as const;

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const inStudio = pathname.startsWith("/studio");

  return (
    <div className={inStudio ? "site-shell is-studio" : "site-shell"}>
      <Atmosphere />
      <div className="noise-layer" aria-hidden="true" />
      {!inStudio && (
        <header className="site-header">
          <Link href="/" className="wordmark" aria-label="VEO ZAVOD home">
            <span className="wordmark-sigil" aria-hidden="true"><Radio size={15} /></span>
            <span>VEO ZAVOD</span>
            <small>DEV ARCHIVE / 97.4</small>
          </Link>

          <nav className={open ? "main-nav is-open" : "main-nav"} aria-label="Primary navigation">
            {links.map(([href, label], index) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={pathname === href || (href !== "/" && pathname.startsWith(href)) ? "active" : ""}
              >
                <span>0{index + 1}</span>{label}
              </Link>
            ))}
            <Link href="/studio" className="studio-entry" onClick={() => setOpen(false)}>Enter studio <span>↗</span></Link>
          </nav>

          <div className="header-tools">
            <SoundToggle />
            <button
              className="icon-button mobile-menu-button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </header>
      )}
      <div id="main-content">{children}</div>
      {!inStudio && <SignalAudioDock />}
    </div>
  );
}
