# Studio / Dnevnik rada — tehnički log

Datum: 2026-10-19
Grana: feature/studio-dnevnik-2026-10-19
Status: Vercel preview build READY; integracijski i produkcijski testovi nisu potvrđeni
Svrha: zapisati tekst + priložiti snimku + povezati projekt + odlučiti privatno/javno bez korištenja IDE-a.

## TL-001 — inventura prije zahvata

Izvor: karlokalinic/blogger (Next.js 16, React 19, Vercel, opcionalni Neon + Vercel Blob).
Pronađeno: postoje Studio, writing-desk, devlog, /api/posts, /api/upload, lokalni media-vault.
Zaključak: ne graditi novi paralelni CMS i ne zamijeniti postojeće tekstove ili dizajn.

## TL-002 — novi unos

Ruta /studio/dispatch; dvije nezavisne tekstne cjeline: TEHNIČKI DNEVNIK i PROZNI DNEVNIK.
Naziv i projekt čine metapodatke. Projekt se u MVP-u mapira na postojeće polje category.
Lokalni nacrti: localStorage, prefiks karlo-dispatch-entry-v1.
Lokalni privitci: IndexedDB karlo-dispatch-files-v1/files; ne prenose se ako je odabrano Privatno.
Izvoz: Markdown (.md). Ograničenje: izvoz bilježi samo nazive privitaka, ne kopira binarne datoteke.

## TL-003 — objavljivanje i mediji

Put spremanja: POST /api/posts (postojeći autorizirani API).
Ako je odabrano Javno, tek nakon dodatne potvrde izdaje se token za prijenos javnih datoteka.
Za video/audio koristi se direct client upload preko /api/upload-client, bez prolaska cijelog medija kroz Vercel Function (koja ima ograničenje tijela zahtjeva 4,5 MB).
Podržani odabrani formati: jpg/png/webp/gif/avif/mp4/webm/mp3/m4a/wav/ogg/flac/pdf/zip/txt/md.
MVP ograničenje: 12 privitaka, 50 MiB po datoteci (neograničene Unity buildove dodati kroz R2 kasnije).
Uspješni URL-ovi pamte se uz lokalni zapis radi izbjegavanja ponovnog uploada tijekom ponovnog pokušaja.
Objave: fotografije u postojeći gallery, audio/video/datoteke u posebno parsirane blokove teksta javnog devloga.

## TL-004 — sigurnost

- Produkcijski studio-session više ne prihvaća predvidljiv lokalni fallback kada AUTH_SECRET/STUDIO_PASSWORD nisu konfigurirani.
- /api/upload-client izdaje token samo uz postojeću studio autentifikaciju; server također provjerava putanju, tip i maksimalnu veličinu.
- Privatni mediji NE koriste javni Blob URL; ostaju u lokalnoj IndexedDB i nemaju automatski sinkroniziranu kopiju.
- Promjena objave u privatnu uklanja published_at u bazi. To NE briše prethodno javno prenesenu datoteku iz Bloba.
- Već objavljeni sadržaj može biti kopiran ili arhiviran izvan ove stranice; ne obećavati reverzibilnost javne objave.

## TL-005 — provjere

Provedeno: pregled postojećih GitHub datoteka i kontrolirano zapisivanje na zasebnoj grani.
Automatski Vercel build: READY (git commit 30d83afe8216899909fa9a75a236c41a45b61cae), GitHub Vercel check: success.
Nije zasebno potvrđeno: npm run lint, npm test, browser e2e, spoj na stvarnu bazu, Vercel Blob upload u stvarnoj sesiji.
Razlog izostanka lokalnog izvođenja: iz ovog radnog okruženja javni Git clone nije dostupan (DNS mreža nedostupna).
Vercel preview: karlolegendblog-git-feature-studi-4010f5-karlokalinics-projects.vercel.app.
Konfiguracija: imena DATABASE_URL, BLOB_READ_WRITE_TOKEN, AUTH_SECRET i STUDIO_PASSWORD postoje u Vercel projektu za preview, bez čitanja vrijednosti; njihova valjanost nije provjerena.
Provjeriti PRIJE mergea:
1. U CI izvršiti npm ci && npm run lint && npx tsc --noEmit && npm test && npm run build.
2. /studio/dispatch bez prijave vraća login/odbijanje.
3. Napisati privatni unos i provjeriti da nema javnog URL-a datoteke ni rezultata na /devlog.
4. Dodati screenshot i video >4,5 MB, objaviti, provjeriti sliku i HTML5 player.
5. Izmijeniti javni zapis u privatni; provjeriti da nije u javnom popisu niti dostupan po slug-u.
6. Reload preglednika; provjeriti očuvane tekstne nacrte i lokalne privitke.
7. Pokušati unauthenticated token upload; očekivani odgovor 403.
8. Pregledati eventualne siroče Blob objekte nakon djelomično neuspješnih prijenosa.

## TL-006 — otvoreni zadaci / poznata ograničenja

- Još nije zaseban Cloudflare D1/R2 backend: postojeći repo koristi Neon + Vercel Blob.
- Veza s projektom trenutno je kategorija teksta, a ne referencijalni strani ključ tablice projects.
- Privatni privitci nisu dostupni na drugom uređaju i moraju se ručno sigurnosno kopirati.
- Nema posebnog brisanja javnih Blob datoteka i automatskog čišćenja siročića.
- Ne postoji zajedničko uređivanje niti pregled pristiglih javnih prijedloga.
- Korisnički i integracijski testovi tek trebaju potvrditi funkcionalnost.

Sljedeći tehnički zahvat: stabilna strukturirana veza entry -> project (project_id) i privatni R2 bucket, uz backend autorizaciju pristupa datoteci.
