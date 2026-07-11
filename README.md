# VEO ZAVOD — game-development archive and creator studio

Production-ready Next.js template for `karlolegendblog.vercel.app`. The public side is a cinematic development journal and searchable world archive. The studio is a local-first writing, media, 3D, whiteboard, database and progress workspace.

## What is already functional

- Public homepage, devlog index/posts, world archive filters and individual dossiers
- Generated, original PSX-inspired production imagery
- RSS, sitemap, robots, Open Graph metadata, responsive layouts and reduced-motion support
- Real HTML audio player with Media Session controls for phone lock screens/background playback
- Writing desk with autosave, Markdown-safe tools, export and a deterministic text diagnostic
- Guided character/location/mission/item/institution/note wizard
- Persistent whiteboard with draggable notes, drawing, local save and JSON export
- IndexedDB media vault for photos, video, documents, audio and model source files
- Three.js GLB/GLTF inspector with orbit, zoom, wireframe and geometry statistics
- Drag-and-drop production board, signal XP and public narrative unlocks
- Private rule-based check-in that does not call an AI or autosave without permission
- Optional owner passcode with an HTTP-only signed session
- Optional Neon Postgres and Vercel Blob adapters; the app builds safely before either exists

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Without environment variables the public site and every local-first studio tool work. Cloud writes stay unavailable and the studio clearly reports preview mode.

## Free production connections

Copy `.env.example` to `.env.local` only for local testing. In Vercel, use project environment variables instead of committing secrets.

1. Add Neon from the Vercel Marketplace. It supplies `DATABASE_URL`.
2. Create a Vercel Blob store. It supplies `BLOB_READ_WRITE_TOKEN`.
3. Add a strong `STUDIO_PASSWORD` and a separate random `AUTH_SECRET`.
4. Redeploy, sign in, then use Studio → Project settings → Initialize missing tables.

The setup endpoint is owner-authenticated and uses `CREATE TABLE IF NOT EXISTS`; it does not delete or rewrite existing tables.

## Persistence model

| Data | No cloud configured | Cloud configured |
| --- | --- | --- |
| Writing drafts | `localStorage` | API adapter ready for database publishing |
| Whiteboard | `localStorage` + JSON export | Can be promoted to project records later |
| Large media/source assets | IndexedDB | Vercel Blob upload endpoint |
| Public records/posts | Version-controlled seed content | Neon API routes |
| Owner session | Open preview mode | Signed HTTP-only cookie |

Browser storage is persistent on that device but is not a cross-device backup. The UI never labels it as one.

## Quality checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```

The studio contains local preview values on purpose; public canonical seed content lives in `src/lib/content.ts`. Generated images are in `public/images` and the demo room tone is in `public/audio`.
