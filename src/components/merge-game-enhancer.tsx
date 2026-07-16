"use client";

import { useEffect } from "react";

type ActionKind = "pickup" | "drop" | "merge" | "progress" | "button" | "complete" | "error";

type GameSnapshot = {
  resources: string;
  progress: number;
  tileCount: number;
  maxLevel: number;
  toast: string;
};

function createCasinoAudio() {
  let context: AudioContext | null = null;
  let masterGain: GainNode | null = null;
  let musicGain: GainNode | null = null;
  let sfxGain: GainNode | null = null;
  let ambienceGain: GainNode | null = null;
  let musicTimer: number | null = null;
  let step = 0;
  let muted = false;
  const ambientSources: AudioScheduledSourceNode[] = [];

  const setup = () => {
    if (context) return context;
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) return null;

    context = new AudioContextConstructor();
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -22;
    compressor.knee.value = 18;
    compressor.ratio.value = 7;
    compressor.attack.value = 0.006;
    compressor.release.value = 0.18;

    masterGain = context.createGain();
    masterGain.gain.value = muted ? 0 : 0.34;
    musicGain = context.createGain();
    musicGain.gain.value = 0.42;
    sfxGain = context.createGain();
    sfxGain.gain.value = 0.72;
    ambienceGain = context.createGain();
    ambienceGain.gain.value = 0.34;

    musicGain.connect(masterGain);
    sfxGain.connect(masterGain);
    ambienceGain.connect(masterGain);
    masterGain.connect(compressor);
    compressor.connect(context.destination);

    const hum = context.createOscillator();
    const humGain = context.createGain();
    hum.type = "sine";
    hum.frequency.value = 64;
    humGain.gain.value = 0.022;
    hum.connect(humGain);
    humGain.connect(ambienceGain);
    hum.start();
    ambientSources.push(hum);

    const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) data[index] = (Math.random() * 2 - 1) * 0.18;
    const noise = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const noiseGain = context.createGain();
    noise.buffer = buffer;
    noise.loop = true;
    filter.type = "bandpass";
    filter.frequency.value = 920;
    filter.Q.value = 0.42;
    noiseGain.gain.value = 0.012;
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ambienceGain);
    noise.start();
    ambientSources.push(noise);

    return context;
  };

  const startMusic = () => {
    if (musicTimer !== null || muted) return;
    musicTimer = window.setInterval(() => {
      if (document.hidden || muted) return;
      const audio = setup();
      if (!audio || !musicGain) return;
      const scale = [392, 466.16, 523.25, 587.33, 698.46, 783.99, 932.33];
      const note = scale[(step * 2 + (step % 3)) % scale.length];
      tone(note, 0, 0.115, 0.018, "triangle", musicGain);
      if (step % 4 === 0) tone(note / 2, 0.015, 0.19, 0.012, "sine", musicGain);
      if (step % 8 === 6) sparkle(0.035, 3, 0.012);
      step += 1;
    }, 360);
  };

  const tone = (
    frequency: number,
    delay: number,
    duration: number,
    gainValue: number,
    type: OscillatorType = "sine",
    destination?: AudioNode | null,
  ) => {
    const audio = setup();
    if (!audio || muted) return;
    const output = destination ?? sfxGain;
    if (!output) return;
    const start = audio.currentTime + delay;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(output);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  };

  const noiseHit = (delay: number, duration: number, gainValue: number) => {
    const audio = setup();
    if (!audio || !sfxGain || muted) return;
    const buffer = audio.createBuffer(1, Math.max(1, Math.round(audio.sampleRate * duration)), audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
    const source = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    const start = audio.currentTime + delay;
    source.buffer = buffer;
    filter.type = "highpass";
    filter.frequency.value = 1500;
    gain.gain.setValueAtTime(gainValue, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGain);
    source.start(start);
  };

  const sparkle = (delay = 0, count = 4, gainValue = 0.028) => {
    for (let index = 0; index < count; index += 1) {
      tone(1180 + Math.random() * 780, delay + index * 0.024, 0.08, gainValue, "sine");
    }
    noiseHit(delay, 0.05, gainValue * 0.9);
  };

  const begin = () => {
    if (muted) return;
    const audio = setup();
    if (!audio) return;
    if (audio.state === "suspended") void audio.resume().catch(() => undefined);
    startMusic();
  };

  const play = (kind: ActionKind) => {
    if (muted) return;
    begin();
    if (kind === "pickup") {
      tone(420, 0, 0.055, 0.042, "triangle");
      sparkle(0.015, 2, 0.014);
    } else if (kind === "drop") {
      tone(190, 0, 0.09, 0.045, "sine");
      tone(760, 0.035, 0.06, 0.018, "triangle");
    } else if (kind === "merge") {
      [392, 523.25, 659.25, 987.77].forEach((frequency, index) => tone(frequency, index * 0.055, 0.14, 0.052, "triangle"));
      sparkle(0.08, 7, 0.026);
    } else if (kind === "progress") {
      [329.63, 415.3, 523.25, 659.25, 880].forEach((frequency, index) => tone(frequency, index * 0.045, 0.12, 0.044, "sine"));
      sparkle(0.11, 5, 0.024);
    } else if (kind === "complete") {
      [392, 493.88, 587.33, 783.99, 987.77, 1174.66].forEach((frequency, index) => tone(frequency, index * 0.06, 0.2, 0.058, "triangle"));
      sparkle(0.1, 10, 0.032);
    } else if (kind === "button") {
      tone(820, 0, 0.05, 0.024, "triangle");
    } else {
      tone(150, 0, 0.16, 0.045, "sawtooth");
      tone(110, 0.05, 0.14, 0.032, "sawtooth");
    }
  };

  const setMuted = (nextMuted: boolean) => {
    muted = nextMuted;
    if (musicTimer !== null && muted) {
      window.clearInterval(musicTimer);
      musicTimer = null;
    }
    if (!context || !masterGain) return;
    const now = context.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.linearRampToValueAtTime(muted ? 0 : 0.34, now + 0.09);
    if (!muted) {
      if (context.state === "suspended") void context.resume().catch(() => undefined);
      startMusic();
    }
  };

  const dispose = () => {
    if (musicTimer !== null) window.clearInterval(musicTimer);
    for (const source of ambientSources) {
      try {
        source.stop();
      } catch {
        // Source may already be stopped by the browser when the context closes.
      }
    }
    if (context && context.state !== "closed") void context.close().catch(() => undefined);
  };

  return { begin, play, setMuted, dispose };
}

