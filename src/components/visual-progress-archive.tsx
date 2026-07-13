"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, MapPinned, Radio, Users } from "lucide-react";
import { useState } from "react";
import type { VisualChapter, VisualRecord } from "@/lib/visual-progress";

type VisualProgressArchiveProps = {
  chapters: VisualChapter[];
  locations: VisualRecord[];
  npcs: VisualRecord[];
};

export function VisualProgressArchive({ chapters, locations, npcs }: VisualProgressArchiveProps) {
  const [chapterIndex, setChapterIndex] = useState(0);
  const [frameIndex, setFrameIndex] = useState(0);
  const chapter = chapters[chapterIndex];
  const frame = chapter.frames[frameIndex];

  const previousFrame = () => setFrameIndex((current) => (current - 1 + chapter.frames.length) % chapter.frames.length);
  const nextFrame = () => setFrameIndex((current) => (current + 1) % chapter.frames.length);

  return (
    <>
      <nav className="chapter-switcher section-shell" aria-label="Visual chapter progression">
        {chapters.map((item, index) => (
          <button
            type="button"
            className={index === chapterIndex ? "active" : ""}
            aria-pressed={index === chapterIndex}
            onClick={() => {
              setChapterIndex(index);
              setFrameIndex(0);
            }}
            key={item.id}
          >
            <span>{item.number}</span>
            <div><strong>{item.title}</strong><small>{item.progress}% COMPLETE</small></div>
            <i><b style={{ width: `${item.progress}%` }} /></i>
          </button>
        ))}
      </nav>

      <section className="chapter-stage section-shell" aria-live="polite">
        <div className="chapter-stage-image" key={`${chapter.id}-${frameIndex}`}>
          <Image src={frame.src} alt={frame.alt} fill priority sizes="(max-width: 900px) 100vw, 70vw" />
          <div className="chapter-stage-overlay" />
          <span className={`frame-status ${frame.status}`}>{frame.status} / {frame.label}</span>
          <div className="chapter-stage-copy">
            <p>{chapter.number} / {chapter.phase}</p>
            <h2>{chapter.title}</h2>
            <span>{chapter.subtitle}</span>
          </div>
          <div className="frame-navigation">
            <button type="button" onClick={previousFrame} aria-label="Previous chapter frame"><ArrowLeft size={16} /></button>
            <span>{String(frameIndex + 1).padStart(2, "0")} / {String(chapter.frames.length).padStart(2, "0")}</span>
            <button type="button" onClick={nextFrame} aria-label="Next chapter frame"><ArrowRight size={16} /></button>
          </div>
        </div>
        <div className="chapter-frame-note">
          <div><span>CURRENT FRAME</span><strong>{frame.caption}</strong></div>
          <div><span>PLAYABLE LENGTH</span><strong>{chapter.playable}</strong></div>
          <div><span>CHAPTER SIGNAL</span><strong>{chapter.progress}%</strong></div>
        </div>
        <div className="frame-strip" aria-label={`${chapter.title} frames`}>
          {chapter.frames.map((item, index) => (
            <button type="button" className={index === frameIndex ? "active" : ""} aria-pressed={index === frameIndex} onClick={() => setFrameIndex(index)} key={item.label}>
              <span><Image src={item.src} alt="" fill sizes="140px" /></span>
              <small>{item.label}</small>
            </button>
          ))}
        </div>
      </section>

      <RecordGrid
        eyebrow="Location progression"
        title="Every place gets a before, a target and a truth."
        icon={<MapPinned size={18} />}
        records={locations}
        className="location-progress"
      />
      <RecordGrid
        eyebrow="People under pressure"
        title="Every character enters already in crisis."
        icon={<Users size={18} />}
        records={npcs}
        className="npc-progress"
      />
    </>
  );
}

type RecordGridProps = {
  eyebrow: string;
  title: string;
  icon: React.ReactNode;
  records: VisualRecord[];
  className: string;
};

function RecordGrid({ eyebrow, title, icon, records, className }: RecordGridProps) {
  return (
    <section className={`visual-record-section section-shell ${className}`}>
      <header className="visual-record-heading reveal-block">
        <div><p className="section-kicker"><span /> {eyebrow}</p><h2>{title}</h2></div>
        <span>{icon}<Radio size={14} /> {records.length} LIVE RECORDS</span>
      </header>
      <div className="visual-record-grid">
        {records.map((record, index) => (
          <article className="visual-record-card reveal-block" key={record.id}>
            <div className="visual-record-image">
              <Image src={record.image} alt={record.alt} fill sizes="(max-width: 650px) 100vw, (max-width: 1000px) 50vw, 33vw" />
              <span>{String(index + 1).padStart(2, "0")}</span>
              <small>{record.kind}</small>
            </div>
            <div className="visual-record-copy"><h3>{record.name}</h3><p>{record.note}</p></div>
            <div className="visual-record-progress"><i><b style={{ width: `${record.progress}%` }} /></i><span>{record.progress}%</span></div>
          </article>
        ))}
      </div>
    </section>
  );
}
