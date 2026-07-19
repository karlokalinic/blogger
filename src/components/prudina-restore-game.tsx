"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Coffee,
  Coins,
  Crown,
  Grid3X3,
  Heart,
  House,
  Image as ImageIcon,
  KeyRound,
  MessageCircleMore,
  PackagePlus,
  Plus,
  Radio,
  RotateCcw,
  ShoppingBag,
  ShoppingBasket,
  Sparkles,
  UtensilsCrossed,
  Volume2,
  VolumeX,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MAX_ITEM_LEVEL,
  addParcel,
  buyUpgrade,
  characters,
  chooseFamilyScene,
  collectTableIncome,
  mergesNeeded,
  relations,
  restorePrudinaMergeState,
  sceneForState,
  selectOrMergeTile,
  starterPrudinaMergeState,
  upgradeCost,
  type CharacterId,
  type PrudinaMergeState,
  type UpgradeId,
} from "@/lib/prudina-merge";
import styles from "./prudina-restore-game.module.css";

const SAVE_KEY = "prudina-svi-za-stolom-v1";
const SOUND_KEY = "prudina-svi-za-stolom-sound";

const itemLevels: Array<{ name: string; shortName: string; icon: LucideIcon }> = [
  { name: "Šalica kave", shortName: "Kava", icon: Coffee },
  { name: "Puna vrećica", shortName: "Vrećica", icon: ShoppingBag },
  { name: "Lonac za sve", shortName: "Lonac", icon: UtensilsCrossed },
  { name: "Vezeni stolnjak", shortName: "Stolnjak", icon: Grid3X3 },
  { name: "Obiteljska slika", shortName: "Slika", icon: ImageIcon },
  { name: "Ključ stare kuće", shortName: "Ključ", icon: KeyRound },
  { name: "Kuća na brdu", shortName: "Kuća", icon: House },
  { name: "Zlatna uspomena", shortName: "Uspomena", icon: Crown },
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
    title: "Veća torba",
    description: "Ponekad odmah donese predmet razine 2.",
    icon: ShoppingBasket,
    benefit: (level) => `${Math.round(Math.min(0.5, 0.06 + level * 0.11) * 100)}% bolji predmet`,
  },
  {
    id: "familyBook",
    title: "Ružina bilježnica",
    description: "Svako spajanje vrijedi više, a odluke daju dodatne priče.",
    icon: BookOpen,
    benefit: (level) => `+${level * 20}% kovanica / +${level} priča`,
  },
  {
    id: "longTable",
    title: "Dugi stol",
    description: "Kuća sama skuplja sitniš dok je igra otvorena.",
    icon: UtensilsCrossed,
    benefit: (level) => (level ? `+${2 + level * 3} svakih 5 s` : "Pasivna zarada zaključana"),
  },
  {
    id: "oldRadio",
    title: "Radio iz kredenca",
    description: "Nova obiteljska scena stiže nakon manje spajanja.",
    icon: Radio,
    benefit: (level) => `Nova scena nakon ${Math.max(1, 3 - level)} spajanja`,
  },
];

