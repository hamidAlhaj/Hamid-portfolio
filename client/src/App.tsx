import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { apiGet, apiPost } from "./api";
import {
  initialArticles,
  initialLanguages,
  initialProfile,
  initialProjects,
  initialSkills,
  journey,
} from "./data";
import type {
  Language,
  PortfolioArticle,
  Profile,
  Project,
  ProjectCategory,
  SkillGroup,
} from "./types";

type IconName =
  | "arrow"
  | "external"
  | "github"
  | "linkedin"
  | "mail"
  | "pin"
  | "spark"
  | "code"
  | "check"
  | "close"
  | "send"
  | "chevron"
  | "download";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const shared = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  const paths: Record<IconName, ReactNode> = {
    arrow: (
      <>
        <path d="M7 17 17 7" />
        <path d="M7 7h10v10" />
      </>
    ),
    external: (
      <>
        <path d="M14 4h6v6" />
        <path d="m20 4-9 9" />
        <path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
      </>
    ),
    github: (
      <>
        <path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 6v-3.9a3.4 3.4 0 0 0-.9-2.7c3-.3 6.2-1.5 6.2-6.7a5.2 5.2 0 0 0-1.4-3.6 4.8 4.8 0 0 0-.1-3.6s-1.2-.4-3.8 1.4a13.1 13.1 0 0 0-6.9 0C5.5 1.1 4.3 1.5 4.3 1.5a4.8 4.8 0 0 0-.1 3.6 5.2 5.2 0 0 0-1.4 3.6c0 5.2 3.2 6.4 6.2 6.7A3.4 3.4 0 0 0 8.1 18V22" />
      </>
    ),
    linkedin: (
      <>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6Z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    spark: (
      <>
        <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Z" />
        <path d="m19 14 1.2 2.3L22.5 17.5l-2.3 1.2L19 21l-1.2-2.3-2.3-1.2 2.3-1.2L19 14Z" />
      </>
    ),
    code: (
      <>
        <path d="m8 7-5 5 5 5" />
        <path d="m16 7 5 5-5 5" />
        <path d="m14 4-4 16" />
      </>
    ),
    check: (
      <>
        <path d="m5 12 4 4L19 6" />
      </>
    ),
    close: (
      <>
        <path d="m18 6-12 12" />
        <path d="m6 6 12 12" />
      </>
    ),
    send: (
      <>
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </>
    ),
    chevron: (
      <>
        <path d="m6 9 6 6 6-6" />
      </>
    ),
    download: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="m7 10 5 5 5-5" />
        <path d="M12 15V3" />
      </>
    ),
  };
  return <svg {...shared}>{paths[name]}</svg>;
}

const navLinks = [
  { label: "About", href: "#about" },
  { label: "Skills", href: "#skills" },
  { label: "Projects", href: "#projects" },
  { label: "Articles", href: "#articles" },
  { label: "Journey", href: "#journey" },
  { label: "Contact", href: "#contact" },
];
const projectFilters: Array<"All" | ProjectCategory> = [
  "All",
  "Frontend",
  "Backend",
  "Full-stack",
  "Security",
];

const technologyMarks: Record<
  string,
  { mark: string; slug?: string; color: string; background: string }
