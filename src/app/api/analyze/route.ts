import { z } from "zod";

const schema = z.object({ text: z.string().min(1).max(80_000) });
const stopWords = new Set(["the", "and", "that", "this", "with", "from", "have", "were", "was", "for", "but", "into", "because", "they", "them", "their", "then", "than", "when", "what", "which", "would", "could", "about", "there", "only", "still", "very", "just", "also"]);

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Text is missing or too long." }, { status: 400 });

  const text = parsed.data.text.trim();
  const words = text.match(/[\p{L}\p{N}'’\-]+/gu) ?? [];
  const sentenceParts = text.split(/[.!?]+(?:\s|$)/).map((part) => part.trim()).filter(Boolean);
  const sentences = Math.max(1, sentenceParts.length);
  const average = words.length / sentences;
  const longSentences = sentenceParts.filter((sentence) => (sentence.match(/[\p{L}\p{N}'’\-]+/gu) ?? []).length > 30).length;
  const shortSentences = sentenceParts.filter((sentence) => (sentence.match(/[\p{L}\p{N}'’\-]+/gu) ?? []).length <= 5).length;
  const frequency = new Map<string, number>();
  for (const raw of words) {
    const word = raw.toLowerCase();
    if (word.length < 5 || stopWords.has(word)) continue;
    frequency.set(word, (frequency.get(word) ?? 0) + 1);
  }
  const repeats = [...frequency.entries()]
    .filter(([, count]) => count >= Math.max(3, Math.ceil(words.length / 90)))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([word]) => word);

  const fillerMatches = text.match(/\b(really|actually|basically|somehow|suddenly|very|just)\b/gi) ?? [];
  const duplicateOpenings = new Map<string, number>();
  for (const sentence of sentenceParts) {
    const first = sentence.match(/[\p{L}]+/u)?.[0]?.toLowerCase();
    if (first) duplicateOpenings.set(first, (duplicateOpenings.get(first) ?? 0) + 1);
  }
  const repeatedOpening = [...duplicateOpenings.entries()].find(([, count]) => count >= 3)?.[0];
  let clarity = 92;
  clarity -= Math.min(18, longSentences * 4);
  clarity -= Math.min(12, fillerMatches.length * 2);
  clarity -= Math.min(10, repeats.length * 2);
  if (average > 24) clarity -= 8;
  clarity = Math.max(42, Math.min(98, Math.round(clarity)));

  const notes: Array<{ tone: "good" | "warn" | "info"; title: string; detail: string }> = [];
  if (longSentences > 0) notes.push({ tone: "warn", title: `${longSentences} loaded sentence${longSentences === 1 ? "" : "s"}`, detail: "Over 30 words. Keep them if the pressure is intentional; split only where the thought truly turns." });
  else notes.push({ tone: "good", title: "Sentence load is controlled", detail: "No sentence crosses the diagnostic threshold." });
  if (shortSentences >= 2) notes.push({ tone: "good", title: "Useful changes of pace", detail: `${shortSentences} short sentences give the prose places to land.` });
  if (fillerMatches.length) notes.push({ tone: "info", title: "Possible softeners", detail: `${fillerMatches.length} uses of words such as “really”, “actually” or “just”. Some may be voice; inspect, do not purge.` });
  if (repeatedOpening) notes.push({ tone: "info", title: `Repeated opening: “${repeatedOpening}”`, detail: "Three or more sentences start here. It may be rhythm, or it may be habit." });
  if (!notes.some((note) => note.tone === "warn")) notes.push({ tone: "good", title: "No obvious mechanical obstruction", detail: "The diagnostic can read the text without fighting its structure. Meaning is still your judgment." });

  return Response.json({ words: words.length, sentences, readingMinutes: Math.max(1, Math.ceil(words.length / 220)), clarity, notes, repeats });
}
