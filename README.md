# Hamid Alhaj — Portfolio

A personal developer portfolio with a React + Vite + TypeScript frontend and a NestJS REST API. The UI uses a restrained, responsive layout with technology marks, Arabic/English language cards, project image previews, and an article section. It pulls profile, skill, project and article data from the API, with local fallback data for development.

## Requirements

- Node.js 20 or newer recommended
- npm

## Run locally

Open two terminals from the project root.

### Backend

```bash
cd server
npm install
npm run start:dev
```

The API runs on `http://localhost:3000/api`. Health check: `http://localhost:3000/api/health`. Articles endpoint: `http://localhost:3000/api/articles`.

### Frontend

```bash
cd client
npm install
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`.

## Add your CV

Export your CV to PDF and save it as `client/public/cv.pdf`. The **Download CV** button points to `/cv.pdf`. Replace this file whenever you need to update your CV. Do not commit it to a public repository unless you are comfortable making your CV publicly downloadable.

The PDF itself is a file, not a database record. For dynamic updates after deployment, store the PDF in a file/object storage service and keep its URL in the profile record in a database. The project currently uses TypeScript configuration files for profile, skills and projects; it does not yet connect to a database. Contact messages are appended to `server/data/messages.jsonl` for local development only.

## Content editing

See [`PORTFOLIO-CONTENT.md`](./PORTFOLIO-CONTENT.md) for the exact files to edit, how to add project images and articles, how to attach a LinkedIn post permalink, and how to set repository and live-demo links. Articles are published within the portfolio itself; LinkedIn post links are manual because this project does not automatically import posts from LinkedIn.
