"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function blip(context: AudioContext, frequency: number, duration: number, volume: number) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(frequency, context.currentTime);
  gain.gain.setValueAtTime(volume, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}

export function SoundToggle() {
  const [enabled, setEnabled] = useState(false);
  const contextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setEnabled(window.localStorage.getItem("veo-sfx") === "on"));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const click = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("a, button, [role='button']")) return;
      const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
      if (!contextRef.current) contextRef.current = new AudioContextConstructor();
      blip(contextRef.current, 94, 0.045, 0.025);
    };
    document.addEventListener("click", click);
    return () => document.removeEventListener("click", click);
  }, [enabled]);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    window.localStorage.setItem("veo-sfx", next ? "on" : "off");
    if (next) {
      const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
      if (!contextRef.current) contextRef.current = new AudioContextConstructor();
      blip(contextRef.current, 138, 0.07, 0.025);
    }
  };

  return (
    <button className="icon-button sound-toggle" onClick={toggle} aria-pressed={enabled} title="Interface sound">
      {enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
      <span className="sr-only">{enabled ? "Disable interface sound" : "Enable interface sound"}</span>
    </button>
  );
}

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}
