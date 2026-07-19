"use client";

import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  Bot,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  Coins,
  FileCheck2,
  FileInput,
  Gauge,
  Heart,
  House,
  Landmark,
  Layers3,
  ListChecks,
  MapPin,
  MessageCircleMore,
  MessageSquareText,
  PackageCheck,
  PackagePlus,
  Plus,
  Radio,
  RotateCcw,
  ShieldCheck,
  Weight,
  Volume2,
  VolumeX,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MAX_ITEM_LEVEL,
  addParcel,
  advanceService,
  buyUpgrade,
  characters,
  chooseFamilyScene,
  collectTableIncome,
  mergesNeeded,
  programMetrics,
  relations,
  restorePrudinaMergeState,
  sceneForState,
  selectOrMergeTile,
  serviceForState,
  starterPrudinaMergeState,
  upgradeCost,
  type CharacterId,
  type PrudinaMergeState,
  type UpgradeId,
} from "@/lib/prudina-merge";
import styles from "./prudina-restore-game.module.css";

const SAVE_KEY = "prudina-svi-za-stolom-v1";
const SOUND_KEY = "prudina-svi-za-stolom-sound";
const TUTORIAL_KEY = "prudina-odrzi-tutorial-v1";

const itemLevels: Array<{ name: string; shortName: string; icon: LucideIcon }> = [
  { name: "Prijava potrebe", shortName: "Prijava", icon: FileInput },
  { name: "Provjeren zahtjev", shortName: "Provjera", icon: FileCheck2 },
  { name: "Paket potpore", shortName: "Potpora", icon: PackageCheck },
  { name: "Privremena mjera", shortName: "Mjera", icon: ShieldCheck },
  { name: "Stabilizirana soba", shortName: "Soba", icon: Building2 },
  { name: "Siguran boravak", shortName: "Boravak", icon: House },
  { name: "Održano kućanstvo", shortName: "Kućanstvo", icon: BadgeCheck },
  { name: "Službeno stabilan dom", shortName: "Stabilno", icon: Landmark },
];

const characterInitials: Record<CharacterId, string> = {
  ruza: "RŽ",
  mara: "MA",
  davor: "DV",
  karlytta: "KA",
  deni: "DN",
};

const upgradeCards: Array<{
  id: UpgradeId;
  title: string;
  description: string;
  icon: LucideIcon;
  benefit: (level: number) => string;
}> = [
  {
    id: "betterBag",
    title: "Ubrzana klasifikacija",
    description: "Dio novih unosa odmah prolazi osnovnu provjeru.",
    icon: ListChecks,
    benefit: (level) => `${Math.round(Math.min(0.5, 0.06 + level * 0.11) * 100)}% prijava razine 2`,
  },
  {
    id: "familyBook",
    title: "Objedinjeni obiteljski spis",
    description: "Objedinjavanje vrijedi više, a procjene stvaraju dodatne dokaze.",
    icon: BookOpen,
    benefit: (level) => `+${level * 20}% sredstava / +${level} dokaza`,
  },
  {
    id: "longTable",
    title: "Dežurna logistika",
    description: "Operativna sredstva pristižu dok je lokalni spis otvoren.",
    icon: Clock3,
    benefit: (level) => (level ? `+${2 + level * 3} sredstava svakih 5 s` : "Dežurstvo nije aktivno"),
  },
  {
    id: "oldRadio",
    title: "Terenski signal",
    description: "Procjena odnosa otvara se nakon manje objedinjenih prijava.",
    icon: Radio,
    benefit: (level) => `Nova procjena nakon ${Math.max(1, 3 - level)} objedinjavanja`,
  },
];

