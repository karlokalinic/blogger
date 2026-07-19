"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  AudioLines,
  BookOpenText,
  Boxes,
  ChevronLeft,
  CircleHelp,
  FileText,
  Gauge,
  Gamepad2,
  LayoutDashboard,
  Menu,
  Network,
  PanelLeftClose,
  Radio,
  Settings,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import { useState } from "react";
import { SoundToggle } from "@/components/sound-toggle";

const sections = [
  {
    label: "PRODUCTION",
    links: [
      ["/studio", "Overview", LayoutDashboard],
      ["/studio/write", "Writing desk", BookOpenText],
      ["/studio/catalogue", "Record wizard", Archive],
      ["/studio/progress", "Progress board", Gauge],
    ],
  },
  {
    label: "ASSETS & WORLD",
    links: [
      ["/studio/media", "Media vault + 3D", UploadCloud],
      ["/studio/whiteboard", "World whiteboard", Network],
      ["/merge-game", "Svi za stolom", Gamepad2],
      ["/studio/check-in", "Private check-in", Sparkles],
    ],
  },
] as const;

export function StudioShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={collapsed ? "studio-shell sidebar-collapsed" : "studio-shell"}>
      <aside className={mobileOpen ? "studio-sidebar mobile-open" : "studio-sidebar"}>
        <div className="studio-brand">
          <Link href="/studio"><span><Radio size={15} /></span><strong>VEO ZAVOD<small>CREATOR STUDIO</small></strong></Link>
          <button onClick={() => setMobileOpen(false)} className="mobile-sidebar-close" aria-label="Close studio menu"><X size={17} /></button>
        </div>
        <div className="studio-project-card">
          <div className="project-thumb" />
          <div><span>ACTIVE PROJECT</span><strong>VEO ZAVOD</strong><small>Build 0.4.7</small></div>
          <button title="Switch project">⌄</button>
        </div>
        <nav className="studio-nav" aria-label="Studio navigation">
          {sections.map((section) => (
            <div key={section.label}>
              <span className="studio-nav-label">{section.label}</span>
              {section.links.map(([href, label, Icon]) => {
                const active = pathname === href;
                return <Link href={href} key={href} className={active ? "active" : ""} title={collapsed ? label : undefined} onClick={() => setMobileOpen(false)}><Icon size={16} /><span>{label}</span>{active && <i />}</Link>;
              })}
            </div>
          ))}
        </nav>
        <div className="studio-sidebar-bottom">
          <Link href="/studio/settings"><Settings size={16} /><span>Project settings</span></Link>
          <Link href="/help"><CircleHelp size={16} /><span>Guided help</span></Link>
          <Link href="/" className="back-to-site"><ChevronLeft size={16} /><span>View public site</span></Link>
        </div>
        <button className="collapse-sidebar" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}><PanelLeftClose size={15} /></button>
      </aside>

      <div className="studio-main">
        <header className="studio-topbar">
          <button className="studio-mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open studio menu"><Menu size={18} /></button>
          <div className="studio-breadcrumb"><span>STUDIO</span><i>/</i><strong>{pageLabel(pathname)}</strong></div>
          <div className="studio-health"><i /> <span>LOCAL DRAFTS SAFE</span></div>
          <div className="studio-top-actions">
            <button title="Command palette"><span>⌘</span> K</button>
            <SoundToggle />
            <div className="studio-avatar">KK</div>
          </div>
        </header>
        <div className="studio-content">{children}</div>
      </div>
    </div>
  );
}

function pageLabel(pathname: string) {
  if (pathname === "/studio") return "OVERVIEW";
  return pathname.split("/").pop()?.replaceAll("-", " ").toUpperCase() || "OVERVIEW";
}

export const studioIcons = { AudioLines, Boxes, FileText };