export function PrudinaRestoreGame() {
  const [state, setState] = useState<PrudinaMergeState>(() => starterPrudinaMergeState());
  const stateRef = useRef(state);
  const [ready, setReady] = useState(false);
  const [saveAvailable, setSaveAvailable] = useState(true);
  const [soundOn, setSoundOn] = useState(false);
  const [focusedCharacter, setFocusedCharacter] = useState<CharacterId | null>(null);
  const [resetArmed, setResetArmed] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);

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
    if (audioRef.current && audioRef.current.state !== "closed") void audioRef.current.close();
  }, []);

  useEffect(() => {
    if (!resetArmed) return;
    const timer = window.setTimeout(() => setResetArmed(false), 4500);
    return () => window.clearTimeout(timer);
  }, [resetArmed]);

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
        <Link href="/" className={styles.backLink}><ArrowLeft size={18} /><span>Natrag u VEO arhiv</span></Link>
        <div className={styles.brand}>
          <span>PRUDINA / DOM KULTURE / IGRA 01</span>
          <h1>Svi za stolom</h1>
        </div>
        <div className={styles.resources} aria-label="Tvoji resursi">
          <div><Coins size={18} /><span>Kovanice</span><strong>{state.coins}</strong></div>
          <div><BookOpen size={18} /><span>Priče</span><strong>{state.stories}</strong></div>
        </div>
        <button className={styles.soundButton} onClick={toggleSound} aria-label={soundOn ? "Isključi zvuk" : "Uključi zvuk"}>
          {soundOn ? <Volume2 size={19} /> : <VolumeX size={19} />}
          <span>{soundOn ? "Zvuk" : "Tiho"}</span>
        </button>
      </header>

      <section className={styles.intro} aria-labelledby="game-title">
        <div>
          <p>IGRA SPAJANJA ZA CIJELU KUĆU</p>
          <h2 id="game-title">Dva ista postaju jedno bolje.</h2>
          <span>Klikni, spoji, zaradi i nadogradi stol. Igra se sama sprema na ovom uređaju.</span>
        </div>
        <ol className={styles.steps}>
          <li><b>1</b><span><strong>Dodaj</strong> predmet</span></li>
          <li><b>2</b><span><strong>Klikni dva</strong> ista</span></li>
          <li><b>3</b><span><strong>Kupi</strong> nadogradnju</span></li>
        </ol>
      </section>

      <div className={styles.gameLayout}>
        <section className={styles.boardPanel} aria-labelledby="board-title">
          <div className={styles.panelHeader}>
            <div><span>STOL U DNEVNOJ SOBI</span><h2 id="board-title">Spoji predmete</h2></div>
            <div className={styles.tableStatus}><strong>{emptyCount}</strong><span>slobodnih mjesta</span></div>
          </div>

          <div className={styles.levelTrail} aria-label={`Najviša otključana razina je ${state.highestLevel}`}>
            {itemLevels.map((item, index) => {
              const Icon = item.icon;
              const level = index + 1;
              return <div key={item.name} className={level <= state.highestLevel ? styles.levelUnlocked : ""} title={item.name}><Icon size={16} /><span>{level}</span></div>;
            })}
          </div>

          <div className={styles.tablecloth}>
            <div className={styles.board} role="group" aria-label="Ploča s predmetima, četiri puta četiri">
              {state.board.map((tile, index) => {
                if (!tile) return <button key={`empty-${index}`} data-testid={`board-cell-${index}`} className={styles.emptyCell} onClick={() => handleCell(index)} aria-label={`Prazno mjesto ${index + 1}. Klikni za novi predmet.`}><Plus size={16} aria-hidden="true" /></button>;
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
                    aria-label={`${item.name}, razina ${tile.level}${selected ? ", odabrano" : ""}`}
                    onClick={() => handleCell(index)}
                  >
                    <span className={styles.tileShine} aria-hidden="true" />
                    <Icon className={styles.tileIcon} aria-hidden="true" />
                    <strong>{item.shortName}</strong>
                    <small>RAZINA {tile.level}</small>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.boardActions}>
            <button className={styles.addButton} onClick={handleAddParcel} disabled={emptyCount === 0}>
              <PackagePlus size={25} />
              <span><strong>Dodaj na stol</strong><small>{emptyCount ? "BESPLATAN NOVI PREDMET" : "PRVO SPOJI DVA ISTA"}</small></span>
            </button>
            <div className={styles.liveMessage} aria-live="polite"><Sparkles size={18} /><span>{state.lastMessage}</span></div>
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
                <p>NOVA SCENA</p>
                <h2 id="scene-title">{scene.title}</h2>
                <blockquote>{scene.body}</blockquote>
                <div className={styles.sceneMeters}>
                  <Meter label="Bliskost" value={sceneScore.warmth} tone="warm" />
                  <Meter label="Zamjeranje" value={sceneScore.friction} tone="hot" />
                </div>
                <div className={styles.choices}>
                  {scene.choices.map((choice, index) => <button key={choice.label} onClick={() => handleChoice(index as 0 | 1)}><span>{index + 1}</span>{choice.label}</button>)}
                </div>
              </>
            ) : (
              <div className={styles.sceneWaiting}>
                <p>SLJEDEĆA SCENA</p>
                <h2 id="scene-title">Priča čeka novi predmet.</h2>
                <span>Spoji još {Math.max(0, neededForScene - state.mergesSinceScene)} {neededForScene - state.mergesSinceScene === 1 ? "par" : "para"} da čuješ što se dogodilo između {scenePeople[0].name} i {scenePeople[1].name}.</span>
                <div className={styles.sceneProgress} aria-label={`${sceneProgress} od ${neededForScene} spajanja`}>{Array.from({ length: neededForScene }, (_, index) => <i key={index} className={index < sceneProgress ? styles.progressFilled : ""} />)}</div>
              </div>
            )}
          </section>

          <section className={styles.shop} id="ducan" aria-labelledby="shop-title">
            <div className={styles.panelHeader}>
              <div><span>DUĆAN KRAJ AUTOBUSNE</span><h2 id="shop-title">Nadogradi kuću</h2></div>
              <ShoppingBasket size={24} />
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
                    <span className={styles.upgradePrice}>{maxed ? <b>GOTOVO</b> : <><Coins size={15} /><b>{cost}</b></>}<small>{level}/5</small></span>
                  </button>
                );
              })}
            </div>
          </section>
        </aside>
      </div>

      <section className={styles.relationshipSection} id="odnosi" aria-labelledby="relations-title">
        <div className={styles.relationshipIntro}>
          <span>RODBINSKI GOBLEN / ŽIVO STANJE</span>
          <h2 id="relations-title">Ovdje se ljubav i napad ne poništavaju.</h2>
          <p>U Prudini ista osoba može donijeti lijek, proširiti glasinu, platiti račun i zahtijevati zahvalnost. Klikni lice da vidiš njegove veze.</p>
          <button className={!focusedCharacter ? styles.filterActive : ""} onClick={() => setFocusedCharacter(null)}>Prikaži sve veze</button>
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
          <div className={styles.mapLegend}><i /> BLISKOST <i /> ZAMJERANJE</div>
        </div>

        <div className={styles.relationDetails}>
          {visibleRelations.map((relation) => {
            const score = state.relations[relation.id];
            const first = characters.find((person) => person.id === relation.people[0])!;
            const second = characters.find((person) => person.id === relation.people[1])!;
            const active = relation.id === scene.relation;
            return (
              <article key={relation.id} className={active ? styles.relationActive : ""}>
                <div><span>{first.name}</span><i>↔</i><span>{second.name}</span>{active && <b>SLJEDEĆA SCENA</b>}</div>
                <h3>{relation.label}</h3>
                <p>{relation.detail}</p>
                <div className={styles.compactMeters}><Meter label="Bliskost" value={score.warmth} tone="warm" /><Meter label="Zamjeranje" value={score.friction} tone="hot" /></div>
              </article>
            );
          })}
        </div>
      </section>

      <footer className={styles.gameFooter}>
        <div><strong>VEO ZAVOD / PRUDINA</strong><span>{!ready ? "Učitavanje napretka…" : saveAvailable ? "Napredak je spremljen na ovom uređaju." : "Igra radi, ali preglednik ne dopušta trajno spremanje."}</span></div>
        <div><span>{state.totalMerges} spajanja</span><span>Najviša razina {state.highestLevel}/{MAX_ITEM_LEVEL}</span></div>
        <button onClick={resetGame} className={resetArmed ? styles.resetArmed : ""}><RotateCcw size={16} />{resetArmed ? "Klikni opet: obriši napredak" : "Počni ispočetka"}</button>
      </footer>
    </main>
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
