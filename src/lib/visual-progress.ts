export type VisualFrame = {
  src: string;
  alt: string;
  label: string;
  caption: string;
  status: "capture" | "concept" | "target";
};

export type VisualChapter = {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  progress: number;
  phase: string;
  playable: string;
  frames: VisualFrame[];
};

export type VisualRecord = {
  id: string;
  name: string;
  kind: string;
  image: string;
  alt: string;
  progress: number;
  note: string;
};

export const visualChapters: VisualChapter[] = [
  {
    id: "return",
    number: "00",
    title: "The return",
    subtitle: "A funeral, the last bus and a town that has already prepared an explanation.",
    progress: 88,
    phase: "PLAYABLE ROUTE",
    playable: "12–16 MIN",
    frames: [
      { src: "/images/prudina-night-watch.png", alt: "A solitary passenger waiting at the snowbound Prudina bus station", label: "C-00 / LAST BUS", caption: "Arrival camera. The road is large, the returning passenger is deliberately small.", status: "target" },
      { src: "/images/prudina-bus-stop.png", alt: "Prudina bus shelter disappearing into fog", label: "C-01 / FIRST BUILD", caption: "Earlier environment capture retained as visible evidence of the lighting and composition change.", status: "capture" },
      { src: "/images/protagonist-funeral.png", alt: "The returning protagonist outside a winter funeral hall", label: "C-03 / FUNERAL EXIT", caption: "The crisis begins before control: the burial is over, but leaving has not become possible.", status: "concept" },
    ],
  },
  {
    id: "clear-enough",
    number: "01",
    title: "Clear enough",
    subtitle: "Carry a water sample through every institution that benefits from uncertainty.",
    progress: 72,
    phase: "SYSTEMS + DIALOGUE",
    playable: "34–48 MIN",
    frames: [
      { src: "/images/clinic-water-lab.png", alt: "Municipal clinic laboratory filled with cloudy water samples", label: "C-11 / CLINIC", caption: "The clinic is practical, underfunded and already politically compromised before anyone lies.", status: "target" },
      { src: "/images/deni-clinic.png", alt: "Young doctor Deni alone in the municipal clinic", label: "C-12 / DENI", caption: "Deni begins in crisis: he has evidence he cannot validate without the people implicated by it.", status: "concept" },
      { src: "/images/water-protest.png", alt: "Residents protesting contaminated water outside a municipal building", label: "C-14 / PUBLIC LINE", caption: "The private sample becomes public language. Nobody in the crowd agrees on what has been proven.", status: "concept" },
      { src: "/images/municipal-evidence.png", alt: "Water sample and municipal evidence arranged beneath a desk lamp", label: "C-15 / SAMPLE 04", caption: "The object remains visually ordinary while access, timing and witnesses change its meaning.", status: "capture" },
    ],
  },
  {
    id: "signal-loss",
    number: "02",
    title: "Signal loss",
    subtitle: "The town radio repeats a safe route after the route stops being safe.",
    progress: 49,
    phase: "VERTICAL SLICE",
    playable: "22–30 MIN",
    frames: [
      { src: "/images/radio-control-room.png", alt: "Radio control room lit by one red emergency lamp", label: "C-20 / BLACKOUT", caption: "A fixed-camera lighting target for the first station power failure.", status: "target" },
      { src: "/images/branimir.png", alt: "Branimir, the last radio technician, at the end of a shift", label: "C-21 / BRANIMIR", caption: "He repairs a public signal while refusing to hear what it has started saying.", status: "capture" },
      { src: "/images/repeater-forest.png", alt: "Radio repeater tower inside a restricted snowy forest", label: "C-24 / REPEATER", caption: "The chapter leaves town only after the familiar broadcast becomes unusable.", status: "target" },
      { src: "/images/viktor-inspector.png", alt: "Municipal inspector Viktor inside a dark service office", label: "C-26 / VIKTOR", caption: "Viktor's crisis is administrative: the document that protects him also proves when he knew.", status: "concept" },
    ],
  },
  {
    id: "under-town",
    number: "03",
    title: "Under the town",
    subtitle: "The infrastructure works. That is precisely the problem.",
    progress: 23,
    phase: "ENVIRONMENT BLOCKOUT",
    playable: "NOT CONNECTED",
    frames: [
      { src: "/images/underground-pumping.png", alt: "Vast underground pumping station beneath Prudina", label: "C-30 / CENTRAL", caption: "Low-poly scale study with the player reduced to a maintenance detail inside the machine.", status: "target" },
      { src: "/images/slaughterhouse-loading.png", alt: "Abandoned slaughterhouse loading floor during a blackout", label: "C-32 / TRANSFER", caption: "An empty industrial route linking the municipal supply network to private contractors.", status: "target" },
      { src: "/images/marija-motel.png", alt: "Motel keeper Marija behind the reception desk during a blackout", label: "C-34 / MARIJA", caption: "Marija already knows which guests used the service tunnel. Her crisis is deciding who still counts as a guest.", status: "concept" },
      { src: "/images/motel-bijeli-jelen.png", alt: "Motel Bijeli Jelen in freezing rain", label: "C-35 / SURFACE", caption: "The motel remains the surface landmark for a chapter that increasingly happens below it.", status: "capture" },
    ],
  },
];

