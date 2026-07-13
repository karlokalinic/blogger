export type ArchiveType = "character" | "location" | "mission" | "item" | "faction" | "note";

export type ArchiveEntry = {
  slug: string;
  type: ArchiveType;
  title: string;
  eyebrow: string;
  summary: string;
  description: string[];
  image: string;
  status: "canon" | "draft" | "cut";
  progress: number;
  tags: string[];
  connections: string[];
  updated: string;
  quote?: string;
  facts: Array<{ label: string; value: string }>;
};

export type DevlogPost = {
  slug: string;
  number: string;
  title: string;
  dek: string;
  date: string;
  readTime: string;
  category: string;
  image: string;
  imageAlt: string;
  captureLabel?: string;
  status: "prototype" | "implemented" | "testing" | "design-note";
  build: string;
  gallery?: DevlogShot[];
  model?: {
    url: string;
    pack: string;
    obj: string;
    name: string;
  };
  facts?: Array<{ label: string; value: string }>;
  code?: {
    filename: string;
    language: string;
    snippet: string;
  };
  tryIt?: string[];
  body: Array<{ heading?: string; paragraphs: string[] }>;
};

export type DevlogShot = {
  src: string;
  alt: string;
  caption: string;
  label: string;
  position?: string;
};

export type ProjectTask = {
  id: string;
  title: string;
  area: "Writing" | "Art" | "Code" | "Audio" | "Community";
  state: "done" | "active" | "blocked" | "backlog";
  xp: number;
};
