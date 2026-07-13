"use client";

import { useEffect } from "react";

export function RevealObserver() {
  useEffect(() => {
    const blocks = new Set<HTMLElement>();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;

    const reveal = (block: HTMLElement) => {
      block.classList.add("is-visible");
      blocks.delete(block);
      observer?.unobserve(block);
    };

    const observer = reducedMotion ? null : new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          reveal(entry.target as HTMLElement);
        });
      },
      { rootMargin: "0px 0px -8%", threshold: 0.12 },
    );

    const collect = () => {
      document.querySelectorAll<HTMLElement>(".reveal-block:not(.is-visible)").forEach((block) => {
        if (reducedMotion) {
          reveal(block);
          return;
        }
        if (blocks.has(block)) return;
        blocks.add(block);
        observer?.observe(block);
      });
    };

    const revealInView = () => {
      collect();
      if (!reducedMotion) {
        const revealLine = window.innerHeight * 0.94;
        blocks.forEach((block) => {
          const bounds = block.getBoundingClientRect();
          if (bounds.top < revealLine && bounds.bottom > 0) reveal(block);
        });
      }
      frame = 0;
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(revealInView);
    };

    const mutations = new MutationObserver(schedule);
    mutations.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      mutations.disconnect();
      observer?.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return null;
}
