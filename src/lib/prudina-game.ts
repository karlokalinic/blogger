export type PrudinaResource = "materials" | "data" | "energy";

export type PrudinaLandmarkId = "fountain" | "clinic" | "waterworks" | "radio" | "roofs" | "archive";

export type PrudinaLandmark = {
  id: PrudinaLandmarkId;
  name: string;
  district: string;
  detail: string;
  model: "fountain" | "clinic" | "pipes" | "tower" | "roofs" | "archive";
  x: number;
  y: number;
  cost: Record<PrudinaResource, number> & { money: number; trust: number };
};

export type PrudinaEvent = {
  id: string;
  title: string;
  body: string;
  severity: "pressure" | "opportunity" | "failure" | "recovery";
  at: number;
};

export type PrudinaGameState = {
  money: number;
  trust: number;
  stability: number;
  attention: number;
  materials: number;
  data: number;
  energy: number;
  citizens: number;
  processors: number;
  meshNodes: number;
  filters: number;
  day: number;
  selected: PrudinaLandmarkId;
  completed: PrudinaLandmarkId[];
  landmarkProgress: Record<PrudinaLandmarkId, number>;
  log: PrudinaEvent[];
  lastEventAt: number;
  cinematic: PrudinaLandmarkId | null;
};

export const prudinaLandmarks: PrudinaLandmark[] = [
  { id: "fountain", name: "Fountain at Trg Sjecanja", district: "Civic core", detail: "A public object that became a sensor mast, meeting point and propaganda image.", model: "fountain", x: 49, y: 50, cost: { money: 320, materials: 26, data: 20, energy: 10, trust: 10 } },
  { id: "clinic", name: "Old Prudina Clinic", district: "Lower blocks", detail: "Triage rooms share staff, generators and sample logs with three other institutions.", model: "clinic", x: 29, y: 38, cost: { money: 460, materials: 34, data: 30, energy: 18, trust: 15 } },
  { id: "waterworks", name: "Karst Pumping Station", district: "Underground service", detail: "Old pipes cross limestone, illegal dumping sites and maps nobody fully trusts.", model: "pipes", x: 68, y: 68, cost: { money: 540, materials: 46, data: 34, energy: 26, trust: 18 } },
  { id: "radio", name: "Local Radio Relay", district: "Hill road", detail: "The emergency signal is both warning system and engagement engine.", model: "tower", x: 74, y: 29, cost: { money: 380, materials: 24, data: 44, energy: 20, trust: 12 } },
  { id: "roofs", name: "Solar Roof Cooperative", district: "New terraces", detail: "No miracle tech, just contracts, batteries, roof work and people who still answer calls.", model: "roofs", x: 38, y: 71, cost: { money: 620, materials: 42, data: 28, energy: 36, trust: 20 } },
  { id: "archive", name: "Municipal Data Archive", district: "Basement office", detail: "Records, photos, complaints and pump telemetry become VEO's imperfect nervous system.", model: "archive", x: 18, y: 66, cost: { money: 410, materials: 18, data: 56, energy: 16, trust: 22 } },
];

export function starterPrudinaState(): PrudinaGameState {
  return {
    money: 780,
    trust: 46,
    stability: 68,
    attention: 24,
    materials: 18,
    data: 16,
    energy: 14,
    citizens: 7,
    processors: 1,
    meshNodes: 0,
    filters: 0,
    day: 1,
    selected: "fountain",
    completed: [],
    landmarkProgress: { fountain: 8, clinic: 0, waterworks: 0, radio: 0, roofs: 0, archive: 0 },
    log: [{ id: "start", title: "VEO patchwork begins", body: "Prudina receives no miracle. It receives linked repairs, cheap sensors and a slogan: Igraj da Prudina radi.", severity: "pressure", at: Date.now() }],
    lastEventAt: Date.now(),
    cinematic: null,
  };
}