> = {
  React: { mark: "R", slug: "react", color: "#61dafb", background: "#12232a" },
  TypeScript: {
    mark: "TS",
    slug: "typescript",
    color: "#3178c6",
    background: "#172b40",
  },
  JavaScript: {
    mark: "JS",
    slug: "javascript",
    color: "#f7df1e",
    background: "#302e18",
  },
  HTML5: { mark: "5", slug: "html5", color: "#e34f26", background: "#34231d" },
  CSS3: { mark: "3", slug: "css3", color: "#1572b6", background: "#1a2935" },
  Vite: { mark: "V", slug: "vite", color: "#a78bfa", background: "#272238" },
  "Node.js": {
    mark: "N",
    slug: "nodedotjs",
    color: "#83cd29",
    background: "#1c2b1a",
  },
  "Express.js": {
    mark: "Ex",
    slug: "express",
    color: "#d3d8dc",
    background: "#2b3033",
  },
  NestJS: {
    mark: "N",
    slug: "nestjs",
    color: "#e0234e",
    background: "#341a23",
  },
  "REST APIs": { mark: "API", color: "#b7d7c9", background: "#20322c" },
  MongoDB: {
    mark: "M",
    slug: "mongodb",
    color: "#00ed64",
    background: "#112c22",
  },
  SQLite: {
    mark: "db",
    slug: "sqlite",
    color: "#7fc2ff",
    background: "#172734",
  },
  JWT: {
    mark: "JWT",
    slug: "jsonwebtokens",
    color: "#d9b7ff",
    background: "#2a2038",
  },
  "API Security": {
    mark: "OW",
    slug: "owasp",
    color: "#f0a8a8",
    background: "#342122",
  },
  Postman: {
    mark: "P",
    slug: "postman",
    color: "#ff6c37",
    background: "#34231d",
  },
  Git: { mark: "git", slug: "git", color: "#f56a43", background: "#33231e" },
  GitHub: {
    mark: "GH",
    slug: "github",
    color: "#e7e9ec",
    background: "#292f34",
  },
  Python: {
    mark: "Py",
    slug: "python",
    color: "#ffd343",
    background: "#253044",
  },
};

function TechIcon({ name }: { name: string }) {
  const logo = technologyMarks[name] || {
    mark: name.slice(0, 2).toUpperCase(),
    color: "#c4d6ce",
    background: "#202a2d",
  };
  return (
    <span
      className="tech-icon"
      style={{ color: logo.color, backgroundColor: logo.background }}
      aria-hidden="true"
    >
      {logo.slug && (
        <img
          src={`https://cdn.simpleicons.org/${logo.slug}/${logo.color.replace("#", "")}`}
          alt=""
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.display = "none";
            event.currentTarget.parentElement?.classList.add("no-logo");
          }}
        />
      )}
      <span className="tech-icon-fallback">{logo.mark}</span>
    </span>
  );
}

