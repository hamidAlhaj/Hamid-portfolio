# Hamid Alhaj — Portfolio & Local Studio

A React + TypeScript portfolio with a NestJS API, PostgreSQL/Prisma content store, persistent S3-compatible uploads, and a separate local-only CMS. The public site uses Hamid’s purple-to-green gradient as its page background. The editor has no login page and is **not part of the public build**.

## Requirements

- Node.js 22.12+ (Node 24 LTS recommended), npm
- PostgreSQL 16+ (or Docker for the included local database)
- An S3-compatible bucket with a public read URL for uploaded images and CVs

Install each app separately:

```sh
npm ci --prefix server
npm ci --prefix client
npm ci --prefix admin
```

## 1. Database and backend

For local development, from the repository root:

```sh
docker compose up -d db
```

Copy `server/.env.example` to `server/.env`. Keep the local `DATABASE_URL` if using Compose. Generate a private key:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Set `ADMIN_API_KEY` to that value in **server/.env** and later **admin/.env**. Never put it in client environment variables, a URL, or a browser field.

From `server/`:

```sh
npm run db:generate
npm run db:migrate
npm run db:seed
npm run build
npm start
```

Prisma reads `.env` for migration/generation commands. The seed uses Node's environment loading through its npm script. API: `http://127.0.0.1:3000/api`.

The seed imports the previous portfolio content once per kind/slug. Existing rows are never overwritten; rerunning it can restore missing initial rows. Legacy content exists only in `server/prisma/legacy-content.json` as a migration snapshot, not as runtime frontend/backend fallback data. Do not run the seed routinely after you start editing.

## 2. Public website

From `client/`:

```sh
npm run dev
```

Open `http://127.0.0.1:5173`. Vite proxies `/api` to NestJS during development. Build with `npm run build`.

For hosting, serve **only client/dist** as the public frontend. Reverse-proxy `/api` to the NestJS service, or set `VITE_API_URL=https://your-api.example/api` at build time and set `CLIENT_URL` on the API to the exact frontend origin. Multiple allowed frontend origins may be comma-separated.

Configure SPA fallback to `/index.html` for `/projects/*` and `/articles/*`; do not rewrite `/api/*` to HTML. There is no visitor-localhost fallback in the production frontend. Failed API loads show a retry action and direct email contact instead of stale content.

## 3. Local Studio — no login screen

Copy `admin/.env.example` to `admin/.env`. Set:

- `PORTFOLIO_API_URL`: hosted API URL including `/api`; HTTPS required except for loopback development
- `ADMIN_API_KEY`: the same private key configured on the backend
- `ADMIN_PORT`: optional, defaults to 4310

From `admin/`:

```sh
npm run build
npm start
```

Open **http://127.0.0.1:4310** (use this exact host, not `localhost`). Keep this process running while editing. When it is stopped, the public portfolio continues to work and only editing is unavailable.

The local Node process binds to loopback, checks Host, remote address and Origin, rejects cross-site requests, and checks an in-memory anti-CSRF token on every mutation. It forwards API calls with a server-side credential. The credential is never sent to React. Do not expose or tunnel this app, publish `admin/dist`, or put it behind a public reverse proxy.

### Editing

- **Profile:** introduction, summary, Markdown about text, photo, contact links, CV replacement.
- **Projects:** cover/gallery, details, contribution, challenges, solutions, tags, status, links, featured/draft/published controls.
- **Skills:** categories, individual skill ordering, bundled icons, text fallback or custom PNG/WebP icon URLs. The helper uploader supplies a URL to copy into the skill.
- **Articles:** Markdown with safe preview, cover, tags, LinkedIn permalink, optional UTC publication date, drafts. Reading time is calculated.
- **Journey:** education and experience entries, editable periods and ordering.
- **Settings:** reorder and show/hide each homepage section. Background stays at the requested gradient.
- **Messages:** paginated inbox, full message detail, mark read/unread, delete with confirmation.

Use the arrows in lists to reorder; orders save immediately. Content changes save using **Save changes**. Unsaved edits prompt before navigation. A published item is public immediately after saving. The publication date is metadata, not scheduled publishing; use the Published checkbox to control visibility.

## Upload storage

Set the S3 variables in `server/.env`. The backend uploads via `PutObject` with generated keys; images are decoded and re-encoded to WebP with pixel limits and stripped metadata. Accepted source images: JPEG, PNG, WebP. Maximum request file size: 8 MB. SVG uploads are rejected. PDFs are parsed before acceptance.

`S3_PUBLIC_URL` is the public base URL for the bucket/CDN. Upload write access stays private; configure public GET access or a CDN for published assets. Original uploaded files are not stored on the API filesystem. Replacing an asset changes its content URL; old assets are retained to avoid breaking links and can be cleaned up manually after checking references. Uploaded files are public assets, so never upload confidential documents.

Existing repository-owned article SVGs and `client/public/cv.pdf` are retained as static assets. Current project covers are existing logos/GitHub cards, **not real application screenshots**. Replace them with genuine screenshots through the CMS; no screenshots or personal contributions have been invented.

## API and security

- `GET /api/portfolio`: all published homepage content
- `GET /api/content/:kind?page=1&limit=20`: paginated published entries (limit max 100)
- `GET /api/content/:kind/:slug`: published detail or 404
- `POST /api/contact`: validated contact submission, honeypot and per-IP rate limit (3/minute)
- `/api/admin/*`: every route requires `Authorization: Bearer <ADMIN_API_KEY>`, including reads and uploads
- `/api/admin/messages`: private paginated inbox

Data is validated against strict Zod schemas; unknown fields and unsafe link protocols are rejected. Markdown is rendered without raw HTML. Rotate the private key by changing it on the API and in the local studio. CORS is not used as authorization.

The contact endpoint stores messages in PostgreSQL; it does **not send email notifications**. Check the inbox or use the direct mailto link. The throttle store is process-local; use one API replica or configure a shared throttler storage before scaling. If deploying behind a proxy, configure Express trust-proxy only for your actual trusted proxy topology so per-IP limits work; never trust arbitrary forwarded headers.

## Verification

```sh
npm run build --prefix client
npm run build --prefix server
npm run build --prefix admin
npm test --prefix admin
npm test --prefix server
```

The server test suite includes validation and upload rejection tests. To run the database integration tests, migrate a **dedicated test database** and set `TEST_DATABASE_URL` before `npm test --prefix server`. Tests cover unauthorized admin reads/writes/uploads, draft isolation, create/update/publish/reorder/delete, duplicate slugs, inbox controls and contact throttling. The integration suite explicitly skips when no test URL is set.

`node scripts/check-public-build.mjs` checks that public output contains no admin app markers or server credential references. Browser smoke checks should cover 390px and 1440px widths, detail links, mobile navigation, Markdown preview, create/edit/delete and uploads. Live object storage needs your own bucket credentials; do not substitute disk storage in production.

## Deployment checklist

1. Provision PostgreSQL and S3-compatible storage. Back up the database and bucket.
2. Configure backend-only secrets, allowed public origin and database URL.
3. Install server dependencies, generate Prisma client, run committed migrations, seed once, and build/start NestJS.
4. Build/host only `client/dist`; configure API proxy and SPA fallback.
5. Keep admin files and credentials on your computer; build and run Local Studio as needed.
6. Verify a real image upload, CV download, contact submission and direct article/project URL after deployment.

Nothing in the setup scripts deploys the website or provisions external infrastructure.
