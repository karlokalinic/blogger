"use client";

import { useEffect, useRef } from "react";

type Particle = { x: number; y: number; r: number; speed: number; alpha: number; drift: number };

export function Atmosphere({ particles: showParticles = true }: { particles?: boolean } = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const cursor = cursorRef.current;
    if (!cursor) return;
    const ctx = showParticles && canvas ? canvas.getContext("2d") : null;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const particles: Particle[] = [];
    let frame = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      if (!canvas || !ctx) return;
      width = window.innerWidth;
      height = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      particles.length = 0;
      const amount = Math.min(80, Math.round((width * height) / 26000));
      for (let index = 0; index < amount; index += 1) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.2 + 0.15,
          speed: Math.random() * 0.1 + 0.015,
          alpha: Math.random() * 0.16 + 0.025,
          drift: Math.random() * 0.08 - 0.04,
        });
      }
    };

    const draw = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      for (const particle of particles) {
        particle.y -= particle.speed;
        particle.x += particle.drift;
        if (particle.y < -4) particle.y = height + 4;
        if (particle.x < -4) particle.x = width + 4;
        if (particle.x > width + 4) particle.x = -4;
        ctx.beginPath();
        ctx.fillStyle = `rgba(221, 226, 218, ${particle.alpha})`;
        ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduced) frame = window.requestAnimationFrame(draw);
    };

    const moveCursor = (event: PointerEvent) => {
      if (!finePointer) return;
      cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      cursor.dataset.visible = "true";
      const target = event.target instanceof Element ? event.target : document.elementFromPoint(event.clientX, event.clientY);
      cursor.dataset.hover = target?.closest("a, button, select, [role='button'], .wb-link-label, .merge-tile") ? "true" : "false";
      cursor.dataset.text = target?.closest("input, textarea, [contenteditable='true'], .wb-text-editor") ? "true" : "false";
      cursor.dataset.drag = target?.closest(".wb-viewport.tool-pan, .wb-element, .wb-resize, .board-frame, .merge-tile, .character-model-stage canvas") ? "true" : "false";
    };

    const hideCursor = () => {
      cursor.dataset.visible = "false";
      cursor.dataset.down = "false";
    };

    const setDown = () => {
      if (finePointer) cursor.dataset.down = "true";
    };

    const clearDown = () => {
      cursor.dataset.down = "false";
    };

    const cursorHome = cursor.parentElement;
    const syncFullscreenHost = () => {
      const host = document.fullscreenElement ?? cursorHome;
      if (host && cursor.parentElement !== host) host.appendChild(cursor);
    };

    if (ctx) {
      resize();
      draw();
      window.addEventListener("resize", resize);
    }
    window.addEventListener("pointermove", moveCursor, { passive: true });
    window.addEventListener("pointerdown", setDown, { passive: true });
    window.addEventListener("pointerup", clearDown, { passive: true });
    window.addEventListener("pointercancel", clearDown, { passive: true });
    window.addEventListener("blur", hideCursor);
    document.addEventListener("fullscreenchange", syncFullscreenHost);
    document.documentElement.addEventListener("mouseleave", hideCursor);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", moveCursor);
      window.removeEventListener("pointerdown", setDown);
      window.removeEventListener("pointerup", clearDown);
      window.removeEventListener("pointercancel", clearDown);
      window.removeEventListener("blur", hideCursor);
      document.removeEventListener("fullscreenchange", syncFullscreenHost);
      document.documentElement.removeEventListener("mouseleave", hideCursor);
      if (cursorHome && cursor.parentElement !== cursorHome) cursorHome.appendChild(cursor);
    };
  }, [showParticles]);

  return (
    <>
      {showParticles && <canvas ref={canvasRef} className="atmosphere-canvas" aria-hidden="true" />}
      <div ref={cursorRef} className="signal-cursor" aria-hidden="true"><span /></div>
    </>
  );
}
