"use client";

import { Activity, AlertTriangle, BatteryCharging, Coins, Database, Gauge, Landmark, Pickaxe, Radio, Rotate3D, ShieldAlert, Sparkles, Users, Waves, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { prudinaLandmarks, starterPrudinaState, type PrudinaEvent, type PrudinaGameState, type PrudinaLandmark, type PrudinaLandmarkId } from "@/lib/prudina-game";

type Upgrade = { id: "citizens" | "processors" | "meshNodes" | "filters"; label: string; detail: string; cost: number; icon: typeof Users };

const upgrades: Upgrade[] = [
  { id: "citizens", label: "Citizen operators", detail: "+ participation, + reports, but more unrest when trust falls.", cost: 120, icon: Users },
  { id: "processors", label: "Clinic compute room", detail: "+ passive data and fault classification.", cost: 190, icon: Database },
  { id: "meshNodes", label: "Mesh relay van", detail: "+ energy routing and radio packet repair.", cost: 230, icon: Radio },
  { id: "filters", label: "Filter crew", detail: "+ stability, higher upkeep.", cost: 270, icon: Waves },
];

const randomEvents = [
  { title: "Karst leak report", body: "A pipe crossing an old dump site tests cloudy. VEO marks it amber because a red notice would empty the district.", severity: "pressure" as const, money: -70, trust: -7, stability: -9, data: 8, attention: 14 },
  { title: "Ministry audit", body: "Inspectors ask for clean numbers. If the archive is strong enough, Prudina receives emergency funding.", severity: "opportunity" as const, money: 160, trust: 4, stability: 2, data: -14, attention: 6 },
  { title: "Radio panic stream", body: "A call-in segment becomes useful telemetry and a public relations injury at the same time.", severity: "pressure" as const, money: 20, trust: -8, stability: -4, data: 18, attention: 20 },
  { title: "Volunteer repair night", body: "People show up with tools because the last repair was visible, not because anyone fully believes VEO.", severity: "recovery" as const, money: -35, trust: 7, stability: 6, materials: 18, attention: -6 },
  { title: "Diesel reserve theft", body: "The backup tank logs a pressure drop before anyone admits a siphon hose existed.", severity: "failure" as const, money: -120, trust: -5, stability: -10, energy: -16, attention: 12 },
];

export function PrudinaRestoreGame() {
  const [state, setState] = useState<PrudinaGameState>(() => starterPrudinaState());
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("Opening database save...");
  const [modelRotation, setModelRotation] = useState(34);
  const [draggingModel, setDraggingModel] = useState<number | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/prudina-restore", { cache: "no-store" }).then(async (response) => {
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Database save failed to open.");
      if (cancelled) return;
      setState({ ...starterPrudinaState(), ...payload.state });
      loadedRef.current = true;
      setSaveStatus("Database autosave ready");
    }).catch((error) => {
      loadedRef.current = false;
      setSaveStatus(error instanceof Error ? error.message : "Database autosave unavailable");
    }).finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!loadedRef.current) return;
    const timer = window.setTimeout(() => {
      void fetch("/api/prudina-restore", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(state) })
        .then(async (response) => {
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(payload.error || "Autosave failed");
          setSaveStatus(`Saved day ${state.day}`);
        })
        .catch((error) => setSaveStatus(error instanceof Error ? error.message : "Autosave failed"));
    }, 900);
    return () => window.clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    const timer = window.setInterval(() => setState((current) => advanceDay(current)), 2600);
    return () => window.clearInterval(timer);
  }, []);

  const selected = useMemo(() => prudinaLandmarks.find((landmark) => landmark.id === state.selected) ?? prudinaLandmarks[0], [state.selected]);
  const selectedProgress = state.landmarkProgress[selected.id] ?? 0;
  const collapseRisk = Math.max(0, 100 - state.stability + Math.max(0, 40 - state.trust));

  const update = (producer: (current: PrudinaGameState) => PrudinaGameState) => setState((current) => producer(current));

  const collect = () => update((current) => {
    const trustMultiplier = 0.75 + current.trust / 115;
    return addLog({
      ...current,
      money: current.money + Math.round(18 * trustMultiplier),
      data: current.data + 4 + current.processors,
      materials: current.materials + 2 + current.filters,
      attention: clamp(current.attention + 7, 0, 100),
      trust: clamp(current.trust + (current.stability > 55 ? 1 : -1), 0, 100),
    }, { title: "Citizen activity burst", body: "Phones classify images, relay packets and flag small failures. VEO calls it play; the city calls it work.", severity: "opportunity" });
  });

  const buyUpgrade = (upgrade: Upgrade) => update((current) => {
    if (current.money < upgrade.cost) return addLog({ ...current, trust: clamp(current.trust - 1, 0, 100) }, { title: "Procurement denied", body: "The budget line is empty. Prudina notices another promised fix that cannot be paid for.", severity: "failure" });
    return addLog({ ...current, money: current.money - upgrade.cost, [upgrade.id]: current[upgrade.id] + 1, trust: clamp(current.trust + 1, 0, 100) }, { title: `${upgrade.label} added`, body: upgrade.detail, severity: "recovery" });
  });

  const mergeRepairKit = () => update((current) => {
    if (current.materials < 10 || current.data < 8 || current.energy < 5) return addLog({ ...current, stability: clamp(current.stability - 2, 0, 100) }, { title: "Repair kit failed", body: "The parts do not line up. A visible repair cannot be faked without making the model worse.", severity: "failure" });
    const nextProgress = clamp((current.landmarkProgress[current.selected] ?? 0) + 16 + current.filters * 2, 0, 100);
    const completedNow = nextProgress >= 100 && !current.completed.includes(current.selected);
    return addLog({
      ...current,
      materials: current.materials - 10,
      data: current.data - 8,
      energy: current.energy - 5,
      attention: clamp(current.attention + 10, 0, 100),
      trust: clamp(current.trust + (completedNow ? 8 : 2), 0, 100),
      stability: clamp(current.stability + (completedNow ? 8 : 3), 0, 100),
      completed: completedNow ? [...current.completed, current.selected] : current.completed,
      landmarkProgress: { ...current.landmarkProgress, [current.selected]: nextProgress },
      cinematic: current.selected,
    }, { title: completedNow ? "Repair completed" : "Merged material installed", body: completedNow ? "The model visibly changes because the city actually changed." : "A merged repair kit upgrades the selected landmark and improves the district simulation.", severity: "recovery" });
  });

  const repairMission = () => update((current) => {
    const target = prudinaLandmarks.find((item) => item.id === current.selected)!;
    const cost = target.cost;
    const affordable = current.money >= cost.money && current.materials >= cost.materials && current.data >= cost.data && current.energy >= cost.energy && current.trust >= cost.trust;
    if (!affordable) return addLog({ ...current, trust: clamp(current.trust - 4, 0, 100), attention: clamp(current.attention + 8, 0, 100) }, { title: "Mission exposed a shortage", body: "VEO asked for a dramatic repair before Prudina had enough money, parts, data or public consent.", severity: "failure" });
    const progress = clamp((current.landmarkProgress[target.id] ?? 0) + 42, 0, 100);
    const completedNow = progress >= 100 && !current.completed.includes(target.id);
    return addLog({
      ...current,
      money: current.money - cost.money,
      materials: current.materials - cost.materials,
      data: current.data - cost.data,
      energy: current.energy - cost.energy,
      trust: clamp(current.trust + (completedNow ? 12 : 3), 0, 100),
      stability: clamp(current.stability + (completedNow ? 12 : 5), 0, 100),
      completed: completedNow ? [...current.completed, target.id] : current.completed,
      landmarkProgress: { ...current.landmarkProgress, [target.id]: progress },
      cinematic: target.id,
    }, { title: completedNow ? `${target.name} restored` : `${target.name} repair staged`, body: target.detail, severity: "recovery" });
  });

  const riskTender = () => update((current) => {
    if (current.money < 90) return addLog({ ...current, trust: clamp(current.trust - 2, 0, 100) }, { title: "No stake available", body: "The city cannot gamble with money it already spent.", severity: "failure" });
    const chance = clamp(0.28 + current.trust / 220 + current.stability / 280 - current.attention / 360, 0.14, 0.78);
    const win = Math.random() < chance;
    return addLog({
      ...current,
      money: current.money + (win ? 230 : -120),
      materials: current.materials + (win ? 10 : 0),
      data: current.data + (win ? 6 : 0),
      trust: clamp(current.trust + (win ? 2 : -9), 0, 100),
      stability: clamp(current.stability + (win ? 1 : -7), 0, 100),
      attention: clamp(current.attention + 12, 0, 100),
    }, { title: win ? "Risk tender won" : "Risk tender collapsed", body: win ? "A supplier takes the ugly contract. The win feels real because failure was possible." : "The procurement bet fails publicly. Money is gone and VEO has to explain the odds.", severity: win ? "opportunity" : "failure" });
  });

  const clearCinematic = () => update((current) => ({ ...current, cinematic: null }));

  return (
    <main className="prudina-game" onPointerMove={(event) => draggingModel !== null && setModelRotation(modelRotation + (event.clientX - draggingModel) * 0.28)} onPointerUp={() => setDraggingModel(null)} onPointerCancel={() => setDraggingModel(null)}>
      <section className="prudina-hero-panel">
        <div><p>PRUDINA RESTORE / VEO PATCHWORK</p><h1>Igraj da Prudina radi.</h1><span>Not miracle technology. A shrinking city, bad incentives, fragile repairs and visible consequences.</span></div>
        <div className="prudina-save"><Database size={15} /><strong>{loading ? "Loading" : saveStatus}</strong><span>No localStorage progress cache</span></div>
      </section>

      <section className="prudina-resource-strip">
        <Metric icon={Coins} label="Money" value={state.money} danger={state.money < 120} />
        <Metric icon={Users} label="Trust" value={`${state.trust}%`} danger={state.trust < 28} />
        <Metric icon={Gauge} label="Stability" value={`${state.stability}%`} danger={state.stability < 34} />
        <Metric icon={Activity} label="Attention" value={`${state.attention}%`} danger={state.attention > 78} />
        <Metric icon={Pickaxe} label="Materials" value={state.materials} />
        <Metric icon={Database} label="Data" value={state.data} />
        <Metric icon={BatteryCharging} label="Energy" value={state.energy} />
      </section>

      <section className="prudina-layout">
        <div className="prudina-map-card">
          <div className="prudina-card-head"><span>3D city map</span><strong>Repairs visibly rebuild landmarks</strong></div>
          <CityMap state={state} onSelect={(id) => update((current) => ({ ...current, selected: id }))} />
          <div className="prudina-controls"><button onClick={collect}><Zap size={15} /> Process civic activity</button><button onClick={mergeRepairKit}><Sparkles size={15} /> Merge repair kit</button><button onClick={riskTender}><ShieldAlert size={15} /> Risk tender</button></div>
        </div>

        <div className="prudina-model-card">
          <div className="prudina-card-head"><span>Inspectable model</span><strong>{selected.name}</strong></div>
          <ModelViewer landmark={selected} progress={selectedProgress} rotation={modelRotation} onPointerDown={(x) => setDraggingModel(x)} />
          <label className="prudina-rotation"><Rotate3D size={14} /><input type="range" min="0" max="360" value={modelRotation} onChange={(event) => setModelRotation(Number(event.target.value))} /></label>
          <p>{selected.detail}</p>
          <button className="prudina-primary" onClick={repairMission}>Commit full repair mission</button>
        </div>

        <div className="prudina-side-stack">
          <section className="prudina-card">
            <div className="prudina-card-head"><span>Mission economics</span><strong>{selectedProgress}% restored</strong></div>
            <CostList landmark={selected} state={state} />
            <div className="prudina-risk"><AlertTriangle size={15} /><span>Collapse risk</span><strong>{collapseRisk}%</strong></div>
          </section>
          <section className="prudina-card">
            <div className="prudina-card-head"><span>Idle upgrades</span><strong>Upkeep can bankrupt you</strong></div>
            <div className="prudina-upgrades">{upgrades.map((upgrade) => { const Icon = upgrade.icon; return <button key={upgrade.id} onClick={() => buyUpgrade(upgrade)}><Icon size={15} /><strong>{upgrade.label}</strong><span>{upgrade.detail}</span><i>{upgrade.cost} funds</i></button>; })}</div>
          </section>
        </div>
      </section>

      <section className="prudina-lower-grid">
        <article className="prudina-lore"><p>WHY THIS EXISTS</p><h2>VEO is a civic patch that learns the wrong lesson.</h2><span>Players do not create electricity. Their devices produce classification, routing, local mesh traffic, reports, votes and attention. The deadly design flaw is that unresolved crisis produces more useful activity than peace, so trust is a real system variable: high trust improves participation and procurement odds; low trust creates collapse, audits and public failure.</span></article>
        <article className="prudina-log"><p>EVENT FEED</p>{state.log.map((event) => <div key={event.id} className={`event-${event.severity}`}><strong>{event.title}</strong><span>{event.body}</span></div>)}</article>
      </section>

      {state.cinematic && <Cinematic landmark={prudinaLandmarks.find((item) => item.id === state.cinematic) ?? selected} onClose={clearCinematic} />}
    </main>
  );
}

