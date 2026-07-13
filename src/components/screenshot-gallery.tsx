"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { DevlogShot } from "@/lib/types";

type ScreenshotGalleryProps = {
  shots: DevlogShot[];
  title: string;
};

export function ScreenshotGallery({ shots, title }: ScreenshotGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (activeIndex === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveIndex(null);
      if (event.key === "ArrowRight") setActiveIndex((current) => current === null ? 0 : (current + 1) % shots.length);
      if (event.key === "ArrowLeft") setActiveIndex((current) => current === null ? 0 : (current - 1 + shots.length) % shots.length);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, shots.length]);

  const showPrevious = () => setActiveIndex((current) => current === null ? 0 : (current - 1 + shots.length) % shots.length);
  const showNext = () => setActiveIndex((current) => current === null ? 0 : (current + 1) % shots.length);
  const activeShot = activeIndex === null ? null : shots[activeIndex];

  return (
    <section className="capture-section" aria-labelledby="capture-heading">
      <div className="capture-heading section-shell reveal-block">
        <div>
          <p className="section-kicker"><span /> Visual evidence</p>
          <h2 id="capture-heading">Captured from the work.</h2>
        </div>
        <p>Concept captures and prototype frames are labeled honestly. Open any image for the full composition and production note.</p>
      </div>
      <div className={`capture-grid section-shell capture-count-${Math.min(shots.length, 4)}`}>
        {shots.map((shot, index) => (
          <figure className="capture-card reveal-block" key={`${shot.src}-${shot.label}`}>
            <button type="button" onClick={() => setActiveIndex(index)} aria-label={`Open ${shot.label}: ${shot.alt}`}>
              <Image
                src={shot.src}
                alt={shot.alt}
                fill
                sizes={index === 0 ? "(max-width: 800px) 100vw, 65vw" : "(max-width: 800px) 100vw, 32vw"}
                style={{ objectPosition: shot.position ?? "center" }}
              />
              <span className="capture-scan" aria-hidden="true" />
              <span className="capture-label">{shot.label}</span>
              <span className="capture-expand"><Expand size={14} /> OPEN FRAME</span>
            </button>
            <figcaption>{shot.caption}</figcaption>
          </figure>
        ))}
      </div>

      {activeShot && (
        <div
          className="capture-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${title}: ${activeShot.label}`}
          onClick={(event) => {
            if (event.currentTarget === event.target) setActiveIndex(null);
          }}
        >
          <button type="button" className="lightbox-close" onClick={() => setActiveIndex(null)} aria-label="Close image viewer" autoFocus><X size={20} /></button>
          <button type="button" className="lightbox-arrow previous" onClick={showPrevious} aria-label="Previous capture"><ChevronLeft size={25} /></button>
          <div className="lightbox-frame">
            <div className="lightbox-image">
              <Image src={activeShot.src} alt={activeShot.alt} fill priority sizes="96vw" style={{ objectFit: "contain" }} />
            </div>
            <div className="lightbox-caption"><span>{activeShot.label}</span><p>{activeShot.caption}</p></div>
          </div>
          <button type="button" className="lightbox-arrow next" onClick={showNext} aria-label="Next capture"><ChevronRight size={25} /></button>
        </div>
      )}
    </section>
  );
}
