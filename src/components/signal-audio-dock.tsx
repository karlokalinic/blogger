"use client";

import { AudioLines, Pause, Play, SkipBack, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function SignalAudioDock() {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(32);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: "Prudina Room Tone — Prototype",
      artist: "VEO ZAVOD",
      album: "Development Signal 0.4.7",
      artwork: [{ src: "/images/prudina-bus-stop.png", sizes: "1915x829", type: "image/png" }],
    });
    navigator.mediaSession.setActionHandler("play", () => void audioRef.current?.play());
    navigator.mediaSession.setActionHandler("pause", () => audioRef.current?.pause());
    navigator.mediaSession.setActionHandler("seekbackward", () => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10); });
    navigator.mediaSession.setActionHandler("seekforward", () => { if (audioRef.current) audioRef.current.currentTime = Math.min(audioRef.current.duration || 32, audioRef.current.currentTime + 10); });
  }, []);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) await audio.play();
    else audio.pause();
  };

  return (
    <>
      <audio
        ref={audioRef}
        src="/audio/prudina-room-tone.m4a"
        loop
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 32)}
      />
      {!open ? (
        <button className="signal-tab" onClick={() => setOpen(true)}>
          <span className="live-dot" />
          <AudioLines size={15} />
          <span>97.4 / PROJECT SIGNAL</span>
        </button>
      ) : (
        <aside className="audio-dock" aria-label="Project audio player">
          <button className="audio-play" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
            {playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
          </button>
          <div className="audio-meta">
            <span>NOW TRANSMITTING</span>
            <strong>Prudina Room Tone — Prototype</strong>
          </div>
          <div className="audio-wave" aria-hidden="true">
            {Array.from({ length: 38 }, (_, index) => (
              <i key={index} style={{ height: `${18 + ((index * 17) % 72)}%`, opacity: index / 38 < time / duration ? 1 : 0.25 }} />
            ))}
          </div>
          <span className="audio-time">{formatTime(time)} / {formatTime(duration)}</span>
          <button className="audio-skip" aria-label="Restart track" onClick={() => { if (audioRef.current) audioRef.current.currentTime = 0; }}><SkipBack size={15} /></button>
          <button className="audio-close" onClick={() => setOpen(false)} aria-label="Close player"><X size={15} /></button>
        </aside>
      )}
    </>
  );
}

function formatTime(value: number) {
  return `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, "0")}`;
}
