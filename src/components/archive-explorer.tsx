"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { ArchiveEntry, ArchiveType } from "@/lib/types";

const filters: Array<["all" | ArchiveType, string]> = [
  ["all", "All records"],
  ["character", "Characters"],
  ["location", "Locations"],
  ["mission", "Missions"],
  ["item", "Items"],
  ["faction", "Institutions"],
  ["note", "Field notes"],
];

export function ArchiveExplorer({ entries }: { entries: ArchiveEntry[] }) {
  const [type, setType] = useState<"all" | ArchiveType>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"index" | "progress">("index");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const result = entries.filter((entry) => {
      const typeMatch = type === "all" || entry.type === type;
      const queryMatch = !normalized || [entry.title, entry.summary, entry.type, ...entry.tags].join(" ").toLowerCase().includes(normalized);
      return typeMatch && queryMatch;
    });
    return sort === "progress" ? [...result].sort((a, b) => b.progress - a.progress) : result;
  }, [entries, query, sort, type]);

  return (
    <>
      <div className="archive-controls">
        <div className="archive-filter-list" role="group" aria-label="Filter archive records">
          {filters.map(([value, label]) => (
            <button className={type === value ? "active" : ""} key={value} onClick={() => setType(value)}>
              {label}<span>{value === "all" ? entries.length : entries.filter((entry) => entry.type === value).length}</span>
            </button>
          ))}
        </div>
        <div className="archive-search">
          <Search size={16} aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search names, tags, evidence…" aria-label="Search archive" />
          {query && <button onClick={() => setQuery("")} aria-label="Clear search"><X size={14} /></button>}
        </div>
        <button className="sort-button" onClick={() => setSort((value) => value === "index" ? "progress" : "index")}>
          <SlidersHorizontal size={14} /> {sort === "index" ? "Index order" : "Most complete"}
        </button>
      </div>
      <div className="archive-result-count"><span>{String(filtered.length).padStart(2, "0")}</span> records received</div>
      {filtered.length ? (
        <div className="archive-grid">
          {filtered.map((entry, index) => (
            <Link className="archive-record" href={`/archive/${entry.slug}`} key={entry.slug}>
              <div className="record-image image-distort">
                <Image src={entry.image} alt="" fill sizes="(max-width: 800px) 100vw, 33vw" style={{ objectPosition: entry.imagePosition ?? "center" }} />
                <span className={`record-status ${entry.status}`}>{entry.status}</span>
                <span className="record-index">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <div className="record-type">{entry.eyebrow}</div>
              <h2>{entry.title}</h2>
              <p>{entry.summary}</p>
              <div className="record-bottom">
                <span>{entry.updated}</span>
                <div aria-label={`${entry.progress}% complete`}><i style={{ width: `${entry.progress}%` }} /></div>
                <strong>{entry.progress}%</strong>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="archive-empty"><span>NO SIGNAL</span><h2>Nothing matches that version of the world.</h2><button onClick={() => { setType("all"); setQuery(""); }}>Clear filters</button></div>
      )}
    </>
  );
}