export const visualLocations: VisualRecord[] = [
  { id: "bus-stop", name: "Last bus stop", kind: "ARRIVAL", image: "/images/prudina-night-watch.png", alt: "Snowbound Prudina bus stop", progress: 91, note: "Camera and lighting target locked" },
  { id: "motel", name: "Motel Bijeli Jelen", kind: "HUB", image: "/images/motel-bijeli-jelen.png", alt: "Motel Bijeli Jelen in winter rain", progress: 67, note: "Lobby loop playable" },
  { id: "clinic", name: "Old Prudina clinic", kind: "SOCIAL", image: "/images/clinic-water-lab.png", alt: "Old Prudina municipal clinic", progress: 58, note: "Dialogue blockout" },
  { id: "station", name: "Radio Glas Prudine", kind: "SIGNAL", image: "/images/radio-control-room.png", alt: "Dark radio control room", progress: 76, note: "Blackout event testing" },
  { id: "repeater", name: "The Repeater", kind: "EXTERIOR", image: "/images/repeater-forest.png", alt: "Repeater tower in a snowy military forest", progress: 41, note: "Lighting target only" },
  { id: "slaughterhouse", name: "Transfer floor", kind: "INDUSTRIAL", image: "/images/slaughterhouse-loading.png", alt: "Abandoned slaughterhouse loading floor", progress: 29, note: "Environment blockout" },
  { id: "central", name: "Sublevel central", kind: "INFRASTRUCTURE", image: "/images/underground-pumping.png", alt: "Underground pumping station", progress: 22, note: "Scale and route study" },
];

export const visualNpcs: VisualRecord[] = [
  { id: "returner", name: "The returner", kind: "PLAYER", image: "/images/protagonist-funeral.png", alt: "Returning protagonist outside a funeral hall", progress: 64, note: "Movement model in test" },
  { id: "branimir", name: "Branimir Vukelić", kind: "RADIO TECHNICIAN", image: "/images/branimir.png", alt: "Branimir in his radio workspace", progress: 79, note: "Act I dialogue pass two" },
  { id: "deni", name: "Deni", kind: "YOUNG DOCTOR", image: "/images/deni-clinic.png", alt: "Deni alone in the clinic", progress: 61, note: "Sample route integrated" },
  { id: "marija", name: "Marija", kind: "MOTEL KEEPER", image: "/images/marija-motel.png", alt: "Marija behind the motel desk", progress: 52, note: "Crisis scene drafted" },
  { id: "viktor", name: "Viktor", kind: "INSPECTOR", image: "/images/viktor-inspector.png", alt: "Viktor in a municipal service office", progress: 46, note: "Consequence graph in progress" },
];
