"use client";

import { useEffect, useRef } from "react";

type Particle = { x: number; y: number; r: number; speed: number; alpha: number; drift: number };

export function Atmosphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const cursor = cursorRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const particles: Particle[] = [];
    let frame = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
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
      if (!cursor || !finePointer) return;
      cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      cursor.dataset.visible = "true";
      const target = event.target as HTMLElement;
      cursor.dataset.hover = target.closest("a, button, input, textarea, select, [role='button']") ? "true" : "false";
    };

    const hideCursor = () => {
      if (cursor) cursor.dataset.visible = "false";
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", moveCursor, { passive: true });
    document.documentElement.addEventListener("mouseleave", hideCursor);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", moveCursor);
      document.documentElement.removeEventListener("mouseleave", hideCursor);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="atmosphere-canvas" aria-hidden="true" />
      <div ref={cursorRef} className="signal-cursor" aria-hidden="true"><span /></div>
    </>
  );
}