const officialMessages = [
  "Gubitak krova ne prekida sudjelovanje. Vaš novi status bit će uključen u sljedeću procjenu.",
  "Zadržite redovit dnevni ritam. Evidentirani gubitak stanovanja ubrzava razvrstavanje zahtjeva.",
  "Ako se stanje poboljšalo, prijavite promjenu. Time može prestati pravo na nastavak mjere.",
  "Program se nastavlja u područjima s dostatnim brojem potvrđenih potreba.",
  "Privremena pomoć smatra se uspješnom kada ne stvara pravo na trajnu pomoć.",
];

const tutorialSteps: Array<{ icon: LucideIcon; eyebrow: string; title: string; body: string }> = [
  {
    icon: Landmark,
    eyebrow: "1 / 4 — LOKALNI JAVNI SPIS",
    title: "Ovo nije prijava za novčanu naknadu.",
    body: "Program ODRŽI na ovom uređaju vodi simulirani spis jednog kućanstva. Ne traži račun ni osobne podatke. Napredak se sprema lokalno i može se obrisati.",
  },
  {
    icon: Layers3,
    eyebrow: "2 / 4 — OBJEDINJAVANJE",
    title: "Dvije jednake prijave postaju viša mjera.",
    body: "Unesite prijavu, zatim kliknite dvije iste razine. Time dobivate sredstva za mjere kapaciteta i fizičke naloge. To je cijela osnovna radnja.",
  },
  {
    icon: Bot,
    eyebrow: "3 / 4 — IZVRŠNA JEDINICA P-1",
    title: "Zahtjev može završiti stvarnom fizičkom radnjom.",
    body: "P-1 prvo provjerava sigurnost, zatim rezervira sredstva, izvršava samo dopuštene korake i zatvara predmet dokazom. Nikad ne smije improvizirati medicinski, građevinski ili socijalni autoritet.",
  },
  {
    icon: Gauge,
    eyebrow: "4 / 4 — KONTINUITET",
    title: "Program treba riješiti potrebu i sačuvati razlog da postoji.",
    body: "Svaki riješen slučaj povećava stabilnost kućanstva, ali smanjuje osnovu za sljedeći proračun. Sustav zato uvijek prikazuje i korist za čovjeka i korist koju institucija izvlači iz njegove potrebe.",
  },
];

const serviceStages: Array<{ icon: LucideIcon; title: string; detail: string }> = [
  { icon: MessageSquareText, title: "Zaprimljeno", detail: "Korisnik je opisao potrebu." },
  { icon: ShieldCheck, title: "Provjereno", detail: "Granice i rizici su poznati." },
  { icon: Bot, title: "Odobreno", detail: "Sredstva su rezervirana." },
  { icon: ClipboardCheck, title: "Izvršeno", detail: "Radnja čeka dokaz." },
];

