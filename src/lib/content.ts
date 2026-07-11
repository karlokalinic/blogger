import type { ArchiveEntry, DevlogPost, ProjectTask } from "./types";

export const project = {
  title: "VEO ZAVOD",
  subtitle: "An archive of a place learning to remember you",
  chapter: "PRE-PRODUCTION // WINTER BUILD",
  completion: 38,
  build: "0.4.7",
};

export const archiveEntries: ArchiveEntry[] = [
  {
    slug: "branimir-vukelic",
    type: "character",
    title: "Branimir Vukelić",
    eyebrow: "CHARACTER // P-04",
    summary: "The last technician at a transmitter everyone claims is automated.",
    description: [
      "Branimir has kept Radio Glas Prudine alive through four directors, two privatizations and a winter in which nobody paid the electricity bill. He knows which switches are decorative and which lies keep the town calm.",
      "He does not guard a secret because it is valuable. He guards it because admitting the truth would turn thirty years of obedience into a choice.",
    ],
    image: "/images/branimir.png",
    status: "canon",
    progress: 72,
    tags: ["radio", "municipal", "witness", "winter"],
    connections: ["The Repeater", "Radio Glas Prudine", "Water sample 04"],
    updated: "11 JUL 2026",
    quote: "A signal is not the same thing as a voice. People forget that first.",
    facts: [
      { label: "Age", value: "58" },
      { label: "Occupation", value: "Radio technician" },
      { label: "Need", value: "To remain useful" },
      { label: "Contradiction", value: "Repairs what he refuses to hear" },
    ],
  },
  {
    slug: "motel-bijeli-jelen",
    type: "location",
    title: "Motel Bijeli Jelen",
    eyebrow: "LOCATION // L-07",
    summary: "Fourteen rooms, eleven keys and one guest who never checks out on paper.",
    description: [
      "The Bijeli Jelen survives on drivers who miss the last turn before snow closes the road. Its hot water works by rumor. Every room has the same landscape print, hung at a slightly different height.",
      "The player arrives here for shelter and discovers a place organized around being passed through. Nothing is hidden. Nobody has ever looked long enough.",
    ],
    image: "/images/motel-bijeli-jelen.png",
    status: "canon",
    progress: 61,
    tags: ["motel", "hub", "night", "road"],
    connections: ["Room 12", "Marija", "Last bus from Zagreb"],
    updated: "10 JUL 2026",
    quote: "Reception closes when the road does. The road closes when we say it does.",
    facts: [
      { label: "Built", value: "1978" },
      { label: "Rooms", value: "14 / 11 keys" },
      { label: "Gameplay", value: "Social hub + save room" },
      { label: "Weather state", value: "Sleet / blackout" },
    ],
  },
  {
    slug: "water-sample-04",
    type: "item",
    title: "Water Sample 04",
    eyebrow: "EVIDENCE // I-13",
    summary: "Collected downstream. Logged upstream. The dates agree too perfectly.",
    description: [
      "A cloudy sample taken from a kitchen tap in Old Prudina. The municipal label records a source point twelve kilometres away and forty minutes before the player collected it.",
      "It can be surrendered, hidden or poured away. None of those actions proves what was in the bottle. Each proves something about the person holding it.",
    ],
    image: "/images/municipal-evidence.png",
    status: "canon",
    progress: 88,
    tags: ["evidence", "water", "choice", "inventory"],
    connections: ["Municipal laboratory", "Deni", "Mission: Clear enough"],
    updated: "09 JUL 2026",
    facts: [
      { label: "Type", value: "Quest evidence" },
      { label: "Condition", value: "Unsealed" },
      { label: "Branch count", value: "3" },
      { label: "Verified", value: "No" },
    ],
  },
  {
    slug: "clear-enough",
    type: "mission",
    title: "Clear Enough",
    eyebrow: "MISSION // M-03",
    summary: "Carry a bottle across town without deciding what it means too early.",
    description: [
      "The task begins as an errand for a young doctor and becomes a tour of everyone who benefits from uncertainty. The bottle never changes. Its meaning does, six times.",
      "There is no morality meter. Characters remember who was allowed to see the sample, what the player called it, and whether the cap was still sealed.",
    ],
    image: "/images/prudina-bus-stop.png",
    status: "draft",
    progress: 44,
    tags: ["quest", "branching", "doctor", "town"],
    connections: ["Water Sample 04", "Young doctor", "Radio Glas Prudine"],
    updated: "08 JUL 2026",
    facts: [
      { label: "Act", value: "I" },
      { label: "Duration", value: "35–50 min" },
      { label: "States", value: "18 tracked" },
      { label: "Combat", value: "None" },
    ],
  },
  {
    slug: "radio-glas-prudine",
    type: "faction",
    title: "Radio Glas Prudine",
    eyebrow: "INSTITUTION // F-02",
    summary: "Local weather, missing dogs and the official version of yesterday.",
    description: [
      "The station broadcasts traffic, obituaries, folk requests and notices written by offices that no longer have staff. Its authority comes from repetition, not reach.",
      "Between songs, the player can hear consequences arrive before the people responsible know what they have done.",
    ],
    image: "/images/branimir.png",
    status: "draft",
    progress: 53,
    tags: ["radio", "institution", "broadcast", "consequence"],
    connections: ["Branimir Vukelić", "The Repeater", "Daily bulletin"],
    updated: "07 JUL 2026",
    facts: [
      { label: "Frequency", value: "97.4 FM" },
      { label: "Reach", value: "Unreliable" },
      { label: "Staff", value: "3" },
      { label: "Role", value: "Reactive narration" },
    ],
  },
  {
    slug: "repeater-field-note",
    type: "note",
    title: "The Repeater Does Not Hum",
    eyebrow: "FIELD NOTE // N-19",
    summary: "A sound design rule written after three failed ambience passes.",
    description: [
      "Machines in VEO ZAVOD never produce a generic horror drone. Every mechanical sound must imply a comprehensible process: a fan bearing, a contactor, a loose panel, current under load.",
      "Fear comes from recognizing the function and then hearing it continue after the function should have ended.",
    ],
    image: "/images/motel-bijeli-jelen.png",
    status: "canon",
    progress: 100,
    tags: ["audio", "rule", "repeater", "design"],
    connections: ["The Repeater", "Branimir Vukelić", "Audio bible"],
    updated: "06 JUL 2026",
    facts: [
      { label: "Discipline", value: "Sound design" },
      { label: "Rule", value: "Source before mood" },
      { label: "Status", value: "Locked" },
      { label: "Exception", value: "None yet" },
    ],
  },
];

