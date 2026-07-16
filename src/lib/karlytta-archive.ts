const source = "/karlytta/source";

export const karlyttaSource = source;

export const karlyttaFacts = [
  { label: "Archive version", value: "v0.2 over v0.1" },
  { label: "Core identity", value: "Karla Vita Lukan / KARLYTTA" },
  { label: "Born", value: "18 Feb 1987, Prudina" },
  { label: "Public career", value: "2003-present" },
  { label: "Documents", value: "21 markdown files" },
  { label: "Data files", value: "25 JSON/CSV/SQLite/XLSX files" },
  { label: "Visual props", value: "12 SVG + 12 PNG previews" },
  { label: "Canon rule", value: "Fictional in-world evidence, status-labeled" },
];

export const karlyttaVisuals = [
  { src: `${source}/assets/karlytta_cover.jpg`, alt: "Karlytta archive cover artwork", title: "Archive cover", label: "00 / COVER", status: "orientation", caption: "The archive opens with the public icon before it lets the reader inspect the machinery around her." },
  { src: `${source}/visual_assets_v0_2/01_karlytta_2014_ticket.png`, alt: "Karlytta 2014 ticket artifact", title: "2014 ticket", label: "01 / PUBLIC MASTER", status: "artifact", caption: "A show object from the self-title era, where a name becomes legal surface and public mythology at once." },
  { src: `${source}/visual_assets_v0_2/02_nocni_zapis_card.png`, alt: "Nocni Zapis disputed source card", title: "NOCNI ZAPIS card", label: "02 / DISPUTED FILE", status: "disputed", caption: "The longer file is treated as materially real but not self-authenticating: useful, dangerous and contested." },
  { src: `${source}/visual_assets_v0_2/03_court_filing_cover.png`, alt: "Court filing cover artifact", title: "Court filing", label: "03 / LEGAL SURFACE", status: "class A", caption: "The complaint narrows the story into dates, defendants, exhibits and preservation orders." },
  { src: `${source}/visual_assets_v0_2/04_rp_breaking_lower_third.png`, alt: "RP Network breaking lower-third", title: "RP breaking strip", label: "04 / BROADCAST", status: "interested custodian", caption: "The broadcaster is both a source of public memory and a participant in how that memory was cut." },
  { src: `${source}/visual_assets_v0_2/05_narodna_kuca_vote.png`, alt: "Narodna Kuca vote graphic", title: "NARODNA KUCA vote", label: "05 / PARTICIPATION", status: "manufactured choice", caption: "The reality institution turns non-speculation into paid ritual and public feeling into a format." },
  { src: `${source}/visual_assets_v0_2/06_backstage_pass_blue4.png`, alt: "Blue backstage pass", title: "Backstage pass", label: "06 / ACCESS", status: "procedure", caption: "In Karlytta's file, doors, corridors and passes matter because pressure often arrives as logistics." },
  { src: `${source}/visual_assets_v0_2/07_fan_newsletter.png`, alt: "Fan newsletter artifact", title: "Fan newsletter", label: "07 / COUNTER-MEMORY", status: "partial custody", caption: "The fan archive preserves what official systems remove, but preservation can also become another kind of possession." },
  { src: `${source}/visual_assets_v0_2/08_emergency_broadcast.png`, alt: "Emergency broadcast artifact", title: "Emergency broadcast", label: "08 / CONTINUITY", status: "relicensed", caption: "ZRAKOPERKA becomes civil-protection sound, then recruitment language, then a rights dispute." },
  { src: `${source}/visual_assets_v0_2/09_clinic_access_log.png`, alt: "Clinic access log artifact", title: "Clinic access log", label: "09 / DOCTOR BRIDGE", status: "mandatory game bridge", caption: "The only required link to the Doctor plot is administrative: a protected patient file opened by a non-clinical account." },
  { src: `${source}/visual_assets_v0_2/10_fort_umbral_poster.png`, alt: "Fort Umbral poster artifact", title: "FORT UMBRALIS", label: "10 / WITHDRAWN WORK", status: "removed", caption: "A work about walls that protect by preventing exit becomes inconvenient after one premiere." },
  { src: `${source}/visual_assets_v0_2/11_protest_poster.png`, alt: "Protest poster artifact", title: "Protest poster", label: "11 / PUBLIC ANSWER", status: "reaction", caption: "The case becomes civic argument because everyone already had a way to interpret her." },
  { src: `${source}/visual_assets_v0_2/12_museum_label.png`, alt: "Museum label artifact", title: "Museum label", label: "12 / INSTITUTIONAL MEMORY", status: "curated", caption: "Respectability arrives late, and the archive refuses to let it clean the earlier evidence." },
];