export function PrudinaRestoreGame() {
  const [state, setState] = useState<PrudinaMergeState>(() => starterPrudinaMergeState());
  const stateRef = useRef(state);
  const [ready, setReady] = useState(false);
  const [saveAvailable, setSaveAvailable] = useState(true);
  const [soundOn, setSoundOn] = useState(false);
  const [focusedCharacter, setFocusedCharacter] = useState<CharacterId | null>(null);
  const [resetArmed, setResetArmed] = useState(false);
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const tutorialRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = window.localStorage.getItem(SAVE_KEY);
        if (saved) {
          const restored = restorePrudinaMergeState(JSON.parse(saved));
          stateRef.current = restored;
          setState(restored);
        }
        setSoundOn(window.localStorage.getItem(SOUND_KEY) === "on");
        if (window.localStorage.getItem(TUTORIAL_KEY) !== "done") setTutorialStep(0);
      } catch {
        const fresh = starterPrudinaMergeState();
        stateRef.current = fresh;
        setState(fresh);
        setSaveAvailable(false);
      } finally {
        setReady(true);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!ready) return;
    let storageWorks = true;
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch {
      storageWorks = false;
    }
    const frame = window.requestAnimationFrame(() => setSaveAvailable(storageWorks));
    return () => window.cancelAnimationFrame(frame);
  }, [ready, state]);

  useEffect(() => {
    if (!ready || state.upgrades.longTable <= 0) return;
    const timer = window.setInterval(() => {
      const next = collectTableIncome(stateRef.current);
      stateRef.current = next;
      setState(next);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [ready, state.upgrades.longTable]);

  useEffect(() => () => {
    if (audioRef.current && audioRef.current.state !== "closed") void audioRef.current.close().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!resetArmed) return;
    const timer = window.setTimeout(() => setResetArmed(false), 4500);
    return () => window.clearTimeout(timer);
  }, [resetArmed]);

  useEffect(() => {
    if (tutorialStep === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => tutorialRef.current?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setTutorialStep(null);
      try {
        window.localStorage.setItem(TUTORIAL_KEY, "done");
      } catch {
        // Closing help must work even when storage is unavailable.
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [tutorialStep]);

  const scene = sceneForState(state);
  const scenePeople = scene.people.map((id) => characters.find((person) => person.id === id)!);
  const sceneScore = state.relations[scene.relation];
  const emptyCount = state.board.filter((tile) => tile === null).length;
  const neededForScene = mergesNeeded(state);
  const sceneProgress = state.sceneReady ? neededForScene : Math.min(neededForScene, state.mergesSinceScene);
  const visibleRelations = useMemo(
    () => focusedCharacter ? relations.filter((relation) => relation.people.includes(focusedCharacter)) : relations,
    [focusedCharacter],
  );
  const service = serviceForState(state);
  const metrics = programMetrics(state);
  const officialMessage = officialMessages[(state.servicesCompleted + state.sceneIndex) % officialMessages.length];
  const serviceButtonLabel = state.serviceStep === 0
    ? "Provjeri sigurnost"
    : state.serviceStep === 1
      ? `Rezerviraj ${service.cost} sredstava`
      : state.serviceStep === 2
        ? "Pošalji jedinicu P-1"
        : "Prihvati dokaz i zatvori predmet";

  const playSound = (kind: "tap" | "merge" | "story" | "buy") => {
    if (!soundOn || typeof window === "undefined") return;
    const AudioContextConstructor = window.AudioContext;
    if (!AudioContextConstructor) return;
    try {
      const context = audioRef.current?.state === "closed" ? null : audioRef.current;
      const audio = context ?? new AudioContextConstructor();
      audioRef.current = audio;
      if (audio.state === "suspended") void audio.resume().catch(() => undefined);
      const notes = kind === "merge" ? [392, 523.25, 659.25] : kind === "story" ? [293.66, 440, 587.33] : kind === "buy" ? [440, 554.37] : [330];
      notes.forEach((frequency, index) => {
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        const start = audio.currentTime + index * 0.055;
        oscillator.type = kind === "story" ? "triangle" : "sine";
        oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.055, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
        oscillator.connect(gain);
        gain.connect(audio.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.18);
      });
    } catch {
      // Sound is optional; unsupported audio must never interrupt the game.
    }
  };

  const applyGameUpdate = (
    update: (current: PrudinaMergeState) => PrudinaMergeState,
    sound: "tap" | ((current: PrudinaMergeState, next: PrudinaMergeState) => "tap" | "merge" | "story" | "buy"),
  ) => {
    const current = stateRef.current;
    const next = update(current);
    stateRef.current = next;
    setState(next);
    playSound(typeof sound === "function" ? sound(current, next) : sound);
  };

  const handleAddParcel = () => {
    applyGameUpdate((current) => addParcel(current), "tap");
  };

  const handleCell = (index: number) => {
    applyGameUpdate(
      (current) => current.board[index] ? selectOrMergeTile(current, index) : addParcel(current, Math.random(), index),
      (current, next) => next.totalMerges > current.totalMerges ? "merge" : "tap",
    );
  };

  const handleChoice = (choiceIndex: 0 | 1) => {
    applyGameUpdate(
      (current) => chooseFamilyScene(current, choiceIndex),
      (current, next) => next.sceneIndex !== current.sceneIndex ? "story" : "tap",
    );
  };

  const handleUpgrade = (id: UpgradeId) => {
    applyGameUpdate(
      (current) => buyUpgrade(current, id),
      (current, next) => next.upgrades[id] > current.upgrades[id] ? "buy" : "tap",
    );
  };

  const handleService = () => {
    applyGameUpdate(
      (current) => advanceService(current),
      (current, next) => next.serviceStep === 0 && current.serviceStep === 3 ? "story" : next.coins < current.coins ? "buy" : "tap",
    );
  };

  const closeTutorial = () => {
    setTutorialStep(null);
    try {
      window.localStorage.setItem(TUTORIAL_KEY, "done");
    } catch {
      setSaveAvailable(false);
    }
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    try {
      window.localStorage.setItem(SOUND_KEY, next ? "on" : "off");
    } catch {
      setSaveAvailable(false);
    }
  };

  const resetGame = () => {
    if (!resetArmed) {
      setResetArmed(true);
      return;
    }
    const fresh = starterPrudinaMergeState();
    stateRef.current = fresh;
    setState(fresh);
    setResetArmed(false);
  };

  return (
    <main className={styles.root} aria-busy={!ready}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.backLink}><ArrowLeft size={18} /><span>Prudina Online</span></Link>
        <div className={styles.brand}>
          <span>GRAD PRUDINA / UPRAVNI ODJEL ZA STANOVANJE I OTPORNOST ZAJEDNICE</span>
          <h1>Program ODRŽI</h1>
        </div>
        <div className={styles.resources} aria-label="Stanje lokalnog spisa">
          <div><Coins size={18} /><span>Sredstva</span><strong>{state.coins}</strong></div>
          <div><FileCheck2 size={18} /><span>Dokazi</span><strong>{state.stories}</strong></div>
        </div>
        <button className={styles.helpButton} onClick={() => setTutorialStep(0)} aria-label="Otvori upute"><CircleHelp size={20} /><span>Upute</span></button>
        <button className={styles.soundButton} onClick={toggleSound} aria-label={soundOn ? "Isključi zvuk" : "Uključi zvuk"}>
          {soundOn ? <Volume2 size={19} /> : <VolumeX size={19} />}
          <span>{soundOn ? "Zvuk uklj." : "Zvuk isklj."}</span>
        </button>
      </header>

      <section className={styles.intro} aria-labelledby="game-title">
        <div>
          <p>JAVNI PILOT-PROGRAM / P-ODRŽI-04 / LOKALNI SPIS</p>
          <h2 id="game-title">Kontinuitet kućanstva mjeri se kroz riješene potrebe.</h2>
          <span>Objedinite jednake prijave, osigurajte sredstva i odobrite fizičku pomoć. Sustav odvojeno prati poboljšanje života stanovnika i opravdanost nastavka samog programa.</span>
        </div>
        <ol className={styles.steps}>
          <li><b>1</b><span><strong>Unesite</strong> prijavu</span></li>
          <li><b>2</b><span><strong>Objedinite</strong> dvije iste</span></li>
          <li><b>3</b><span><strong>Odobrite</strong> fizičku radnju</span></li>
        </ol>
      </section>

      <section className={styles.officialNotice} aria-label="Službena poruka programa">
        <Landmark size={28} aria-hidden="true" />
        <div><span>SLUŽBENA PORUKA / AUTOMATSKI ODABRANO</span><strong>{officialMessage}</strong></div>
        <p>Poruka se ne može isključiti dok je kućanstvo dio pilot-programa.</p>
      </section>

      <section className={styles.programStatus} aria-label="Stanje programa">
        <ProgramMetric icon={Activity} label="Opravdanost nastavka programa" value={metrics.reasonToExist} detail="potvrđene potrebe koje opravdavaju mandat" tone="mandate" />
        <ProgramMetric icon={House} label="Stabilnost kućanstva" value={metrics.householdStability} detail="procijenjena sposobnost nastavka života" tone="stable" />
        <ProgramMetric icon={BadgeCheck} label="Pokrivenost dokazom" value={metrics.verifiedCoverage} detail="radnje zaključene provjerljivim zapisom" tone="proof" />
      </section>

      <section className={styles.botSection} aria-labelledby="bot-title">
        <div className={styles.botSummary}>
          <div className={styles.botIdentity}><span><Bot size={30} /></span><div><small>JAVNI JEZIČNI MODEL / JEDINICA P-1</small><strong>Fizički izvršni modul spreman</strong></div><i>ONLINE</i></div>
          <p>{service.code} / AKTIVNI KORISNIČKI ZAHTJEV</p>
          <h2 id="bot-title">{service.title}</h2>
          <blockquote>“{service.request}”</blockquote>
          <strong className={styles.residentLine}>{service.resident}</strong>
          <div className={styles.serviceFacts}>
            <span><MapPin size={18} /><b>{service.location}</b></span>
            <span><Clock3 size={18} /><b>{service.duration}</b></span>
            <span><Weight size={18} /><b>{service.load}</b></span>
          </div>
        </div>

        <div className={styles.botWorkflow}>
          <span>POSTUPAK KOJI KORISNIK ODOBRAVA KORAK PO KORAK</span>
          <ol>
            {serviceStages.map((stage, index) => {
              const Icon = stage.icon;
              const done = index < state.serviceStep;
              const active = index === state.serviceStep;
              return <li key={stage.title} className={`${done ? styles.stageDone : ""} ${active ? styles.stageActive : ""}`}><b>{done ? <CheckCircle2 size={22} /> : <Icon size={22} />}</b><span><strong>{stage.title}</strong><small>{stage.detail}</small></span></li>;
            })}
          </ol>
          <button className={styles.serviceButton} onClick={handleService}>
            <Bot size={23} /><span><strong>{serviceButtonLabel}</strong><small>KORAK {state.serviceStep + 1} OD 4 / NALOG {service.code}</small></span><ChevronRight size={21} />
          </button>
          <p className={styles.continuityWarning}>Potpuno riješeno kućanstvo smanjuje osnovu programa. Novi nalog otvara se nakon svakog zatvorenog predmeta.</p>
        </div>

        <div className={styles.physicalPlan}>
          <div><span>FIZIČKI PLAN / NE SMIJE SE IMPROVIZIRATI</span><b>{state.servicesCompleted} završena naloga</b></div>
          <ol>{service.physicalPlan.map((step, index) => <li key={step}><b>{index + 1}</b><span>{step}</span></li>)}</ol>
          <dl>
            <div><dt>OBVEZNI PREKID</dt><dd>{service.stopCondition}</dd></div>
            <div><dt>DOKAZ IZVRŠENJA</dt><dd>{service.proof}</dd></div>
          </dl>
        </div>
      </section>

      <div className={styles.gameLayout}>
        <section className={styles.boardPanel} aria-labelledby="board-title">
          <div className={styles.panelHeader}>
            <div><span>REGISTAR MJERA / 16 POLJA</span><h2 id="board-title">Objedinite prijave</h2></div>
            <div className={styles.tableStatus}><strong>{emptyCount}</strong><span>slobodnih polja</span></div>
          </div>

          <div className={styles.levelTrail} aria-label={`Najviša otključana razina je ${state.highestLevel}`}>
            {itemLevels.map((item, index) => {
              const Icon = item.icon;
              const level = index + 1;
              return <div key={item.name} className={level <= state.highestLevel ? styles.levelUnlocked : ""} title={item.name}><Icon size={16} /><span>{level}</span></div>;
            })}
          </div>

          <div className={styles.tablecloth}>
            <div className={styles.board} role="group" aria-label="Registar prijava, četiri puta četiri">
              {state.board.map((tile, index) => {
                if (!tile) return <button key={`empty-${index}`} data-testid={`board-cell-${index}`} className={styles.emptyCell} onClick={() => handleCell(index)} aria-label={`Prazno registarsko mjesto ${index + 1}. Kliknite za novu prijavu.`}><Plus size={19} aria-hidden="true" /></button>;
                const item = itemLevels[tile.level - 1];
                const Icon = item.icon;
                const selected = state.selectedIndex === index;
                return (
                  <button
                    key={tile.id}
                    data-testid={`board-cell-${index}`}
                    className={`${styles.tile} ${selected ? styles.tileSelected : ""}`}
                    data-level={tile.level}
                    aria-pressed={selected}
                    aria-label={`${item.name}, mjera ${tile.level}${selected ? ", odabrano" : ""}`}
                    onClick={() => handleCell(index)}
                  >
                    <span className={styles.tileShine} aria-hidden="true" />
                    <Icon className={styles.tileIcon} aria-hidden="true" />
                    <strong>{item.shortName}</strong>
                    <small>MJERA {tile.level}</small>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.boardActions}>
            <button className={styles.addButton} onClick={handleAddParcel} disabled={emptyCount === 0}>
              <PackagePlus size={25} />
              <span><strong>Unesite prijavu</strong><small>{emptyCount ? "NOVI LOKALNI ZAPIS" : "PRVO OBJEDINITE DVIJE ISTE"}</small></span>
            </button>
            <div className={styles.liveMessage} aria-live="polite"><Activity size={20} /><span>{state.lastMessage}</span></div>
          </div>
        </section>

        <aside className={styles.sideColumn}>
          <section className={`${styles.sceneCard} ${state.sceneReady ? styles.sceneReady : ""}`} aria-labelledby="scene-title">
            <div className={styles.sceneTape}>{scene.kicker}</div>
            <div className={styles.scenePeople} aria-label={`${scenePeople[0].name} i ${scenePeople[1].name}`}>
              <PersonSeal id={scene.people[0]} />
              <span className={styles.sceneTie}><Heart size={17} /><b>i</b><MessageCircleMore size={17} /></span>
              <PersonSeal id={scene.people[1]} />
            </div>
            {state.sceneReady ? (
              <>
                <p>AKTIVNA PROCJENA MEĐUOVISNOSTI</p>
                <h2 id="scene-title">{scene.title}</h2>
                <blockquote>{scene.body}</blockquote>
                <div className={styles.sceneMeters}>
                  <Meter label="Potpora" value={sceneScore.warmth} tone="warm" />
                  <Meter label="Pritisak" value={sceneScore.friction} tone="hot" />
                </div>
                <div className={styles.choices}>
                  {scene.choices.map((choice, index) => <button key={choice.label} onClick={() => handleChoice(index as 0 | 1)}><span>{index + 1}</span>{choice.label}</button>)}
                </div>
              </>
            ) : (
              <div className={styles.sceneWaiting}>
                <p>SLJEDEĆA PROCJENA</p>
                <h2 id="scene-title">Spis čeka nove objedinjene prijave.</h2>
                <span>Objedinite još {Math.max(0, neededForScene - state.mergesSinceScene)} {neededForScene - state.mergesSinceScene === 1 ? "par" : "para"} za procjenu odnosa između {scenePeople[0].genitive} i {scenePeople[1].genitive}.</span>
                <div className={styles.sceneProgress} aria-label={`${sceneProgress} od ${neededForScene} objedinjavanja`}>{Array.from({ length: neededForScene }, (_, index) => <i key={index} className={index < sceneProgress ? styles.progressFilled : ""} />)}</div>
              </div>
            )}
          </section>

          <section className={styles.shop} id="ducan" aria-labelledby="shop-title">
            <div className={styles.panelHeader}>
              <div><span>PRORAČUN / MJERE KAPACITETA</span><h2 id="shop-title">Aktivirajte kapacitet</h2></div>
              <Landmark size={24} />
            </div>
            <div className={styles.upgradeList}>
              {upgradeCards.map((upgrade) => {
                const Icon = upgrade.icon;
                const level = state.upgrades[upgrade.id];
                const cost = upgradeCost(upgrade.id, level);
                const maxed = level >= 5;
                return (
                  <button key={upgrade.id} onClick={() => handleUpgrade(upgrade.id)} disabled={maxed} className={state.coins < cost && !maxed ? styles.cannotAfford : ""}>
                    <span className={styles.upgradeIcon}><Icon size={20} /></span>
                    <span className={styles.upgradeCopy}><strong>{upgrade.title}</strong><small>{upgrade.description}</small><em>{upgrade.benefit(level)}</em></span>
                    <span className={styles.upgradePrice}>{maxed ? <b>AKTIVNO</b> : <><Coins size={15} /><b>{cost}</b></>}<small>RAZINA {level}/5</small></span>
                  </button>
                );
              })}
            </div>
          </section>
        </aside>
      </div>

      <section className={styles.relationshipSection} id="odnosi" aria-labelledby="relations-title">
        <div className={styles.relationshipIntro}>
          <span>MODEL MEĐUOVISNOSTI / NE ODLUČUJE O PRAVU</span>
          <h2 id="relations-title">Pomoć i pritisak bilježe se odvojeno.</h2>
          <p>Ista osoba može dostaviti lijek, proširiti glasinu, platiti račun i zahtijevati zahvalnost. Model ne pretpostavlja da bliskost poništava štetu.</p>
          <button className={!focusedCharacter ? styles.filterActive : ""} onClick={() => setFocusedCharacter(null)}>Prikaži cijelu mrežu</button>
        </div>

        <div className={styles.relationMap}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <line x1="18" y1="20" x2="82" y2="20" />
            <line x1="50" y1="50" x2="82" y2="20" />
            <line x1="50" y1="50" x2="18" y2="80" />
            <line x1="18" y1="20" x2="18" y2="80" />
            <line x1="18" y1="20" x2="82" y2="80" />
            <line x1="82" y1="20" x2="82" y2="80" />
            <line x1="18" y1="80" x2="82" y2="80" />
            <line x1="82" y1="20" x2="18" y2="80" />
          </svg>
          {characters.map((person) => (
            <button
              key={person.id}
              className={`${styles.personNode} ${styles[`node${capitalize(person.id)}`]} ${focusedCharacter === person.id ? styles.personNodeActive : ""}`}
              onClick={() => setFocusedCharacter((current) => current === person.id ? null : person.id)}
              aria-pressed={focusedCharacter === person.id}
            >
              <b>{characterInitials[person.id]}</b><span><strong>{person.name}</strong><small>{person.shortRole}</small></span>
            </button>
          ))}
          <div className={styles.mapLegend}><i /> POTPORA <i /> PRITISAK</div>
        </div>

        <div className={styles.relationDetails}>
          {visibleRelations.map((relation) => {
            const score = state.relations[relation.id];
            const first = characters.find((person) => person.id === relation.people[0])!;
            const second = characters.find((person) => person.id === relation.people[1])!;
            const active = relation.id === scene.relation;
            return (
              <article key={relation.id} className={active ? styles.relationActive : ""}>
                <div><span>{first.name}</span><i>↔</i><span>{second.name}</span>{active && <b>AKTIVNA PROCJENA</b>}</div>
                <h3>{relation.label}</h3>
                <p>{relation.detail}</p>
                <div className={styles.compactMeters}><Meter label="Potpora" value={score.warmth} tone="warm" /><Meter label="Pritisak" value={score.friction} tone="hot" /></div>
              </article>
            );
          })}
        </div>
      </section>

      <footer className={styles.gameFooter}>
        <div><strong>GRAD PRUDINA / PROGRAM ODRŽI</strong><span>{!ready ? "Učitavanje lokalnog spisa…" : saveAvailable ? "Lokalni spis spremljen je na ovom uređaju." : "Program radi, ali preglednik ne dopušta trajno spremanje."}</span></div>
        <div><span>{state.totalMerges} {state.totalMerges === 1 ? "objedinjavanje" : "objedinjavanja"}</span><span>Najviša mjera {state.highestLevel}/{MAX_ITEM_LEVEL}</span></div>
        <button onClick={resetGame} className={resetArmed ? styles.resetArmed : ""}><RotateCcw size={16} />{resetArmed ? "Kliknite ponovno: obriši spis" : "Obriši lokalni spis"}</button>
      </footer>

      {tutorialStep !== null && (() => {
        const tutorial = tutorialSteps[tutorialStep];
        const TutorialIcon = tutorial.icon;
        const lastStep = tutorialStep === tutorialSteps.length - 1;
        return (
          <div className={styles.tutorialOverlay}>
            <section ref={tutorialRef} tabIndex={-1} className={styles.tutorialDialog} role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
              <button className={styles.tutorialClose} onClick={closeTutorial} aria-label="Zatvori upute"><X size={22} /></button>
              <div className={styles.tutorialSeal}><Landmark size={22} /><span>GRAD PRUDINA / JAVNI PILOT-PROGRAM</span></div>
              <div className={styles.tutorialIcon}><TutorialIcon size={54} /></div>
              <p>{tutorial.eyebrow}</p>
              <h2 id="tutorial-title">{tutorial.title}</h2>
              <span>{tutorial.body}</span>
              <div className={styles.tutorialProgress} aria-label={`Korak ${tutorialStep + 1} od ${tutorialSteps.length}`}>
                {tutorialSteps.map((step, index) => <i key={step.title} className={index <= tutorialStep ? styles.tutorialProgressActive : ""} />)}
              </div>
              <div className={styles.tutorialActions}>
                <button onClick={closeTutorial}>Preskoči upute</button>
                <div>
                  {tutorialStep > 0 && <button onClick={() => setTutorialStep((current) => Math.max(0, (current ?? 1) - 1))}><ChevronLeft size={18} />Natrag</button>}
                  <button className={styles.tutorialNext} onClick={() => lastStep ? closeTutorial() : setTutorialStep((current) => Math.min(tutorialSteps.length - 1, (current ?? 0) + 1))}>
                    {lastStep ? "Otvori lokalni spis" : "Dalje"}{!lastStep && <ChevronRight size={18} />}
                  </button>
                </div>
              </div>
            </section>
          </div>
        );
      })()}
    </main>
  );
}

function ProgramMetric({ icon: Icon, label, value, detail, tone }: { icon: LucideIcon; label: string; value: number; detail: string; tone: "mandate" | "stable" | "proof" }) {
  return (
    <article className={`${styles.programMetric} ${styles[`metric${capitalize(tone)}`]}`}>
      <Icon size={25} aria-hidden="true" />
      <div><span>{label}</span><strong>{value}%</strong></div>
      <i role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}><b style={{ width: `${value}%` }} /></i>
      <small>{detail}</small>
    </article>
  );
}

function PersonSeal({ id }: { id: CharacterId }) {
  const person = characters.find((candidate) => candidate.id === id)!;
  return <div className={styles.personSeal}><b>{characterInitials[id]}</b><span><strong>{person.name}</strong><small>{person.shortRole}</small></span></div>;
}

function Meter({ label, value, tone }: { label: string; value: number; tone: "warm" | "hot" }) {
  return (
    <div className={`${styles.meter} ${tone === "warm" ? styles.meterWarm : styles.meterHot}`}>
      <span>{label}</span><strong>{value}</strong>
      <i role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}><b style={{ width: `${value}%` }} /></i>
    </div>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
