# Editing portfolio content

Content is now managed through **Local Studio**, not duplicated TypeScript files.

Follow the root [README](./README.md) to configure PostgreSQL, run the seed and start the local editor at `http://127.0.0.1:4310`.

Use Profile, Projects, Skills, Articles, Journey and Settings to edit content. Use Messages for the contact inbox. Draft projects/articles stay private until Published is enabled and saved. Public project and article pages use their slug in the URL; changing a slug changes that URL.

The original content is preserved in `server/prisma/legacy-content.json` only for seeding. Editing that file will not change existing database rows.

Replace existing project artwork with your own screenshots using the cover/gallery uploader. Add LinkedIn post URLs manually; the app does not import LinkedIn posts. Upload a new PDF in Profile to replace the CV link.