function App() {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [skills, setSkills] = useState<SkillGroup[]>(initialSkills);
  const [articles, setArticles] = useState<PortfolioArticle[]>(initialArticles);
  const articleIdFromHash = window.location.hash.startsWith("#article/")
    ? window.location.hash.slice("#article/".length)
    : "";
  const [selectedArticle, setSelectedArticle] =
    useState<PortfolioArticle | null>(
      initialArticles.find((article) => article.id === articleIdFromHash) ||
        null,
    );
  const [apiState, setApiState] = useState<"checking" | "online" | "offline">(
    "checking",
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"All" | ProjectCategory>(
    "All",
  );
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    let active = true;
    const loadPortfolio = async () => {
      const [profileResult, projectResult, skillResult, articlesResult] =
        await Promise.allSettled([
          apiGet<Profile>("/profile"),
          apiGet<Project[]>("/projects"),
          apiGet<SkillGroup[]>("/skills"),
          apiGet<PortfolioArticle[]>("/articles"),
        ]);
      if (!active) return;
      if (profileResult.status === "fulfilled") setProfile(profileResult.value);
      if (projectResult.status === "fulfilled")
        setProjects(projectResult.value);
      if (skillResult.status === "fulfilled") setSkills(skillResult.value);
      if (articlesResult.status === "fulfilled")
        setArticles(articlesResult.value);
      setApiState(
        profileResult.status === "fulfilled" &&
          projectResult.status === "fulfilled" &&
          skillResult.status === "fulfilled" &&
          articlesResult.status === "fulfilled"
          ? "online"
          : "offline",
      );
    };
    void loadPortfolio();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedProject && !selectedArticle) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedProject(null);
        setSelectedArticle(null);
        if (window.location.hash.startsWith("#article/"))
          window.history.replaceState(null, "", "#articles");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.classList.add("modal-open");
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("modal-open");
    };
  }, [selectedProject, selectedArticle]);

  const openArticle = (article: PortfolioArticle) => {
    setSelectedArticle(article);
    window.history.replaceState(null, "", `#article/${article.id}`);
  };

  const closeArticle = () => {
    setSelectedArticle(null);
    if (window.location.hash.startsWith("#article/"))
      window.history.replaceState(null, "", "#articles");
  };

  const visibleProjects = useMemo(
    () =>
      projects.filter(
        (project) =>
          project.featured &&
          (activeFilter === "All" || project.category === activeFilter),
      ),
    [activeFilter, projects],
  );

  const handleContactSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setSending(true);
    setNotice(null);
    try {
      await apiPost<{ message: string }>("/contact", {
        name: String(formData.get("name") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        subject: String(formData.get("subject") || "").trim(),
        message: String(formData.get("message") || "").trim(),
      });
      setNotice({
        type: "success",
        text: "Message saved successfully. Thank you for reaching out.",
      });
      form.reset();
    } catch (error) {
      const reason =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.";
      setNotice({
        type: "error",
        text: `${reason}. Check that the NestJS server is running.`,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <header className="site-header">
        <div className="nav-shell container">
          <a className="brand" href="#home" aria-label="Hamid Alhaj home">
            <span className="brand-mark">
              <span>HAMID</span>
            </span>
            <span className="brand-caption">
              portfolio<span> /open to work</span>
            </span>
          </a>
          <button
            className="menu-toggle"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span />
            <span />
          </button>
          <nav
            className={`navigation ${menuOpen ? "navigation-open" : ""}`}
            aria-label="Main navigation"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              className="nav-cta"
              href="#contact"
              onClick={() => setMenuOpen(false)}
            >
              Let’s talk <Icon name="arrow" size={14} />
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero section-shell" id="home">
          <div className="hero-copy">
            <div className="availability">
              <span className="availability-dot" /> {profile.availability}
            </div>
            <p className="eyebrow">{profile.eyebrow}</p>
            <h1>
              Hi, I’m{" "}
              <span className="gradient-text">
                {profile.name.split(" ")[0]}.
              </span>
              <br />I build web apps and APIs.
            </h1>
            <p className="hero-summary">{profile.summary}</p>
            <div className="hero-actions">
              <a className="button button-primary" href="#projects">
                View projects <Icon name="arrow" size={17} />
              </a>
              <a
                className="button button-quiet"
                href={profile.cvUrl || "/cv.pdf"}
                download="Hamid-Alhaj-CV.pdf"
              >
                <Icon name="download" size={16} /> Download CV
              </a>
              <a className="button button-quiet" href="#contact">
                <Icon name="mail" size={16} /> Contact me
              </a>
            </div>
            <div className="hero-meta">
              <span>
                <Icon name="pin" size={15} /> {profile.location}
              </span>
              <span className={`api-indicator api-${apiState}`}>
                <i />{" "}
                {apiState === "online"
                  ? "NestJS API connected"
                  : apiState === "checking"
                    ? "Connecting to API"
                    : "Showing local portfolio data"}
              </span>
            </div>
          </div>

          <aside className="hero-aside" aria-label="Current development focus">
            <p className="aside-label">CURRENT FOCUS</p>
            <h2 className="aside-title">
              Backend development
              <br />
              and API security.
            </h2>
            <p className="aside-copy">
              Building a stronger foundation in TypeScript and NestJS through
              practical projects and team work.
            </p>
            <div className="aside-rule" />
            <ul className="aside-list">
              <li>
                <span>01</span>
                <span>NestJS and REST APIs</span>
              </li>
              <li>
                <span>02</span>
                <span>React and TypeScript</span>
              </li>
              <li>
                <span>03</span>
                <span>Application security</span>
              </li>
            </ul>
            <div className="aside-bottom">
              <span>Based in</span>
              <strong>{profile.location}</strong>
            </div>
          </aside>
          <a className="scroll-cue" href="#about">
            <span className="scroll-line" /> Scroll to explore{" "}
            <Icon name="chevron" size={14} />
          </a>
        </section>

        <section className="about section-pad" id="about">
          <div className="container">
            <SectionHeading
              index="01"
              eyebrow="ABOUT"
              title={<>My background.</>}
            />
            <div className="about-grid">
              <div className="about-copy">
                <p className="about-lead">
                  I care about how software <em>works</em> — and how it feels to
                  use.
                </p>
                <p>
                  I’m an Informatics Engineering graduate with a software
                  development focus. My path has taken me from building React
                  interfaces to designing APIs, working in collaborative
                  bootcamp teams, and exploring the security issues that can
                  hide behind an endpoint.
                </p>
                <p>
                  I value readable code, thoughtful architecture, and steady
                  progress. I’m currently strengthening my NestJS and TypeScript
                  skills while developing a deeper understanding of API
                  security.
                </p>
                <div className="about-socials">
                  <a href={profile.github} target="_blank" rel="noreferrer">
                    <Icon name="github" size={16} /> GitHub{" "}
                    <Icon name="arrow" size={13} />
                  </a>
                  <a href={profile.linkedin} target="_blank" rel="noreferrer">
                    <Icon name="linkedin" size={16} /> LinkedIn{" "}
                    <Icon name="arrow" size={13} />
                  </a>
                </div>
              </div>
              <div className="about-facts">
                <article className="fact-card fact-highlight">
                  <span className="fact-topline">CURRENTLY LEARNING</span>
                  <span className="fact-big">
                    Nest<span className="fact-accent">JS</span>
                  </span>
                  <p>
                    Building maintainable backends with modules, services,
                    controllers, and TypeScript.
                  </p>
                  <span className="fact-decor">01</span>
                </article>
                <article className="fact-card">
                  <span className="fact-topline">ACADEMIC BACKGROUND</span>
                  <strong>Informatics Engineering</strong>
                  <p>
                    Arab University for Science and Technology · Software track
                  </p>
                  <div className="fact-bottom">
                    <span className="mini-check">
                      <Icon name="check" size={12} />
                    </span>{" "}
                    Graduation project rated Excellent
                  </div>
                </article>
                <article className="fact-card fact-wide">
                  <div>
                    <span className="fact-topline">WHAT I’M DRAWN TO</span>
                    <strong>Backend systems & API security</strong>
                    <p>
                      Clear contracts, dependable behavior, and safer
                      application design.
                    </p>
                  </div>
                  <span className="security-glyph">
                    <Icon name="spark" size={25} />
                  </span>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="skills section-pad" id="skills">
          <div className="container">
            <SectionHeading
              index="02"
              eyebrow="SKILLS"
              title={<>Technologies I use.</>}
              rightNote="Tools I have used in projects and continue to practise."
            />
            <div className="skills-grid">
              {skills.map((group, index) => (
                <article className="skill-card" key={group.title}>
                  <div className="skill-card-header">
                    <span className={`skill-index skill-index-${index + 1}`}>
                      0{index + 1}
                    </span>
                    <span className="skill-card-arrow">
                      <Icon name="arrow" size={17} />
                    </span>
                  </div>
                  <h3>{group.title}</h3>
                  <p>{group.note}</p>
                  <div className="skill-items">
                    {group.skills.map((skill) => (
                      <span className="skill-item" key={skill}>
                        <TechIcon name={skill} />
                        <span>{skill}</span>
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <div className="learning-strip">
              <span className="learning-icon">
                <Icon name="spark" size={17} />
              </span>
              <div>
                <strong>Currently learning</strong>
                <p>
                  Exploring Next.js, React Native, and deeper
                  application-security practices.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="projects section-pad" id="projects">
          <div className="container">
            <SectionHeading
              index="03"
              eyebrow="PROJECTS"
              title={<>Selected projects.</>}
              rightNote="University work, personal builds, and projects developed with a team."
            />
            <div className="project-toolbar">
              <p>
                <span className="project-count">
                  {String(visibleProjects.length).padStart(2, "0")}
                </span>{" "}
                projects shown
              </p>
              <div className="filter-list" aria-label="Filter projects">
                {projectFilters.map((filter) => (
                  <button
                    type="button"
                    key={filter}
                    className={
                      activeFilter === filter
                        ? "filter-button active"
                        : "filter-button"
                    }
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
            <div className="projects-grid">
              {visibleProjects.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={index}
                  onOpen={() => setSelectedProject(project)}
                />
              ))}
            </div>
            <div className="projects-footer">
              <span>There’s more behind the code.</span>
              <a href={profile.github} target="_blank" rel="noreferrer">
                Explore GitHub repositories <Icon name="arrow" size={15} />
              </a>
            </div>
          </div>
        </section>

        <section className="articles section-pad" id="articles">
          <div className="container">
            <SectionHeading
              index="04"
              eyebrow="WRITING & NOTES"
              title={<>Ideas worth sharing.</>}
              rightNote="Technical articles about backend development, API security, and lessons from real projects."
            />
            <div className="articles-grid">
              {articles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onOpen={() => openArticle(article)}
                />
              ))}
            </div>
            <div className="articles-footer">
              <p>
                Long-form notes live here. For short updates and ongoing
                technical discussions, connect with me on LinkedIn.
              </p>
              <a
                className="button button-quiet"
                href={profile.linkedin}
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="linkedin" size={16} /> More on LinkedIn{" "}
                <Icon name="arrow" size={14} />
              </a>
            </div>
          </div>
        </section>

        <section className="journey section-pad" id="journey">
          <div className="container journey-layout">
            <div className="journey-intro">
              <SectionHeading
                index="05"
                eyebrow="EDUCATION & EXPERIENCE"
                title={<>My journey so far.</>}
              />
              <p>
                My experience so far combines software engineering studies,
                team-based development, and independent practice with backend
                tools.
              </p>
              <a href="#contact" className="text-link">
                Let’s build the next chapter <Icon name="arrow" size={15} />
              </a>
            </div>
            <div className="timeline">
              {journey.map((item, index) => (
                <article className="timeline-item" key={item.title}>
                  <div className="timeline-rail">
                    <span className={`timeline-dot dot-${item.kind}`} />
                    <span className="timeline-stem" />
                  </div>
                  <div className="timeline-content">
                    <span className="timeline-period">{item.period}</span>
                    <h3>{item.title}</h3>
                    <p className="timeline-org">{item.organization}</p>
                    <p className="timeline-description">{item.description}</p>
                  </div>
                  <span className="timeline-number">0{index + 1}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="contact section-pad" id="contact">
          <div className="container">
            <div className="contact-panel">
              <div className="contact-copy">
                <p className="eyebrow">
                  <span className="eyebrow-square" /> CONTACT
                </p>
                <h2>
                  Have a role or
                  <br />
                  <span className="gradient-text">project in mind?</span>
                </h2>
                <p className="contact-summary">
                  Have a junior opportunity, a collaboration idea, or a
                  technical problem worth exploring? Send a message.
                </p>
                <div className="contact-availability">
                  <span className="availability-dot" /> {profile.availability}
                </div>
                <div className="contact-links">
                  <a href={profile.github} target="_blank" rel="noreferrer">
                    <Icon name="github" size={17} /> GitHub{" "}
                    <Icon name="arrow" size={13} />
                  </a>
                  <a href={profile.linkedin} target="_blank" rel="noreferrer">
                    <Icon name="linkedin" size={17} /> LinkedIn{" "}
                    <Icon name="arrow" size={13} />
                  </a>
                </div>
                <div className="contact-decoration" aria-hidden="true">
                  HAL<span>_</span>
                </div>
              </div>
              <form className="contact-form" onSubmit={handleContactSubmit}>
                <div className="form-heading">
                  <span>CONTACT FORM</span>
                  <span className="form-live">
                    <i /> MESSAGE
                  </span>
                </div>
                <label htmlFor="contact-name">Your name</label>
                <input
                  id="contact-name"
                  name="name"
                  autoComplete="name"
                  placeholder="How should I address you?"
                  minLength={2}
                  maxLength={80}
                  required
                />
                <label htmlFor="contact-email">Email address</label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  maxLength={254}
                  required
                />
                <label htmlFor="contact-subject">
                  Subject <span>(optional)</span>
                </label>
                <input
                  id="contact-subject"
                  name="subject"
                  placeholder="What’s this about?"
                  maxLength={120}
                />
                <label htmlFor="contact-message">Message</label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={4}
                  placeholder="A little context goes a long way..."
                  minLength={10}
                  maxLength={4000}
                  required
                />
                {notice && (
                  <div
                    className={`form-notice notice-${notice.type}`}
                    role="status"
                  >
                    {notice.type === "success" ? (
                      <Icon name="check" size={16} />
                    ) : (
                      <Icon name="close" size={16} />
                    )}
                    {notice.text}
                  </div>
                )}
                <button
                  className="button button-primary form-submit"
                  type="submit"
                  disabled={sending}
                >
                  {sending ? "Sending message…" : "Send message"}{" "}
                  <Icon name="send" size={16} />
                </button>
                <p className="form-footnote">
                  Your message is sent to the portfolio API for local storage.
                </p>
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <a href="#home" className="footer-brand">
            ha<span>.</span>
          </a>
          <p>Designed and built by Hamid Alhaj.</p>
          <a className="back-to-top" href="#home">
            Back to top <Icon name="arrow" size={14} />
          </a>
          <span className="footer-year">© 2026</span>
        </div>
      </footer>

      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
      {selectedArticle && (
        <ArticleModal article={selectedArticle} onClose={closeArticle} />
      )}
    </>
  );
}

function SectionHeading({
  index,
  eyebrow,
  title,
  rightNote,
}: {
  index: string;
  eyebrow: string;
  title: ReactNode;
  rightNote?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <p className="section-eyebrow">
          <span>{index}</span>
          {eyebrow}
        </p>
        <h2>{title}</h2>
      </div>
      {rightNote && <p className="section-note">{rightNote}</p>}
    </div>
  );
}

function LanguageCard({ language }: { language: Language }) {
  return (
    <article className="language-card">
      <span
        className={`language-mark${language.mark === "ع" ? " language-mark-ar" : ""}`}
        lang={language.mark === "ع" ? "ar" : "en"}
      >
        {language.mark}
      </span>
      <div className="language-copy">
        <strong>{language.name}</strong>
        <span>{language.note}</span>
      </div>
      <span className="language-level">{language.level}</span>
    </article>
  );
}

function ArticleCard({
  article,
  onOpen,
}: {
  article: PortfolioArticle;
  onOpen: () => void;
}) {
  return (
    <article className="article-card">
      <button
        type="button"
        className="article-cover-button"
        onClick={onOpen}
        aria-label={`Read ${article.title}`}
      >
        <img
          src={article.coverUrl}
          alt={`${article.title} cover`}
          loading="lazy"
        />
      </button>
      <div className="article-card-body">
        <div className="article-meta">
          <span>{article.topic}</span>
          <span>{article.readTime}</span>
        </div>
        <h3>{article.title}</h3>
        <p>{article.excerpt}</p>
        <div className="article-tags">
          {article.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <div className="article-card-footer">
          <button type="button" className="text-link" onClick={onOpen}>
            Read article <Icon name="arrow" size={14} />
          </button>
          {article.linkedinUrl && (
            <a
              href={article.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Read article on LinkedIn"
            >
              <Icon name="linkedin" size={16} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function ArticleModal({
  article,
  onClose,
}: {
  article: PortfolioArticle;
  onClose: () => void;
}) {
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <article
        className="article-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="article-modal-title"
      >
        <div className="article-modal-cover">
          <img src={article.coverUrl} alt="" />
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close article"
          >
            <Icon name="close" size={19} />
          </button>
        </div>
        <div className="article-modal-content">
          <div className="article-meta">
            <span>{article.topic}</span>
            <span>{article.readTime}</span>
          </div>
          <h2 id="article-modal-title">{article.title}</h2>
          <p className="article-modal-excerpt">{article.excerpt}</p>
          <div className="article-body">
            {article.body.map((paragraph, index) => (
              <p key={`${article.id}-${index}`}>{paragraph}</p>
            ))}
          </div>
          <div className="article-tags">
            {article.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <div className="modal-actions">
            <a
              className="button button-primary"
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${window.location.origin}${window.location.pathname}#article/${article.id}`)}`}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="linkedin" size={16} /> Share article on LinkedIn{" "}
              <Icon name="external" size={13} />
            </a>
            {article.linkedinUrl && (
              <a
                className="button button-quiet"
                href={article.linkedinUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open LinkedIn post <Icon name="external" size={13} />
              </a>
            )}
            <button
              type="button"
              className="button button-quiet"
              onClick={onClose}
            >
              Close article
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}

function ProjectCard({
  project,
  index,
  onOpen,
}: {
  project: Project;
  index: number;
  onOpen: () => void;
}) {
  return (
    <article
      className={`project-card project-${project.theme}`}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div
        className={`project-image-shell${project.imageUrl ? "" : " image-unavailable"}`}
      >
        <div className="project-image-fallback">
          <span>
            {project.name
              .split(/\s+/)
              .map((part) => part[0])
              .join("")
              .slice(0, 3)}
          </span>
          <small>{project.category}</small>
        </div>
        {project.imageUrl && (
          <img
            className="project-image"
            src={project.imageUrl}
            alt={`${project.name} project preview`}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
              event.currentTarget.parentElement?.classList.add(
                "image-unavailable",
              );
            }}
          />
        )}
      </div>
      <div className="project-body">
        <div className="project-title-row">
          <div>
            <p className="project-subtitle">{project.subtitle}</p>
            <h3>{project.name}</h3>
          </div>
          <button
            type="button"
            className="project-open"
            onClick={onOpen}
            aria-label={`Read more about ${project.name}`}
          >
            <Icon name="arrow" size={17} />
          </button>
        </div>
        <p className="project-description">{project.description}</p>
        <div className="project-tags">
          {project.tags.slice(0, 4).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
          {project.tags.length > 4 && <span>+{project.tags.length - 4}</span>}
        </div>
        <div className="project-card-actions">
          {project.githubUrl && (
            <a
              className="project-source-link"
              href={project.githubUrl}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="github" size={15} /> GitHub repository{" "}
              <Icon name="external" size={12} />
            </a>
          )}
          {project.liveUrl && (
            <a
              className="project-live-link"
              href={project.liveUrl}
              target="_blank"
              rel="noreferrer"
            >
              Live demo <Icon name="external" size={12} />
            </a>
          )}
        </div>
        <button className="project-details-link" type="button" onClick={onOpen}>
          Project details <Icon name="arrow" size={14} />
        </button>
      </div>
    </article>
  );
}

function ProjectModal({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="project-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className={`modal-banner project-${project.theme}`}>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close project details"
          >
            <Icon name="close" size={19} />
          </button>
          <span className="modal-kicker">
            PROJECT NOTES / {project.category.toUpperCase()}
          </span>
          <div className="modal-visual-mark">
            <Icon
              name={project.category === "Security" ? "spark" : "code"}
              size={44}
            />
          </div>
          <span className="modal-id">{project.id.toUpperCase()}</span>
        </div>
        <div className="modal-content">
          <p className="project-subtitle">{project.subtitle}</p>
          <h2 id="modal-title">{project.name}</h2>
          <p className="modal-description">{project.description}</p>
          <h3>What I focused on</h3>
          <ul className="highlight-list">
            {project.highlights.map((highlight) => (
              <li key={highlight}>
                <span>
                  <Icon name="check" size={13} />
                </span>
                {highlight}
              </li>
            ))}
          </ul>
          <div className="modal-tech">
            <h3>Technologies</h3>
            <div className="project-tags">
              {project.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </div>
          <div className="modal-actions">
            {project.githubUrl ? (
              <a
                className="button button-primary"
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer"
              >
                View source <Icon name="external" size={15} />
              </a>
            ) : (
              <span className="modal-no-link">
                Source link not published yet
              </span>
            )}
            {project.liveUrl && (
              <a
                className="button button-quiet"
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
              >
                Live demo <Icon name="external" size={15} />
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