function readSnapshot(root: HTMLElement): GameSnapshot {
  const tileLevels = Array.from(root.querySelectorAll<HTMLElement>(".merge-tile")).map((tile) => {
    const match = tile.className.match(/level-(\d+)/);
    return match ? Number(match[1]) : 0;
  });

  return {
    resources: Array.from(root.querySelectorAll(".resource-pill strong")).map((node) => node.textContent?.trim() ?? "").join("/"),
    progress: root.querySelectorAll(".progress-unit.is-filled").length,
    tileCount: tileLevels.length,
    maxLevel: Math.max(0, ...tileLevels),
    toast: root.querySelector(".toast")?.textContent?.trim() ?? "",
  };
}

function changedResources(current: GameSnapshot, previous: GameSnapshot) {
  return current.resources !== previous.resources && current.resources.length > 0 && previous.resources.length > 0;
}

export function MergeGameEnhancer() {
  useEffect(() => {
    const page = document.querySelector<HTMLElement>(".merge-game-page");
    if (!page) return;

    const audio = createCasinoAudio();
    const fxLayer = document.createElement("div");
    fxLayer.className = "merge-fx-layer";
    fxLayer.setAttribute("aria-hidden", "true");
    page.appendChild(fxLayer);
    page.classList.add("merge-game-enhanced");
    document.body.classList.add("merge-game-active");

    let previousSnapshot = readSnapshot(page);
    let dragSnapshot = previousSnapshot;
    let dragging = false;
    let blockTouchScroll = false;
    let activeTile: HTMLElement | null = null;
    let mutationReady = false;
    let mutationTimer = 0;
    let stateTimer = 0;
    let trailFrame = 0;

    const syncMuted = () => {
      const soundButton = page.querySelector<HTMLButtonElement>('button[aria-label="Enable sound"], button[aria-label="Mute sound"]');
      audio.setMuted(soundButton?.getAttribute("aria-label") === "Enable sound");
    };

    const vibrate = (duration: number) => {
      if ("vibrate" in navigator) navigator.vibrate(duration);
    };

    const burst = (x: number, y: number, kind: ActionKind, label = "") => {
      const effect = document.createElement("div");
      effect.className = `merge-fx-burst is-${kind}`;
      effect.style.setProperty("--x", `${x}px`);
      effect.style.setProperty("--y", `${y}px`);
      if (label) effect.dataset.label = label;
      const pieces = kind === "complete" ? 18 : kind === "merge" || kind === "progress" ? 12 : 7;
      for (let index = 0; index < pieces; index += 1) {
        const particle = document.createElement("i");
        const angle = (Math.PI * 2 * index) / pieces + Math.random() * 0.5;
        const distance = 24 + Math.random() * (kind === "complete" ? 76 : 48);
        particle.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
        particle.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);
        particle.style.setProperty("--delay", `${index * 12}ms`);
        effect.appendChild(particle);
      }
      fxLayer.appendChild(effect);
      window.setTimeout(() => effect.remove(), 980);
    };

    const burstAtElement = (element: Element | null, kind: ActionKind, label = "") => {
      const rect = (element ?? page).getBoundingClientRect();
      burst(rect.left + rect.width / 2, rect.top + rect.height / 2, kind, label);
    };

    const compareSnapshots = (current: GameSnapshot, previous: GameSnapshot, x?: number, y?: number) => {
      const effectX = x ?? window.innerWidth / 2;
      const effectY = y ?? window.innerHeight / 2;

      if (current.progress > previous.progress) {
        const complete = current.progress >= 4;
        audio.play(complete ? "complete" : "progress");
        burstAtElement(page.querySelector(".progress-row"), complete ? "complete" : "progress", complete ? "JACKPOT" : "PROGRESS");
        vibrate(complete ? 38 : 18);
      } else if (current.maxLevel > previous.maxLevel || current.tileCount < previous.tileCount) {
        audio.play("merge");
        burst(effectX, effectY, "merge", "MATCH");
        vibrate(24);
      } else if (changedResources(current, previous)) {
        audio.play("progress");
        burstAtElement(page.querySelector(".resource-strip"), "progress", "WIN");
      } else if (current.toast && current.toast !== previous.toast) {
        const isError = /cannot|need|empty|missing|not/i.test(current.toast);
        audio.play(isError ? "error" : "progress");
        burstAtElement(page.querySelector(".toast"), isError ? "error" : "progress", isError ? "NO" : "OK");
      }
    };

    const checkStateChange = () => {
      const current = readSnapshot(page);
      compareSnapshots(current, previousSnapshot);
      previousSnapshot = current;
    };

    const finishDrag = (event?: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      blockTouchScroll = false;
      page.classList.remove("is-dragging");
      activeTile?.classList.remove("is-touching");
      activeTile = null;
      window.setTimeout(() => {
        const current = readSnapshot(page);
        compareSnapshots(current, dragSnapshot, event?.clientX, event?.clientY);
        if (current.tileCount === dragSnapshot.tileCount && current.maxLevel === dragSnapshot.maxLevel && current.resources === dragSnapshot.resources && current.progress === dragSnapshot.progress) {
          audio.play("drop");
        }
        previousSnapshot = current;
      }, 120);
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      syncMuted();
      audio.begin();

      const button = target.closest<HTMLButtonElement>("button");
      if (button && !button.disabled) {
        audio.play("button");
        if (button.classList.contains("secondary-button")) burstAtElement(button, "progress", "PARCEL");
      }

      const tile = target.closest<HTMLElement>(".merge-tile");
      if (!tile) return;
      dragging = true;
      blockTouchScroll = event.pointerType !== "mouse";
      activeTile = tile;
      dragSnapshot = readSnapshot(page);
      page.classList.add("is-dragging");
      tile.classList.add("is-touching");
      audio.play("pickup");
      burst(event.clientX, event.clientY, "pickup", "+");
      vibrate(10);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!dragging || trailFrame) return;
      trailFrame = window.requestAnimationFrame(() => {
        trailFrame = 0;
        if (dragging) burst(event.clientX, event.clientY, "pickup");
      });
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (blockTouchScroll && event.target instanceof Element && event.target.closest(".board-frame")) event.preventDefault();
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const button = target?.closest<HTMLButtonElement>("button");
      if (!button || button.disabled) return;
      window.setTimeout(() => {
        checkStateChange();
      }, 160);
    };

    const observer = new MutationObserver(() => {
      syncMuted();
      if (!mutationReady || dragging) return;
      window.clearTimeout(mutationTimer);
      mutationTimer = window.setTimeout(() => {
        checkStateChange();
      }, 110);
    });

    page.addEventListener("pointerdown", handlePointerDown, { capture: true });
    page.addEventListener("pointermove", handlePointerMove, { capture: true, passive: true });
    page.addEventListener("touchmove", handleTouchMove, { passive: false });
    page.addEventListener("click", handleClick, { capture: true });
    window.addEventListener("pointerup", finishDrag, { capture: true });
    window.addEventListener("pointercancel", finishDrag, { capture: true });
    observer.observe(page, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["class", "aria-label"] });

    const readyTimer = window.setTimeout(() => {
      previousSnapshot = readSnapshot(page);
      mutationReady = true;
      syncMuted();
      stateTimer = window.setInterval(() => {
        if (!dragging && !document.hidden) checkStateChange();
      }, 260);
    }, 520);

    return () => {
      window.clearTimeout(readyTimer);
      window.clearTimeout(mutationTimer);
      window.clearInterval(stateTimer);
      if (trailFrame) window.cancelAnimationFrame(trailFrame);
      observer.disconnect();
      page.removeEventListener("pointerdown", handlePointerDown, { capture: true });
      page.removeEventListener("pointermove", handlePointerMove, { capture: true });
      page.removeEventListener("touchmove", handleTouchMove);
      page.removeEventListener("click", handleClick, { capture: true });
      window.removeEventListener("pointerup", finishDrag, { capture: true });
      window.removeEventListener("pointercancel", finishDrag, { capture: true });
      fxLayer.remove();
      page.classList.remove("merge-game-enhanced", "is-dragging");
      document.body.classList.remove("merge-game-active");
      audio.dispose();
    };
  }, []);

  return null;
}