# Verification — 23 October 2026

## Passed

- React public frontend production build.
- NestJS backend production build.
- Separate local-admin React production build.
- Public-build scan for admin application markers and credential references.
- Six backend tests covering validation, unsafe URLs, malformed and oversized uploads, anonymous/incorrect credential rejection on every admin action, draft isolation, content create/update/publish/reorder/delete, duplicate slugs, contact validation/rate limiting, private inbox controls, and image/PDF storage requests.
- Six local-server tests covering Host/Origin enforcement, CSRF rejection, backend credential forwarding without returning it to the browser, and rejection of insecure hosted backend URLs.
- Prisma migration applied and initial seed run twice against a temporary PostgreSQL-compatible PGlite engine over its wire protocol. This was used because a native PostgreSQL service was unavailable in the execution environment.
- Headless Chromium checks at 1440px and 390px: no horizontal overflow, working mobile menu, project/article deep links and contact submission.
- Real local-admin browser flow: create a draft, verify public isolation, edit and publish, upload a PNG and receive a WebP storage URL, view the published project, edit the profile without changing code, mark a message read, and delete the test project.
- Local admin layout checked at 390px without horizontal overflow.

## Limits and required setup

- Production PostgreSQL hosting and real S3 bucket access were not provisioned. Storage requests were tested against a local S3-compatible HTTP test endpoint, including generated filenames and converted image bytes.
- Run the committed migration on your PostgreSQL instance and configure the server-only key and bucket variables before regular use. See the root README.
- Contact submissions are stored in the database; email notification delivery is not implemented.
- Existing project logos and GitHub cards were preserved. Genuine project screenshots still need to be uploaded by the owner.
- The site was not deployed, and the main branch was not changed.

## Preview images

- [Desktop](./previews/desktop.png)
- [Projects](./previews/desktop-projects.png)
- [Mobile](./previews/mobile.png)
- [Local Studio](./previews/local-studio.png)

## Project gallery update

Additional local-server tests verify local image writes, actual WebP bytes, serving image URLs, CSRF/Origin rejection, invalid image content and size rejection, and disabling local filesystem uploads for hosted backends. The local gallery uses the existing project data schema and requires no database migration.

## Free hosting / published snapshot update

- Frontend builds passed in the default API mode and with `VITE_CONTENT_MODE=snapshot`; backend `npm run build` passed.
- `node --test scripts/test/snapshot.test.mjs`: 2 tests passed. Export rejects drafts/incomplete data, omits non-public root/entry fields, uses an unauthenticated public GET, and preserves the previous file when the upstream fails.
- Browser checks at 1440px and 390px with the API returning 503: homepage, direct project/article routes and refresh all rendered from the static snapshot with zero API requests for content. No horizontal overflow or uncaught browser errors. Contact failure displayed an email fallback.
- Public build scan passed: no admin app or server credential references.
- Missing `client/public/portfolio.json` intentionally fails the deployment check; the owner must export their real current database before deployment. Test fixture content was not committed or included in the patch.
- No external service was provisioned or deployed. Render/Neon credentials, real database restore, and live contact delivery require owner setup. The deployment YAML was reviewed against Render's documented Blueprint fields; it has not been deployed through Render.