export const karlyttaAudio = [
  { id: "official", title: "KARLYTTA", src: `${source}/assets/karlytta_official.ogg`, waveform: `${source}/analysis/waveform_official.png`, duration: "4:57", key: "F minor", tempo: "129.2 BPM", loudness: "-7.9 LUFS", status: "public master", note: "The official release: loud, continuous, broadcastable and treated as the stable cultural object." },
  { id: "extended", title: "KARLYTTA: NOCNI ZAPIS", src: `${source}/assets/karlytta_nocni_zapis.ogg`, waveform: `${source}/analysis/waveform_extended.png`, duration: "5:06", key: "F minor", tempo: "143.55 BPM", loudness: "-7.8 LUFS", status: "disputed source", note: "Not merely an appended outro. The archive treats it as contested but materially significant." },
];

export const karlyttaDiscography = [
  [2004, "PRVA", "single", "electro-folk", "firstness / ambition / abandonment"],
  [2006, "STO LICA", "album", "pop", "multiplication / mirrors / celebrity"],
  [2009, "TUDA SOBA", "album", "electronic folk", "rooms / access / privacy"],
  [2011, "FRIENDLY STAKES", "television album", "jazz-pop", "games / class / risk"],
  [2012, "NA UGOVOR I NA SAT", "single", "industrial pop", "contracts / labor / time"],
  [2013, "SIGNAL NE POSTOJI", "single", "electronic", "signals / silence / failure"],
  [2014, "KARLYTTA", "single", "club experimental", "name / refusal / authority"],
  [2014, "KARLYTTA: NOCNI ZAPIS", "alternate file", "club experimental", "cuts / ownership / guide voice"],
  [2016, "FORT UMBRALIS", "stage work", "symphonic electronic", "walls / protection / exit"],
  [2018, "MEMORIA MARIS", "opera-film", "opera electronic", "sea / memory / mourning"],
  [2020, "ZRAKOPERKA", "album", "futurist pop", "war / transport / body"],
  [2024, "ANESTEZIJA", "album", "clinical pop", "medicine / consent / body"],
  [2026, "SVE JE BILO VANI", "unreleased", "unknown", "testimony / memory / listening"],
] as const;

export const karlyttaTimeline = [
  [2007, "State and foundation performances begin; priority availability enters contracts."],
  [2008, "Restricted North House performance and the alleged coerced encounter named in the civil complaint."],
  [2013, "A seventeen-minute interview is reduced to six, manufacturing a durable image of instability."],
  [2014, "KARLYTTA is recorded; a 32-bit late export exists outside official delivery."],
  [2016, "FORT UMBRALIS premieres once and disappears under technical revision."],
  [2020, "ZRAKOPERKA is relicensed from civil-protection continuity into recruitment-adjacent public sound."],
  [2024, "A clinic access anomaly is documented internally without patient notification."],
  [2026, "Complaint filed, preservation order issued, and the archive becomes legally consequential."],
] as const;

export const karlyttaEvidence = [
  ["E003", "appearance addendum", "Foundation", "A", "priority availability undefined"],
  ["E004", "raw 2013 interview", "RP Archive", "A", "full seventeen minutes"],
  ["E007", "NOCNI ZAPIS file", "anonymous source", "C", "provenance unresolved"],
  ["E011", "clinic access log", "Clinic", "A", "non-clinical account"],
  ["E013", "three takedown notices", "multiple", "B", "different master codes"],
  ["E015", "preservation order", "Court", "A", "broad scope"],
] as const;

