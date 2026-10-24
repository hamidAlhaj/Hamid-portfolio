import {
  siReact,
  siTypescript,
  siJavascript,
  siHtml5,
  siCss,
  siVite,
  siNodedotjs,
  siExpress,
  siNestjs,
  siMongodb,
  siSqlite,
  siJsonwebtokens,
  siOwasp,
  siPostman,
  siGit,
  siGithub,
  siPython,
} from "simple-icons";
const icons: Record<string, { path: string; hex: string }> = {
  React: siReact,
  TypeScript: siTypescript,
  JavaScript: siJavascript,
  HTML5: siHtml5,
  CSS3: siCss,
  CSS: siCss,
  Vite: siVite,
  "Node.js": siNodedotjs,
  "Express.js": siExpress,
  NestJS: siNestjs,
  MongoDB: siMongodb,
  SQLite: siSqlite,
  JWT: siJsonwebtokens,
  "API Security": siOwasp,
  Postman: siPostman,
  Git: siGit,
  GitHub: siGithub,
  Python: siPython,
};
export function TechIcon({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl?: string;
}) {
  const icon = icons[name];
  return (
    <span className="tech-icon" aria-hidden="true">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          onError={(e) => {
            e.currentTarget.hidden = true;
            e.currentTarget.parentElement?.classList.add("failed-icon");
          }}
        />
      ) : icon ? (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d={icon.path} />
        </svg>
      ) : null}
      <span className={imageUrl || icon ? "icon-fallback" : "icon-label"}>
        {name.startsWith("REST") ? "API" : name.slice(0, 3)}
      </span>
    </span>
  );
}