export const devlogs: DevlogPost[] = [
  {
    slug: "making-fog-remember",
    number: "LOG 027",
    title: "Making the fog remember where you have been",
    dek: "A progress system should alter the world before it congratulates the player.",
    date: "11 JUL 2026",
    readTime: "6 MIN",
    category: "SYSTEMS",
    image: "/images/prudina-bus-stop.png",
    body: [
      {
        paragraphs: [
          "Most progress bars describe work after it happens. I wanted the town to do that job instead. A repaired streetlight, a moved chair and a voice on the radio can each become proof that the build changed, even when the player never sees a number.",
          "The website now uses the same idea. Completing a production task restores a signal in the project map. Visitors see a place becoming more legible; I see the ordinary work that made it happen.",
        ],
      },
      {
        heading: "The rule",
        paragraphs: [
          "Every milestone needs one public consequence and one private record. The public consequence tells a story. The private record prevents the story from becoming a lie.",
          "This is why a finished dialogue pass can unlock a new character fragment while the studio keeps the ugly checklist, the rejected lines and the reason the scene was rewritten.",
        ],
      },
    ],
  },
  {
    slug: "three-normal-actions",
    number: "LOG 026",
    title: "Three normal actions with heavy consequences",
    dek: "No red choice, no blue choice. Just a bottle, a key and somebody waiting.",
    date: "08 JUL 2026",
    readTime: "4 MIN",
    category: "NARRATIVE",
    image: "/images/municipal-evidence.png",
    body: [
      {
        paragraphs: [
          "The dramatic actions in Prudina are intentionally unimpressive. Deliver a sample. Return a key. Repeat what somebody said. The pressure comes from timing, access and the social cost of being seen doing something ordinary.",
          "A choice becomes heavy when the player understands enough to hesitate but not enough to calculate a correct answer.",
        ],
      },
    ],
  },
  {
    slug: "why-branimir-looks-tired",
    number: "LOG 025",
    title: "Why Branimir looks tired instead of frightening",
    dek: "The most useful character design note this week was to remove the performance.",
    date: "03 JUL 2026",
    readTime: "5 MIN",
    category: "CHARACTERS",
    image: "/images/branimir.png",
    body: [
      {
        paragraphs: [
          "Early versions dressed Branimir as a warning. Strong silhouette, deep shadows, too much certainty. He looked like the plot had already explained him.",
          "Now he is a municipal worker at the end of a shift. The threat, if there is one, lives in what a normal person can normalize over thirty winters.",
        ],
      },
    ],
  },
];

export const tasks: ProjectTask[] = [
  { id: "t1", title: "Lock Act I critical path", area: "Writing", state: "active", xp: 80 },
  { id: "t2", title: "Motel lobby lighting pass", area: "Art", state: "done", xp: 40 },
  { id: "t3", title: "Radio consequence event bus", area: "Code", state: "active", xp: 60 },
  { id: "t4", title: "Record winter room tone", area: "Audio", state: "blocked", xp: 35 },
  { id: "t5", title: "Publish July micro-devlog", area: "Community", state: "backlog", xp: 25 },
  { id: "t6", title: "Water sample inventory mesh", area: "Art", state: "done", xp: 45 },
  { id: "t7", title: "Branimir dialogue pass 2", area: "Writing", state: "active", xp: 55 },
];

export function findEntry(slug: string) {
  return archiveEntries.find((entry) => entry.slug === slug);
}

export function findPost(slug: string) {
  return devlogs.find((post) => post.slug === slug);
}