export const karlyttaClaims = [
  { id: "C01", status: "alleged", claim: "The civil complaint alleges sexual coercion after a restricted state performance.", counter: "Varda denies any private encounter outside official receptions." },
  { id: "C02", status: "partially documented", claim: "RP Network repeatedly made refusals and distress into entertainment clips.", counter: "The network argues that Karlytta approved broadcasts and profited from them." },
  { id: "C03", status: "disputed", claim: "The extended file preserves direction lines removed from the public master.", counter: "The producer calls it a fan reconstruction made from circulating stems." },
  { id: "C04", status: "under seal", claim: "Medical and travel records were allegedly used as appearance pressure.", counter: "The Presidency frames records access as routine security coordination." },
  { id: "C10", status: "optional game bridge", claim: "A clinic access record links media-security systems to protected medical data.", counter: "No diagnosis is visible; the connection may be mundane." },
];

export const karlyttaInstitutions = [
  ["RP Network", "Hybrid broadcaster", "Controls availability, timing and archive access."],
  ["NARODNA KUCA", "Reality institution", "Turns participation, confession and punishment into format."],
  ["Office of the President", "Executive", "Converts private demand into protocol language."],
  ["Prudina Clinic Complex", "Healthcare", "Where care, records and media-security access cross."],
  ["Karlytta Index", "Fan archive", "Counter-memory that can protect and invade at once."],
] as const;

export const karlyttaRelationships = [
  ["Ognjen Varda", "public partnership / alleged coercive control", "hostile"],
  ["Sonja Dravac", "mutual dependence through television", "ambivalent"],
  ["Dorian Belic", "artist-producer collaboration", "fractured"],
  ["Mina Plevnik", "artist-fan archivist", "protective conflict"],
  ["Lea Pazic", "client-attorney", "disciplined trust"],
  ["The Doctor", "structural parallel", "indirect"],
] as const;

export const karlyttaOpinion = [
  ["All respondents", 41, 22, 30, 7],
  ["Daily RP viewers", 28, 39, 27, 6],
  ["Non-RP news users", 55, 11, 28, 6],
  ["Healthcare workers", 58, 9, 29, 4],
  ["Karlytta listeners", 63, 8, 23, 6],
  ["Self-described non-listeners", 27, 28, 36, 9],
] as const;

export const karlyttaSocialFragments = [
  "The song did not become evidence. We became unable to pretend it was empty.",
  "A file can be authentic and still tell you nothing about the room.",
  "Everybody asks why she returned. Nobody asks who owned the doors.",
  "I worked records. Non-clinical access is not a metaphor.",
  "She can be cruel and still be telling the truth.",
  "Please stop diagnosing a woman from compression artifacts.",
];

export const karlyttaDocuments = [
  { title: "Season One Bible", href: `${source}/documents_v0_2/11_SEASON_ONE_BIBLE.md`, kind: "canon" },
  { title: "Identity Dossier", href: `${source}/documents_v0_2/01_IDENTITY_DOSSIER.md`, kind: "canon" },
  { title: "Career and Discography", href: `${source}/documents_v0_2/03_CAREER_AND_DISCOGRAPHY.md`, kind: "canon" },
  { title: "Lawsuit Timeline", href: `${source}/documents_v0_2/15_LAWSUIT_TIMELINE.md`, kind: "legal" },
  { title: "Archive Reliability Manual", href: `${source}/documents_v0_2/10_ARCHIVE_RELIABILITY_MANUAL.md`, kind: "method" },
  { title: "Doctor Bridge Scene", href: `${source}/documents_v0_2/09_DOCTOR_BRIDGE_SCENE.md`, kind: "game" },
  { title: "Original Canon Bible", href: `${source}/documents/KARLYTTA_CANON_BIBLE.md`, kind: "v0.1" },
  { title: "Lawsuit Legal Outline", href: `${source}/documents/LAWSUIT_LEGAL_OUTLINE.md`, kind: "v0.1" },
  { title: "Production Tracker XLSX", href: `${source}/KARLYTTA_PRODUCTION_TRACKER_v0_2.xlsx`, kind: "workbook" },
  { title: "SQLite database v0.2", href: `${source}/db/karlytta_archive_v0_2.sqlite`, kind: "database" },
  { title: "Expanded asset backlog JSON", href: `${source}/data_v0_2/expanded_asset_backlog.json`, kind: "data" },
  { title: "Original static gallery", href: `${source}/site_v0_2/index.html`, kind: "site" },
];