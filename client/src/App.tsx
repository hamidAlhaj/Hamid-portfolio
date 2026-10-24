import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Markdown from "react-markdown";
import { loadPortfolio, apiPost } from "./api";
import { TechIcon } from "./icons";
import type { Entry, Portfolio } from "./models";
const email = "hamid2alden2alhaj@gmail.com";
function gmailComposeUrl(address: string) {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(address)}`;
}
const names: Record<string, string> = {
  projects: "Projects",
  skills: "Skills",
  about: "About",
  articles: "Articles",
  journey: "Experience",
  contact: "Contact",
};
// Repository social cards are not project artwork; show the project name instead.
function projectCoverUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  const source = value.trim();
  if (!source) return "";
  try {
    const url = new URL(source, "https://portfolio.invalid");
    if (url.hostname.toLowerCase() === "opengraph.githubassets.com") return "";
  } catch {
    return "";
  }
  return source;
}
function Arrow() {
  return <span aria-hidden="true">↗</span>;
}
function RichText({ children }: { children: string }) {
  return (
    <div className="prose">
      <Markdown>{children}</Markdown>
    </div>
  );
}
function Image({
  src,
  alt,
  className = "",
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return src && !failed ? (
    <img
      className={className}
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      onError={() => setFailed(true)}
    />
  ) : (
    <div className={`image-placeholder ${className}`}>
      <span>{alt}</span>
    </div>
  );
}
function Heading({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{label}</p>
        <h2>{title}</h2>
      </div>
      {children && <p>{children}</p>}
    </div>
  );
}
function ProjectCard({
  item,
  featured = false,
}: {
  item: Entry;
  featured?: boolean;
}) {
  const p = item.data;
  return (
    <article className={`project-card ${featured ? "featured-project" : ""}`}>
      <a className="project-media" href={`/projects/${item.slug}`}>
        <Image src={projectCoverUrl(p.imageUrl)} alt={p.name} />
        <span className="media-open">
          <Arrow />
        </span>
      </a>
      <div className="project-copy">
        <p className="eyebrow">
          {p.category} <span className="status">{p.status}</span>
        </p>
        <h3>
          <a href={`/projects/${item.slug}`}>{p.name}</a>
        </h3>
        <p>{p.description}</p>
        <div className="tags">
          {p.tags.map((tag: string) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <div className="project-actions">
          <a className="text-link" href={`/projects/${item.slug}`}>
            Explore project <Arrow />
          </a>
          {p.liveUrl && (
            <a href={p.liveUrl} target="_blank" rel="noreferrer">
              Live demo <Arrow />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
function ArticleCard({ item }: { item: Entry }) {
  const a = item.data;
  return (
    <article className="article-card">
      <a href={`/articles/${item.slug}`} className="article-cover">
        <Image src={a.coverUrl} alt={a.title} />
      </a>
      <div className="article-info">
        <p className="eyebrow">
          {a.topic} <span>{item.readTime}</span>
        </p>
        <h3>
          <a href={`/articles/${item.slug}`}>{a.title}</a>
        </h3>
        <p>{a.excerpt}</p>
        <a className="text-link" href={`/articles/${item.slug}`}>
          Read the story <Arrow />
        </a>
      </div>
    </article>
  );
}
function Contact({ profile }: { profile: Entry }) {
  const [notice, setNotice] = useState("");
  const [sending, setSending] = useState(false);
  const p = profile.data;
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fields = Object.fromEntries(new FormData(form));
    setSending(true);
    setNotice("");
    try {
      await apiPost("/contact", fields);
      setNotice("Thank you. Your message has been received.");
      form.reset();
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setSending(false);
    }
  }
  return (
    <section id="contact" className="section contact-section">
      <div className="contact-intro">
        <p className="eyebrow">LET’S CONNECT</p>
        <h2>
          Something good
          <br />
          starts with a hello.
        </h2>
        <p>
          Have a junior opportunity, a collaboration idea, or a project in mind?
          I’d love to hear from you.
        </p>
        <a
          className="email-link"
          href={gmailComposeUrl(p.email)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {p.email} <Arrow />
        </a>
        <div className="primary-socials">
          {p.socialLinks
            .filter((l: any) => ["GitHub", "LinkedIn"].includes(l.label))
            .map((l: any) => (
              <a key={l.label} href={l.href} target="_blank" rel="noreferrer">
                {l.label} <Arrow />
              </a>
            ))}
        </div>
        <p className="social-label">ELSEWHERE ONLINE</p>
        <div className="secondary-socials">
          {p.socialLinks
            .filter((l: any) => !["GitHub", "LinkedIn"].includes(l.label))
            .map((l: any) => (
              <a key={l.label} href={l.href} target="_blank" rel="noreferrer">
                {l.label} <Arrow />
              </a>
            ))}
        </div>
      </div>
      <form className="contact-form surface" onSubmit={submit}>
        <div className="form-title">
          Send a message <span aria-hidden="true">↗</span>
        </div>
        <div className="form-pair">
          <label>
            Your name
            <input
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={80}
              placeholder="Your name"
            />
          </label>
          <label>
            Email address
            <input
              name="email"
              autoComplete="email"
              type="email"
              required
              maxLength={254}
              placeholder="you@company.com"
            />
          </label>
        </div>
        <label>
          Subject <span>(optional)</span>
          <input
            name="subject"
            maxLength={120}
            placeholder="What’s on your mind?"
          />
        </label>
        <label className="honeypot" aria-hidden="true">
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
        <label>
          Your message
          <textarea
            name="message"
            required
            minLength={10}
            maxLength={4000}
            rows={5}
            placeholder="Tell me a little about it…"
          />
        </label>
        {notice && (
          <p role="status" className="notice">
            {notice}
          </p>
        )}
        <button className="button primary" disabled={sending}>
          {sending ? "Sending…" : "Send message"} <Arrow />
        </button>
      </form>
    </section>
  );
}
export default function App() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [error, setError] = useState(false);
  const [menu, setMenu] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setError(false);
    loadPortfolio()
      .then((p) => {
        if (active) {
          if (!p.profile || !p.settings) throw new Error("Content unavailable");
          setPortfolio(p);
        }
      })
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, [attempt]);
  useEffect(() => {
    if (!portfolio || typeof IntersectionObserver === "undefined") return;
    document.documentElement.classList.add("reveal-enabled");
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.08 },
    );
    document.querySelectorAll(".section").forEach((el) => observer.observe(el));
    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("reveal-enabled");
    };
  }, [portfolio]);
  const path = decodeURI(window.location.pathname).split("/").filter(Boolean);
  const detailKind = path[0];
  const detailSlug = path[1];
  const isDetail =
    ["projects", "articles"].includes(detailKind) && !!detailSlug;
  const found =
    portfolio && isDetail
      ? (detailKind === "projects"
          ? portfolio.projects
          : portfolio.articles
        ).find((i) => i.slug === detailSlug)
      : undefined;
  useEffect(() => {
    if (!portfolio) return;
    document.title = found
      ? `${found.data.name || found.data.title} — ${portfolio.profile!.data.name}`
      : `${portfolio.profile!.data.name} — ${portfolio.profile!.data.role}`;
  }, [portfolio, found]);
  useEffect(() => {
    if (window.location.hash.startsWith("#article/"))
      window.location.replace(`/articles/${window.location.hash.slice(9)}`);
  }, []);
  if (error)
    return (
      <main className="state-page">
        <p className="eyebrow">HAMID ALHAJ</p>
        <h1>A little pause.</h1>
        <p>The portfolio couldn’t load. Please try again in a moment.</p>
        <button
          className="button primary"
          onClick={() => setAttempt((v) => v + 1)}
        >
          Try again
        </button>
        <a
          href={gmailComposeUrl(email)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Contact me by email <Arrow />
        </a>
      </main>
    );
  if (!portfolio)
    return (
      <main className="state-page" role="status">
        <span className="loading-dot" />
        <p>Loading portfolio…</p>
      </main>
    );
  const profile = portfolio.profile!;
  const p = profile.data;
  const sections = portfolio.settings!.data.sections as {
    id: string;
    visible: boolean;
  }[];
  const links = sections.filter((s) => s.visible);
  const workHref = links.some((s) => s.id === "projects")
    ? "#projects"
    : `mailto:${p.email}`;
  const renderSection = (id: string) => {
    if (id === "projects")
      return (
        <section id="projects" className="section">
          <Heading label="01 / SELECTED WORK" title="Ideas, brought to life.">
            A selection of personal, university, and team projects.
          </Heading>
          <div className="featured-grid">
            {portfolio.projects
              .filter((i) => i.data.featured)
              .map((i) => (
                <ProjectCard key={i.id} item={i} featured />
              ))}
          </div>
          {portfolio.projects.some((i) => !i.data.featured) && (
            <details className="more-projects">
              <summary>
                More projects <span>+</span>
              </summary>
              <div className="project-grid">
                {portfolio.projects
                  .filter((i) => !i.data.featured)
                  .map((i) => (
                    <ProjectCard key={i.id} item={i} />
                  ))}
              </div>
            </details>
          )}
          {!portfolio.projects.length && <p>New work is on the way.</p>}
        </section>
      );
    if (id === "skills")
      return (
        <section id="skills" className="section">
          <Heading
            label="02 / MY TOOLKIT"
            title="Built with the right tools."
          />
          <div className="skills-grid">
            {portfolio.skills.map((i) => (
              <div className="skill-group" key={i.id}>
                <h3>{i.data.title}</h3>
                <p>{i.data.note}</p>
                <div className="skill-list">
                  {i.data.skills.map((s: any) => (
                    <span key={s.name}>
                      <TechIcon name={s.icon || s.name} imageUrl={s.imageUrl} />
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    if (id === "about")
      return (
        <section id="about" className="section about-section">
          <div>
            <p className="eyebrow">03 / A LITTLE ABOUT ME</p>
            <h2>
              Curious by nature.
              <br />
              Practical by choice.
            </h2>
          </div>
          <div>
            <RichText>{p.about}</RichText>
            <div className="about-location">
              <span aria-hidden="true">◉</span> {p.location}
            </div>
            <a className="text-link" href={p.cvUrl}>
              Download my CV <Arrow />
            </a>
          </div>
        </section>
      );
    if (id === "articles")
      return (
        <section id="articles" className="section">
          <Heading label="04 / NOTES & IDEAS" title="Learning, out loud.">
            Thoughts on backend development, API security, and building things.
          </Heading>
          <div className="article-grid">
            {portfolio.articles.map((i) => (
              <ArticleCard key={i.id} item={i} />
            ))}
          </div>
          {!portfolio.articles.length && <p>New articles are on the way.</p>}
        </section>
      );
    if (id === "journey")
      return (
        <section id="journey" className="section">
          <Heading
            label="05 / EDUCATION & EXPERIENCE"
            title="The journey so far."
          />
          <div className="timeline">
            {portfolio.journey.map((i, index) => (
              <article key={i.id}>
                <p className="eyebrow">{i.data.period}</p>
                <div>
                  <h3>{i.data.title}</h3>
                  <p className="organization">{i.data.organization}</p>
                  <p>{i.data.description}</p>
                </div>
                {index < portfolio.journey.length - 1 && (
                  <span className="timeline-down" aria-hidden="true">
                    ↓
                  </span>
                )}
              </article>
            ))}
          </div>
        </section>
      );
    if (id === "contact") return <Contact profile={profile} />;
    return null;
  };
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <a className="brand" href="/" aria-label={`${p.name} home`}>
          {p.name.split(" ")[0]}
          <span>.</span>
        </a>
        <button
          className="menu-button"
          onClick={() => setMenu(!menu)}
          aria-expanded={menu}
          aria-controls="main-nav"
        >
          {menu ? "Close" : "Menu"} <span aria-hidden="true">☰</span>
        </button>
        <nav
          id="main-nav"
          className={menu ? "open" : ""}
          aria-label="Main navigation"
        >
          {links
            .filter((s) => s.id !== "contact")
            .map((s) => (
              <a key={s.id} href={`/#${s.id}`} onClick={() => setMenu(false)}>
                {names[s.id]}
              </a>
            ))}
          <a
            className="nav-contact"
            href={
              links.some((s) => s.id === "contact")
                ? "/#contact"
                : `mailto:${p.email}`
            }
          >
            Let’s talk <Arrow />
          </a>
        </nav>
      </header>
      <main id="main" className="page-shell">
        {isDetail ? (
          found ? (
            <Detail item={found} kind={detailKind} />
          ) : (
            <section className="state-page">
              <h1>Page not found.</h1>
              <p>This page may be unpublished or no longer available.</p>
              <a href="/">
                Back to portfolio <Arrow />
              </a>
            </section>
          )
        ) : path.length ? (
          <section className="state-page">
            <h1>Page not found.</h1>
            <a href="/">Back to portfolio</a>
          </section>
        ) : (
          <>
            <section className="hero hero-with-portrait">
              <div className="hero-intro-layout">
                <div className="hero-copy">
                  <p className="availability">
                    <span /> {p.availability}
                  </p>
                  <p className="eyebrow">
                    {p.role} / {p.location}
                  </p>
                  <h1>{p.introduction}</h1>
                  <p className="hero-summary">{p.summary}</p>
                  <div className="hero-actions">
                    <a className="button primary" href={workHref}>
                      Explore my work <Arrow />
                    </a>
                    <a className="button quiet" href={p.cvUrl} download>
                      Download CV <span aria-hidden="true">↓</span>
                    </a>
                    <a
                      className="hero-contact"
                      href={gmailComposeUrl(p.email)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Contact me <Arrow />
                    </a>
                  </div>
                </div>
                <div className="hero-portrait">
                  <div className="hero-portrait-frame">
                    <Image
                      src={p.imageUrl || "/images/hamid.jpg"}
                      alt={`${p.name} portrait`}
                      className="hero-portrait-image"
                      priority
                    />
                  </div>
                  <div
                    className="portrait-tech portrait-tech-react"
                    aria-hidden="true"
                  >
                    <TechIcon name="React" />
                    <span>React</span>
                  </div>
                  <div
                    className="portrait-tech portrait-tech-nest"
                    aria-hidden="true"
                  >
                    <TechIcon name="NestJS" />
                    <span>NestJS</span>
                  </div>
                  <div
                    className="portrait-tech portrait-tech-ts"
                    aria-hidden="true"
                  >
                    <TechIcon name="TypeScript" />
                    <span>TypeScript</span>
                  </div>
                </div>
              </div>
              <div className="hero-bottom">
                <span>WEB DEVELOPMENT · API SECURITY</span>
                <a href={workHref}>
                  Scroll to explore <span aria-hidden="true">↓</span>
                </a>
              </div>
            </section>
            {sections
              .filter((s) => s.visible)
              .map((s) => (
                <div key={s.id}>{renderSection(s.id)}</div>
              ))}
          </>
        )}
      </main>
      <footer className="site-footer">
        <a className="brand" href="/">
          {p.name.split(" ")[0]}
          <span>.</span>
        </a>
        <p>Designed & built by {p.name}.</p>
        <span>© {new Date().getFullYear()}</span>
        <a href="#main">Back to top ↑</a>
      </footer>
    </>
  );
}
function Detail({ item, kind }: { item: Entry; kind: string }) {
  const d = item.data;
  const project = kind === "projects";
  return (
    <article className="detail-page">
      <a className="text-link" href={`/#${kind}`}>
        ← Back to {kind}
      </a>
      <header className="detail-heading">
        <p className="eyebrow">
          {project
            ? `${d.category} / ${d.status}`
            : `${d.topic} / ${item.readTime}`}
        </p>
        <h1>{d.name || d.title}</h1>
        <p>{d.description || d.excerpt}</p>
        {!project && d.publishedAt && (
          <time dateTime={d.publishedAt}>
            {new Date(d.publishedAt).toLocaleDateString("en", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        )}
        <div className="tags">
          {d.tags.map((t: string) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </header>
      <Image
        className="detail-cover"
        src={project ? projectCoverUrl(d.imageUrl) : d.coverUrl}
        alt={d.name || d.title}
      />
      <div className="detail-body surface">
        <RichText>{d.content}</RichText>
        {project &&
          [
            ["My contribution", d.contribution],
            ["The challenge", d.challenges],
            ["The solution", d.solutions],
          ].map(([title, content]) =>
            content ? (
              <section key={title}>
                <h2>{title}</h2>
                <RichText>{content}</RichText>
              </section>
            ) : null,
          )}
        {project && (d.gallery || []).some(Boolean) && (
          <section className="project-gallery">
            <h2>Project screenshots</h2>
            <p className="gallery-hint">
              Select an image to view it at full size.
            </p>
            <div className="gallery-grid">
              {(d.gallery || [])
                .filter(Boolean)
                .map((src: string, index: number) => (
                  <a
                    key={`${src}-${index}`}
                    className="gallery-card"
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${d.name} screenshot ${index + 1} at full size`}
                  >
                    <Image
                      className="gallery-image"
                      src={src}
                      alt={`${d.name} screenshot ${index + 1}`}
                    />
                    <span>
                      Screenshot {index + 1} <Arrow />
                    </span>
                  </a>
                ))}
            </div>
          </section>
        )}
        <div className="detail-links">
          {[
            [d.githubUrl, "View source"],
            [d.liveUrl, "Live demo"],
            [d.linkedinUrl, "Read on LinkedIn"],
          ].map(([href, label]) =>
            href ? (
              <a
                className="button quiet"
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
              >
                {label} <Arrow />
              </a>
            ) : null,
          )}
        </div>
      </div>
    </article>
  );
}
