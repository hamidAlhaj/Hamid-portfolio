# Portfolio content guide

This portfolio uses **React + Vite + TypeScript** for the frontend and **NestJS** for the REST API. Project/article content is configuration data, not a database yet.

## Add or edit a project

Update both files so the card works when the API is online and when the frontend falls back to local data:

- `client/src/data.ts` — frontend fallback list (`initialProjects`)
- `server/src/portfolio/portfolio.data.ts` — API list (`projects`)

Copy a project object and update `id`, `name`, `category`, `subtitle`, `description`, `tags`, `highlights`, `theme`, `githubUrl`, and `featured`. Keep `id` unique. Optional fields:

- `liveUrl`: public demo URL, if one exists.
- `imageUrl`: a logo or screenshot URL. Prefer a real project screenshot or a small logo committed under `client/public/images/projects/`; if the image fails, the card shows a text fallback.

Valid categories: `Frontend`, `Backend`, `Full-stack`, `Security`. Valid themes: `violet`, `mint`, `blue`, `orange`, `pink`.

## Add or edit an article

Update both files:

- `client/src/data.ts` — `initialArticles` used as frontend fallback.
- `server/src/portfolio/portfolio.data.ts` — `articles` returned by NestJS at `GET /api/articles`.

Each article has `id`, `title`, `excerpt`, `readTime`, `topic`, `tags`, `coverUrl`, and a `body` array containing paragraphs. Put cover images under `client/public/images/articles/` and use a root-relative URL, for example `/images/articles/my-article.svg`.

To link an article to its corresponding LinkedIn post, add `linkedinUrl: 'https://www.linkedin.com/posts/...'` to that article in both lists. Do not use the profile URL as if it were a direct article permalink. Without `linkedinUrl`, the article is still readable on this portfolio and the LinkedIn button points to the general profile.

## Skill icons and languages

- Edit technology names in `initialSkills` in `client/src/data.ts` and the `skills` list in `server/src/portfolio/portfolio.data.ts`.
- The icon marks for current skills are in `technologyMarks` inside `client/src/App.tsx`. Add a matching entry when adding a new skill; an initials-based fallback is used automatically.
- Edit Arabic/English level cards in `initialLanguages` in `client/src/data.ts`.

## Add your CV

1. Export your CV as a PDF.
2. Copy it to `client/public/cv.pdf`.
3. The **Download CV** button points to `/cv.pdf`. Replace that file when you update the CV.

Do not commit your CV to a public repository unless you are comfortable making it public. For updates after deployment, upload the PDF to file/object storage and save its URL in profile data or a database. A regular relational database should store the file URL and metadata, not the raw PDF content in a text field.

## API endpoints

- `GET /api/health`
- `GET /api/profile`
- `GET /api/projects`
- `GET /api/skills`
- `GET /api/articles`
- `POST /api/contact`

## Current data storage

- Profile, projects, skills, and articles: TypeScript configuration files.
- Contact messages: local JSONL file for development. Do not rely on a deployed server's local filesystem for permanent storage; connect a database such as PostgreSQL or MongoDB for production.
- LinkedIn: links are manual per article. This project does not sign in to LinkedIn, scrape LinkedIn, or automatically import posts.