function advanceDay(current: PrudinaGameState): PrudinaGameState {
  const upkeep = 8 + current.filters * 4 + current.meshNodes * 3 + current.completed.length * 9;
  const income = current.citizens * (0.9 + current.trust / 130) + current.processors * 4 + current.meshNodes * 2;
  let next: PrudinaGameState = {
    ...current,
    day: current.day + 1,
    money: Math.round(current.money + income - upkeep),
    materials: current.materials + Math.max(1, current.filters),
    data: current.data + Math.max(1, current.processors * 2 + Math.floor(current.citizens / 4)),
    energy: current.energy + Math.max(0, current.meshNodes + Math.floor((current.landmarkProgress.roofs ?? 0) / 25) - current.filters),
    attention: clamp(current.attention - 1 + (current.stability < 35 ? 4 : 0), 0, 100),
    trust: clamp(current.trust + (current.money < 0 ? -4 : current.stability > 70 ? 1 : 0) + (current.attention > 86 ? -2 : 0), 0, 100),
    stability: clamp(current.stability + current.filters - (current.money < -120 ? 7 : 1) - (current.trust < 20 ? 4 : 0), 0, 100),
  };
  if (next.day % 6 === 0) next = applyRandomEvent(next);
  if (next.stability <= 0 || next.trust <= 0) {
    const emergency: PrudinaEvent = { id: crypto.randomUUID(), title: "Emergency reset", body: "The city does not end. It limps forward under debt, lower trust and more surveillance.", severity: "failure", at: Date.now() };
    next = { ...next, money: Math.max(120, next.money), trust: 18, stability: 22, attention: 92, log: [emergency, ...next.log].slice(0, 8) };
  }
  return next;
}

