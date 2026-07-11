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
  body: Array<{ heading?: string; paragraphs: string[] }>;
};

export type ProjectTask = {
  id: string;
  title: string;
  area: "Writing" | "Art" | "Code" | "Audio" | "Community";
  state: "done" | "active" | "blocked" | "backlog";
  xp: number;
};
