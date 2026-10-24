import React, { useEffect, useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import Markdown from "react-markdown";
import "./style.css";
type Entry = {
  id: string;
  slug: string;
  position: number;
  published: boolean;
  data: Record<string, any>;
};
type Kind =
  | "profile"
  | "projects"
  | "skills"
  | "articles"
  | "journey"
  | "settings"
  | "messages";
type Field = [string, string, string?];
const sections = [
  "projects",
  "skills",
  "about",
  "articles",
  "journey",
  "contact",
];
const kinds: Kind[] = [
  "profile",
  "projects",
  "skills",
  "articles",
  "journey",
  "settings",
  "messages",
];
const icons = [
  "React",
  "TypeScript",
  "JavaScript",
  "HTML5",
  "CSS3",
  "Vite",
  "Node.js",
  "Express.js",
  "NestJS",
  "REST APIs",
  "MongoDB",
  "SQLite",
  "JWT",
  "API Security",
  "Postman",
  "Git",
  "GitHub",
  "Python",
];
const fields: Record<string, Field[]> = {
  profile: [
    ["name", "Name"],
    ["role", "Role"],
    ["introduction", "Hero introduction"],
    ["summary", "Summary", "textarea"],
    ["about", "About (Markdown)", "markdown"],
    ["location", "Location"],
    ["availability", "Availability"],
    ["email", "Email", "email"],
    ["imageUrl", "Profile image", "image"],
    ["cvUrl", "CV PDF", "pdf"],
    ["socialLinks", "Social links", "links"],
  ],
  projects: [
    ["name", "Project title"],
    ["category", "Category", "Frontend|Backend|Full-stack|Security"],
    ["subtitle", "Subtitle"],
    ["description", "Short description", "textarea"],
    ["content", "Project details", "markdown"],
    ["contribution", "My contribution", "markdown"],
    ["challenges", "Challenges", "markdown"],
    ["solutions", "Solutions", "markdown"],
    ["tags", "Technologies", "tags"],
    ["imageUrl", "Cover image", "image"],
    ["gallery", "Project screenshots", "gallery"],
    ["githubUrl", "Repository URL", "url"],
    ["liveUrl", "Live demo URL", "url"],
    ["status", "Project status", "In progress|Completed"],
    ["featured", "Featured project", "checkbox"],
  ],
  skills: [
    ["title", "Category title"],
    ["note", "Description"],
    ["skills", "Skills", "skills"],
  ],
  articles: [
    ["title", "Article title"],
    ["excerpt", "Excerpt", "textarea"],
    ["content", "Article body", "markdown"],
    ["coverUrl", "Cover image", "image"],
    ["tags", "Tags", "tags"],
    ["topic", "Topic"],
    ["linkedinUrl", "LinkedIn post URL", "url"],
    ["publishedAt", "Publication date", "date"],
  ],
  journey: [
    ["period", "Period"],
    ["title", "Title"],
    ["organization", "Organization"],
    ["description", "Description", "textarea"],
    ["kind", "Entry type", "education|bootcamp|project"],
  ],
  settings: [
    ["sections", "Homepage sections", "sections"],
    ["background", "Background gradient", "readonly"],
  ],
};
function blank(kind: Kind): Entry {
  const data: Record<string, any> = {};
  for (const [key, , type] of fields[kind] || []) {
    data[key] =
      type === "checkbox"
        ? false
        : ["tags", "gallery", "links", "skills"].includes(type || "")
          ? []
          : type === "sections"
            ? sections.map((id) => ({ id, visible: true }))
            : type === "date"
              ? null
              : type === "readonly"
                ? "linear-gradient(135deg, #3d00b8 0%, #21dda2 100%)"
                : type?.includes("|")
                  ? type.split("|")[0]
                  : "";
  }
  return {
    id: "",
    slug: ["profile", "settings"].includes(kind) ? "main" : "",
    published: !["projects", "articles"].includes(kind),
    position: 0,
    data,
  };
}
let token = "";
let localImageUploads = false;
async function uploadAsset(file: File): Promise<{ url: string }> {
  if (file.size > 8 * 1024 * 1024)
    throw new Error("Each file must be 8 MB or smaller.");
  if (localImageUploads && file.type.startsWith("image/")) {
    const response = await fetch("/api/local-images", {
      method: "POST",
      headers: { "X-CSRF-Token": token, "Content-Type": file.type },
      body: file,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Image upload failed.");
    return result;
  }
  const form = new FormData();
  form.append("file", file);
  return api("uploads", "POST", form);
}
async function api(path: string, method = "GET", payload?: unknown) {
  const response = await fetch(`/api/${path}`, {
    method,
    headers:
      method === "GET"
        ? {}
        : {
            "X-CSRF-Token": token,
            ...(payload instanceof FormData
              ? {}
              : { "Content-Type": "application/json" }),
          },
    body:
      payload === undefined
        ? undefined
        : payload instanceof FormData
          ? payload
          : JSON.stringify(payload),
  });
  const body = await response.json();
  if (!response.ok)
    throw new Error(
      Array.isArray(body.message)
        ? body.message.join("; ")
        : body.message || "Request failed",
    );
  return body;
}
function App() {
  const [kind, setKind] = useState<Kind>("projects");
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState<any>(null);
  const [dirty, setDirty] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  useEffect(() => {
    fetch("/session")
      .then((r) => {
        if (!r.ok) throw Error("Open this app at its 127.0.0.1 address");
        return r.json();
      })
      .then((s) => {
        token = s.csrf;
        localImageUploads = s.localImageUploads === true;
        setReady(true);
      })
      .catch((e) => setNotice(e.message));
  }, []);
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => {
      if (dirty || uploadCount > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [dirty, uploadCount]);
  async function load() {
    setBusy(true);
    try {
      if (kind === "messages") {
        const r = await api(`messages?page=${page}&limit=20`);
        setItems(r.items);
        setTotal(r.total);
      } else {
        let rows: any[] = [];
        let current = 1;
        let result;
        do {
          result = await api(`content/${kind}?page=${current++}&limit=100`);
          rows.push(...result.items);
        } while (rows.length < result.total);
        setItems(rows);
        setTotal(rows.length);
      }
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (ready) {
      setEditing(null);
      setMessage(null);
      setDirty(false);
      setNotice("");
      void load();
    }
  }, [kind, ready, page]);
  const discard = () => !dirty || window.confirm("Discard unsaved changes?");
  function selectKind(next: Kind) {
    if (busy || uploadCount > 0 || next === kind || !discard()) return;
    setEditing(null);
    setMessage(null);
    setDirty(false);
    setItems([]);
    setTotal(0);
    setBusy(true);
    setKind(next);
    setPage(1);
  }
  async function action(fn: () => Promise<any>, success: string) {
    setBusy(true);
    setNotice("");
    try {
      await fn();
      setNotice(success);
      return true;
    } catch (e) {
      setNotice((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const { id, slug, published, position, data } = editing;
    const entry = { slug, published, position, data };
    const ok = await action(
      () =>
        api(`content/${kind}${id ? `/${id}` : ""}`, id ? "PUT" : "POST", entry),
      "Saved successfully.",
    );
    if (ok) {
      setEditing(null);
      setDirty(false);
      await load();
    }
  }
  async function remove(item: any) {
    if (
      !window.confirm(
        `Delete ${item.data?.name || item.data?.title || "this message"}? This cannot be undone.`,
      )
    )
      return;
    if (
      await action(
        () =>
          api(
            kind === "messages"
              ? `messages/${item.id}`
              : `content/${kind}/${item.id}`,
            "DELETE",
          ),
        "Deleted.",
      )
    ) {
      setMessage(null);
      await load();
    }
  }
  async function reorder(index: number, direction: number) {
    const next = [...items];
    [next[index], next[index + direction]] = [
      next[index + direction],
      next[index],
    ];
    if (
      await action(
        () => api(`reorder/${kind}`, "POST", { ids: next.map((i) => i.id) }),
        "Order saved.",
      )
    )
      await load();
  }
  const change = (key: string, value: any) => {
    setEditing((v) => (v ? { ...v, data: { ...v.data, [key]: value } } : v));
    setDirty(true);
  };
  return (
    <div className="studio">
      <aside>
        <a className="logo" href="/">
          Hamid<span>.</span>
          <small>LOCAL STUDIO</small>
        </a>
        <nav aria-label="CMS sections">
          {kinds.map((k) => (
            <button
              key={k}
              className={kind === k ? "selected" : ""}
              disabled={busy || uploadCount > 0 || !ready}
              onClick={() => selectKind(k)}
            >
              {k}
            </button>
          ))}
        </nav>
        <p className="local-note">
          Private workspace
          <br />
          Running on your computer.
        </p>
      </aside>
      <main>
        <header>
          <div>
            <p className="eyebrow">CONTENT MANAGEMENT</p>
            <h1>{kind === "messages" ? "Message inbox" : kind}</h1>
          </div>
          <span className="local-badge">● Local only</span>
        </header>
        <p role="status" className={notice ? "notice" : ""}>
          {notice || (!ready ? "Connecting to local server…" : "")}
        </p>
        {ready && !editing && kind !== "messages" && (
          <div className="toolbar">
            <p>
              {total} {total === 1 ? "entry" : "entries"}
            </p>
            {(!["profile", "settings"].includes(kind) || !items.length) && (
              <button
                disabled={busy}
                onClick={() => {
                  setEditing({ ...blank(kind), position: items.length });
                  setDirty(false);
                }}
              >
                + Add{" "}
                {kind === "skills"
                  ? "category"
                  : kind === "journey"
                    ? "entry"
                    : kind.replace(/s$/, "")}
              </button>
            )}
            <button
              className="secondary"
              disabled={busy}
              onClick={() => load()}
            >
              Refresh
            </button>
          </div>
        )}
        {editing ? (
          <form onSubmit={save} className="editor">
            <div className="editor-header">
              <h2>
                {editing.id ? "Edit" : "New"} {kind}
              </h2>
              <button
                className="secondary"
                type="button"
                onClick={() => {
                  if (discard()) {
                    setEditing(null);
                    setDirty(false);
                  }
                }}
              >
                Cancel
              </button>
            </div>
            <div className="entry-controls">
              <label>
                URL slug
                <input
                  value={editing.slug}
                  required
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  readOnly={["profile", "settings"].includes(kind)}
                  onChange={(e) => {
                    setEditing({ ...editing, slug: e.target.value });
                    setDirty(true);
                  }}
                />
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={editing.published}
                  onChange={(e) => {
                    setEditing({ ...editing, published: e.target.checked });
                    setDirty(true);
                  }}
                />{" "}
                Published
              </label>
            </div>
            {fields[kind].map((field) => (
              <FieldEditor
                key={field[0]}
                field={field}
                value={editing.data[field[0]]}
                onChange={(v) => change(field[0], v)}
                onError={setNotice}
                onUploadActivity={(delta) =>
                  setUploadCount((n) => Math.max(0, n + delta))
                }
              />
            ))}
            <div className="save-bar">
              <p>
                {dirty
                  ? "Unsaved changes"
                  : editing.published
                    ? "Published content"
                    : "Draft — visible only here"}
              </p>
              <button disabled={busy || uploadCount > 0}>
                {uploadCount > 0
                  ? "Uploading images…"
                  : busy
                    ? "Saving…"
                    : "Save changes"}
              </button>
            </div>
          </form>
        ) : kind === "messages" ? (
          <>
            <div className="toolbar">
              <p>{total} messages</p>
              <button
                className="secondary"
                onClick={() => load()}
                disabled={busy}
              >
                Refresh
              </button>
            </div>
            <div className="inbox">
              {items.map((m) => (
                <article className={`row ${m.read ? "" : "unread"}`} key={m.id}>
                  <button
                    className="message-open"
                    onClick={() => setMessage(m)}
                  >
                    <strong>{m.name}</strong>
                    <span>{m.subject || "No subject"}</span>
                    <small>{new Date(m.createdAt).toLocaleString()}</small>
                  </button>
                  <button
                    className="secondary"
                    disabled={busy}
                    onClick={async () => {
                      if (
                        await action(
                          () =>
                            api(`messages/${m.id}`, "PATCH", { read: !m.read }),
                          "Updated.",
                        )
                      ) {
                        setMessage(null);
                        await load();
                      }
                    }}
                  >
                    Mark {m.read ? "unread" : "read"}
                  </button>
                  <button
                    className="danger"
                    disabled={busy}
                    onClick={() => remove(m)}
                  >
                    Delete
                  </button>
                </article>
              ))}
              {!items.length && <p className="empty">No messages yet.</p>}
            </div>
            <div className="pagination">
              <button
                className="secondary"
                disabled={page === 1 || busy}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span>Page {page}</span>
              <button
                className="secondary"
                disabled={page * 20 >= total || busy}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
            {message && (
              <section className="message-detail">
                <button className="secondary" onClick={() => setMessage(null)}>
                  Close message
                </button>
                <h2>{message.subject || "No subject"}</h2>
                <p>
                  From: {message.name} ·{" "}
                  <a href={`mailto:${message.email}`}>{message.email}</a>
                </p>
                <p className="message-body">{message.message}</p>
              </section>
            )}
          </>
        ) : (
          <div className="entry-list">
            {items.map((item, index) => (
              <article className="row" key={item.id}>
                <div className="entry-name">
                  <strong>
                    {item.data.name || item.data.title || "Site settings"}
                  </strong>
                  <span>
                    /{item.slug} · {item.published ? "Published" : "Draft"}
                  </span>
                </div>
                <div className="row-actions">
                  {!["profile", "settings"].includes(kind) && (
                    <>
                      <button
                        aria-label="Move up"
                        className="secondary"
                        disabled={index === 0 || busy}
                        onClick={() => reorder(index, -1)}
                      >
                        ↑
                      </button>
                      <button
                        aria-label="Move down"
                        className="secondary"
                        disabled={index === items.length - 1 || busy}
                        onClick={() => reorder(index, 1)}
                      >
                        ↓
                      </button>
                    </>
                  )}
                  <button
                    disabled={busy}
                    onClick={() => {
                      setEditing(structuredClone(item));
                      setDirty(false);
                    }}
                  >
                    Edit
                  </button>
                  {!["profile", "settings"].includes(kind) && (
                    <button
                      className="danger"
                      disabled={busy}
                      onClick={() => remove(item)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </article>
            ))}
            {!items.length && !busy && (
              <p className="empty">No entries. Add your first one above.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
function FieldEditor({
  field,
  value,
  onChange,
  onError,
  onUploadActivity,
}: {
  field: Field;
  value: any;
  onChange: (v: any) => void;
  onError: (m: string) => void;
  onUploadActivity: (delta: number) => void;
}) {
  const [key, label, type = "text"] = field;
  const [uploading, setUploading] = useState(false);
  async function upload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    onUploadActivity(1);
    try {
      onChange((await uploadAsset(file)).url);
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setUploading(false);
      onUploadActivity(-1);
    }
  }
  async function uploadGallery(files: FileList | null) {
    if (!files?.length) return;
    if (value.length + files.length > 12) {
      onError("A project can have up to 12 screenshots.");
      return;
    }
    const added: string[] = [];
    setUploading(true);
    onUploadActivity(1);
    try {
      for (const file of Array.from(files))
        added.push((await uploadAsset(file)).url);
    } catch (e) {
      onError((e as Error).message);
    } finally {
      if (added.length) onChange([...value, ...added]);
      setUploading(false);
      onUploadActivity(-1);
    }
  }
  if (type === "checkbox")
    return (
      <label className="check">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
        />
        {label}
      </label>
    );
  if (type === "links")
    return (
      <fieldset>
        <legend>{label}</legend>
        {value.map((link: any, i: number) => (
          <div className="repeat-row" key={i}>
            <input
              aria-label="Link label"
              placeholder="Platform"
              value={link.label}
              onChange={(e) =>
                onChange(
                  value.map((v: any, j: number) =>
                    i === j ? { ...v, label: e.target.value } : v,
                  ),
                )
              }
            />
            <input
              aria-label="Link URL"
              type="url"
              required
              placeholder="https://…"
              value={link.href}
              onChange={(e) =>
                onChange(
                  value.map((v: any, j: number) =>
                    i === j ? { ...v, href: e.target.value } : v,
                  ),
                )
              }
            />
            <button
              type="button"
              className="danger"
              onClick={() =>
                onChange(value.filter((_: any, j: number) => j !== i))
              }
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="secondary"
          onClick={() => onChange([...value, { label: "", href: "" }])}
        >
          + Add link
        </button>
      </fieldset>
    );
  if (type === "skills")
    return (
      <fieldset>
        <legend>{label}</legend>
        <p className="hint">
          Choose a bundled icon or a text fallback. Upload a PNG/WebP icon using
          the uploader below and paste its URL if needed.
        </p>
        {value.map((skill: any, i: number) => (
          <div className="skill-row" key={i}>
            <input
              aria-label="Skill name"
              placeholder="Skill name"
              required
              value={skill.name}
              onChange={(e) =>
                onChange(
                  value.map((v: any, j: number) =>
                    j === i ? { ...v, name: e.target.value } : v,
                  ),
                )
              }
            />
            <select
              aria-label="Skill icon"
              value={skill.icon}
              onChange={(e) =>
                onChange(
                  value.map((v: any, j: number) =>
                    j === i ? { ...v, icon: e.target.value } : v,
                  ),
                )
              }
            >
              <option value="">Text fallback</option>
              {icons.map((icon) => (
                <option key={icon}>{icon}</option>
              ))}
            </select>
            <input
              aria-label="Custom icon URL"
              placeholder="Optional custom icon URL"
              value={skill.imageUrl}
              onChange={(e) =>
                onChange(
                  value.map((v: any, j: number) =>
                    j === i ? { ...v, imageUrl: e.target.value } : v,
                  ),
                )
              }
            />
            <div className="mini-actions">
              <button
                type="button"
                className="secondary"
                disabled={i === 0}
                onClick={() => {
                  const next = [...value];
                  [next[i], next[i - 1]] = [next[i - 1], next[i]];
                  onChange(next);
                }}
                aria-label="Move skill up"
              >
                ↑
              </button>
              <button
                type="button"
                className="secondary"
                disabled={i === value.length - 1}
                onClick={() => {
                  const next = [...value];
                  [next[i], next[i + 1]] = [next[i + 1], next[i]];
                  onChange(next);
                }}
                aria-label="Move skill down"
              >
                ↓
              </button>
              <button
                type="button"
                className="danger"
                onClick={() =>
                  onChange(value.filter((_: any, j: number) => j !== i))
                }
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="secondary"
          onClick={() =>
            onChange([...value, { name: "", icon: "", imageUrl: "" }])
          }
        >
          + Add skill
        </button>
        <IconUploader onError={onError} />
      </fieldset>
    );
  if (type === "sections")
    return (
      <fieldset>
        <legend>{label}</legend>
        {value.map((s: any, i: number) => (
          <div className="section-row" key={s.id}>
            <label className="check">
              <input
                type="checkbox"
                checked={s.visible}
                onChange={(e) =>
                  onChange(
                    value.map((v: any, j: number) =>
                      i === j ? { ...v, visible: e.target.checked } : v,
                    ),
                  )
                }
              />
              {s.id}
            </label>
            <button
              type="button"
              className="secondary"
              disabled={i === 0}
              onClick={() => {
                const next = [...value];
                [next[i], next[i - 1]] = [next[i - 1], next[i]];
                onChange(next);
              }}
            >
              ↑
            </button>
            <button
              type="button"
              className="secondary"
              disabled={i === value.length - 1}
              onClick={() => {
                const next = [...value];
                [next[i], next[i + 1]] = [next[i + 1], next[i]];
                onChange(next);
              }}
            >
              ↓
            </button>
          </div>
        ))}
      </fieldset>
    );
  if (type === "gallery")
    return (
      <fieldset disabled={uploading} className="gallery-editor">
        <legend>{label}</legend>
        <p className="hint">
          These images appear on the project details page. The cover image above
          is separate. Add up to 12 screenshots.
        </p>
        <p className="hint">
          {localImageUploads
            ? "Local mode: images are saved in client/public/images/uploads. No storage account is needed while your backend runs locally."
            : "Hosted mode: uploads use the object storage configured on your backend."}
        </p>
        <div className="gallery-editor-grid">
          {value.map((src: string, i: number) => (
            <div className="gallery-edit-item" key={i}>
              <div className="gallery-preview">
                {src ? (
                  <img src={src} alt={`Screenshot ${i + 1} preview`} />
                ) : (
                  <span>Screenshot {i + 1}</span>
                )}
              </div>
              <label>
                Image {i + 1} URL
                <input
                  aria-label={`Gallery image URL ${i + 1}`}
                  value={src}
                  placeholder="/images/projects/screenshot.webp"
                  onChange={(e) =>
                    onChange(
                      value.map((v: string, j: number) =>
                        i === j ? e.target.value : v,
                      ),
                    )
                  }
                />
              </label>
              <div className="mini-actions">
                <button
                  type="button"
                  className="secondary"
                  aria-label={`Move image ${i + 1} up`}
                  disabled={i === 0}
                  onClick={() => {
                    const next = [...value];
                    [next[i], next[i - 1]] = [next[i - 1], next[i]];
                    onChange(next);
                  }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="secondary"
                  aria-label={`Move image ${i + 1} down`}
                  disabled={i === value.length - 1}
                  onClick={() => {
                    const next = [...value];
                    [next[i], next[i + 1]] = [next[i + 1], next[i]];
                    onChange(next);
                  }}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="danger"
                  aria-label={`Remove image ${i + 1}`}
                  onClick={() =>
                    onChange(value.filter((_: string, j: number) => j !== i))
                  }
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="secondary"
          disabled={value.length >= 12}
          onClick={() => onChange([...value, ""])}
        >
          + Add image URL
        </button>
        <label className="upload">
          {uploading ? "Uploading screenshots…" : "Upload project screenshots"}
          <input
            type="file"
            multiple
            disabled={uploading || value.length >= 12}
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              void uploadGallery(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        <p className="hint">
          JPEG, PNG or WebP; maximum 8 MB each. After uploading or reordering,
          press Save changes. Remove takes an image out of this project; the
          file is kept on disk.
        </p>
      </fieldset>
    );
  return (
    <div className="field">
      <label htmlFor={key}>{label}</label>
      {type.includes("|") ? (
        <select
          id={key}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {type.split("|").map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      ) : type === "textarea" || type === "markdown" ? (
        <textarea
          id={key}
          rows={type === "markdown" ? 10 : 4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : type === "tags" ? (
        <input
          id={key}
          value={value.join(", ")}
          onChange={(e) =>
            onChange(e.target.value.split(",").map((v) => v.trim()))
          }
        />
      ) : (
        <input
          id={key}
          readOnly={type === "readonly"}
          type={
            type === "date"
              ? "datetime-local"
              : ["email", "url"].includes(type)
                ? type
                : "text"
          }
          value={
            type === "date"
              ? value
                ? new Date(value).toISOString().slice(0, 16)
                : ""
              : value
          }
          onChange={(e) =>
            onChange(
              type === "date"
                ? e.target.value
                  ? new Date(`${e.target.value}Z`).toISOString()
                  : null
                : e.target.value,
            )
          }
        />
      )}{" "}
      {type === "date" && (
        <p className="hint">
          Date and time in UTC. Leave empty if no publication date is set.
        </p>
      )}
      {["image", "pdf"].includes(type) && (
        <>
          <label className="upload">
            {uploading
              ? "Uploading…"
              : `Upload ${type === "pdf" ? "PDF" : "image"}`}
            <input
              type="file"
              disabled={uploading}
              accept={
                type === "pdf"
                  ? "application/pdf"
                  : "image/png,image/jpeg,image/webp"
              }
              onChange={(e) => upload(e.target.files?.[0])}
            />
          </label>
          <p className="hint">
            Maximum 8 MB. Images: JPEG, PNG or WebP. SVG uploads are rejected.
          </p>
          {value && type === "image" && (
            <img
              className="image-preview"
              src={value}
              alt={`${label} preview`}
            />
          )}
        </>
      )}
      {type === "markdown" && (
        <details className="preview">
          <summary>Preview Markdown</summary>
          <div className="markdown-preview">
            <Markdown>{value || "Nothing to preview yet."}</Markdown>
          </div>
        </details>
      )}
    </div>
  );
}
function IconUploader({ onError }: { onError: (m: string) => void }) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="icon-uploader">
      <label>
        Upload custom icon
        <input
          disabled={busy}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setBusy(true);
            try {
              setUrl((await uploadAsset(file)).url);
            } catch (error) {
              onError((error as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      {url && (
        <label>
          Uploaded icon URL (copy into the skill above)
          <input readOnly value={url} onFocus={(e) => e.target.select()} />
        </label>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