function addLog(current: PrudinaGameState, event: Omit<PrudinaEvent, "id" | "at">): PrudinaGameState {
  return { ...current, log: [{ ...event, id: crypto.randomUUID(), at: Date.now() }, ...current.log].slice(0, 8) };
}

function applyRandomEvent(current: PrudinaGameState): PrudinaGameState {
  const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];
  return {
    ...current,
    money: current.money + (event.money ?? 0),
    trust: clamp(current.trust + (event.trust ?? 0), 0, 100),
    stability: clamp(current.stability + (event.stability ?? 0), 0, 100),
    attention: clamp(current.attention + (event.attention ?? 0), 0, 100),
    materials: Math.max(0, current.materials + (event.materials ?? 0)),
    data: Math.max(0, current.data + (event.data ?? 0)),
    energy: Math.max(0, current.energy + (event.energy ?? 0)),
    log: [{ id: crypto.randomUUID(), title: event.title, body: event.body, severity: event.severity, at: Date.now() }, ...current.log].slice(0, 8),
  };
}

function Metric({ icon: Icon, label, value, danger = false }: { icon: typeof Coins; label: string; value: string | number; danger?: boolean }) {
  return <div className={danger ? "danger" : ""}><Icon size={15} /><span>{label}</span><strong>{value}</strong></div>;
}

function CityMap({ state, onSelect }: { state: PrudinaGameState; onSelect: (id: PrudinaLandmarkId) => void }) {
  return <div className="prudina-city-map"><div className="city-plate" />{prudinaLandmarks.map((landmark) => { const progress = state.landmarkProgress[landmark.id] ?? 0; return <button key={landmark.id} className={`${state.selected === landmark.id ? "active" : ""} ${progress >= 100 ? "done" : ""}`} style={{ left: `${landmark.x}%`, top: `${landmark.y}%`, "--progress": `${progress}%` } as React.CSSProperties} onClick={() => onSelect(landmark.id)}><i /><strong>{landmark.name}</strong><span>{progress}%</span></button>; })}</div>;
}

function ModelViewer({ landmark, progress, rotation, onPointerDown }: { landmark: PrudinaLandmark; progress: number; rotation: number; onPointerDown: (x: number) => void }) {
  const stage = progress >= 100 ? "complete" : progress >= 66 ? "high" : progress >= 33 ? "mid" : "low";
  return <div className={`prudina-model stage-${stage} model-${landmark.model}`} onPointerDown={(event) => onPointerDown(event.clientX)}><div className="model-rotor" style={{ transform: `rotateX(62deg) rotateZ(${rotation}deg)` }}><i className="base" /><i className="shadow" /><i className="part one" /><i className="part two" /><i className="part three" /><i className="water" /><i className="signal" /></div></div>;
}

function CostList({ landmark, state }: { landmark: PrudinaLandmark; state: PrudinaGameState }) {
  const entries = [["Money", landmark.cost.money, state.money], ["Materials", landmark.cost.materials, state.materials], ["Data", landmark.cost.data, state.data], ["Energy", landmark.cost.energy, state.energy], ["Trust", landmark.cost.trust, state.trust]] as const;
  return <div className="prudina-costs">{entries.map(([label, need, have]) => <div key={label} className={have >= need ? "ok" : "short"}><span>{label}</span><strong>{have} / {need}</strong></div>)}</div>;
}

function Cinematic({ landmark, onClose }: { landmark: PrudinaLandmark; onClose: () => void }) {
  return <div className="prudina-cinematic" onClick={onClose}><div><Landmark size={26} /><span>REPAIR SEQUENCE</span><h2>{landmark.name}</h2><p>Concrete, records, sensors and public faith lock into a visible civic upgrade. Prudina is not saved; it becomes harder to ignore.</p><button>Continue</button></div></div>;
}

function clamp(value: number, min: number, max: number) { return Math.max(min, Math.min(max, value)); }