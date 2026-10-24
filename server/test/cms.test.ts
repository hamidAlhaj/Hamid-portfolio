import "reflect-metadata";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { DbService } from "../src/db.service";
import { StorageService } from "../src/storage.service";
import { parseEntry, readingTime } from "../src/content.schema";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
const key = "test-only-admin-key-with-at-least-32-characters";
const project = {
  name: "Test project",
  category: "Backend",
  subtitle: "",
  description: "A test application",
  content: "Details",
  contribution: "",
  challenges: "",
  solutions: "",
  tags: ["NestJS"],
  imageUrl: "",
  gallery: [],
  githubUrl: "",
  liveUrl: "",
  status: "In progress",
  featured: false,
};
const entry = (slug: string, published = false) => ({
  slug,
  published,
  position: 0,
  data: project,
});
test("rejects unsafe URLs, unknown fields, invalid states and incomplete section settings", () => {
  assert.throws(() =>
    parseEntry("projects", {
      ...entry("unsafe"),
      data: { ...project, liveUrl: "javascript:alert(1)" },
    }),
  );
  assert.throws(() =>
    parseEntry("projects", {
      ...entry("unsafe"),
      data: { ...project, liveUrl: "//evil.example" },
    }),
  );
  assert.throws(() =>
    parseEntry("projects", {
      ...entry("extra"),
      data: { ...project, secret: "leak" },
    }),
  );
  assert.throws(() =>
    parseEntry("projects", {
      ...entry("state"),
      data: { ...project, status: "Done" },
    }),
  );
  assert.throws(() =>
    parseEntry("settings", {
      slug: "main",
      published: true,
      position: 0,
      data: { sections: [], background: "red" },
    }),
  );
  assert.equal(readingTime("one two three"), "1 min read");
  assert.equal(readingTime(Array(441).fill("word").join(" ")), "3 min read");
});
test("uploads reject SVG, disguised files, oversized files and malformed PDFs before storage", async () => {
  const storage = new StorageService();
  for (const [buffer, mimetype, size] of [
    [Buffer.from("<svg/>"), "image/svg+xml", 6],
    [Buffer.from("<svg/>"), "image/png", 6],
    [Buffer.from("%PDF-garbage"), "application/pdf", 12],
    [Buffer.from("x"), "image/png", 9 * 1024 * 1024],
  ] as const) {
    await assert.rejects(() =>
      storage.upload({ buffer, mimetype, size } as Express.Multer.File),
    );
  }
});
// Run integration tests against a dedicated migrated PostgreSQL database.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.ADMIN_API_KEY = key;
  let app: any;
  let db: PrismaClient;
  const prefix = `test-${randomUUID()}`;
  let id: string;
  before(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
    db = app.get(DbService);
  });
  after(async () => {
    await db.content.deleteMany({ where: { slug: { startsWith: prefix } } });
    await db.message.deleteMany({ where: { email: `${prefix}@example.com` } });
    await app.close();
  });
  test("all admin methods reject anonymous and incorrect credentials", async () => {
    const calls: [string, string, any?][] = [
      ["get", "/messages"],
      ["get", "/content/projects"],
      ["post", "/content/projects", entry(`${prefix}-blocked`)],
      ["put", "/content/projects/id", entry(`${prefix}-blocked`)],
      ["delete", "/content/projects/id"],
      ["post", "/uploads"],
      ["post", "/reorder/projects", { ids: [] }],
      ["patch", "/messages/id", { read: true }],
      ["delete", "/messages/id"],
    ];
    for (const [method, path, body] of calls) {
      await (request(app.getHttpServer()) as any)
        [method](`/api/admin${path}`)
        .send(body)
        .expect(401);
    }
    await request(app.getHttpServer())
      .get("/api/admin/messages")
      .set("Authorization", "Bearer invalid")
      .expect(401);
  });
  test("create, validate, publish, reorder and delete content with draft isolation", async () => {
    const api = request(app.getHttpServer());
    const auth = `Bearer ${key}`;
    const slug = `${prefix}-project`;
    const created = await api
      .post("/api/admin/content/projects")
      .set("Authorization", auth)
      .send(entry(slug))
      .expect(201);
    id = created.body.id;
    await api.get(`/api/content/projects/${slug}`).expect(404);
    const publicDrafts = await api.get("/api/portfolio").expect(200);
    assert(!publicDrafts.body.projects.some((p: any) => p.id === id));
    const adminList = await api
      .get("/api/admin/content/projects?limit=100")
      .set("Authorization", auth)
      .expect(200);
    assert(adminList.body.items.some((p: any) => p.id === id));
    await api
      .put(`/api/admin/content/projects/${id}`)
      .set("Authorization", auth)
      .send({ ...entry(slug), data: { ...project, unexpected: true } })
      .expect(400);
    await api
      .put(`/api/admin/content/projects/${id}`)
      .set("Authorization", auth)
      .send(entry(slug, true))
      .expect(200);
    await api.get(`/api/content/projects/${slug}`).expect(200);
    await api
      .post("/api/admin/reorder/projects")
      .set("Authorization", auth)
      .send({ ids: [id] })
      .expect(201);
    await api
      .post("/api/admin/reorder/articles")
      .set("Authorization", auth)
      .send({ ids: [id] })
      .expect(400);
    await api
      .post("/api/admin/content/projects")
      .set("Authorization", auth)
      .send(entry(slug))
      .expect(409);
    await api
      .delete(`/api/admin/content/articles/${id}`)
      .set("Authorization", auth)
      .expect(404);
    await api
      .delete(`/api/admin/content/projects/${id}`)
      .set("Authorization", auth)
      .expect(200);
    await api.get(`/api/content/projects/${slug}`).expect(404);
  });
  test("contact validates input, stores messages, permits only authorized inbox access and rate limits", async () => {
    const api = request(app.getHttpServer());
    const auth = `Bearer ${key}`;
    await api
      .post("/api/contact")
      .send({ name: "X", email: "bad", message: "short" })
      .expect(400);
    await api
      .post("/api/contact")
      .send({
        name: "Tester",
        email: `${prefix}@example.com`,
        message: "A valid test message.",
        website: "spam",
      })
      .expect(400);
    await api
      .post("/api/contact")
      .send({
        name: "Tester",
        email: `${prefix}@example.com`,
        subject: "Test",
        message: "A valid test message.",
        website: "",
      })
      .expect(201);
    const list = await api
      .get("/api/admin/messages?limit=100")
      .set("Authorization", auth)
      .expect(200);
    const message = list.body.items.find(
      (m: any) => m.email === `${prefix}@example.com`,
    );
    assert(message);
    await api
      .patch(`/api/admin/messages/${message.id}`)
      .set("Authorization", auth)
      .send({ read: true })
      .expect(200);
    assert((await db.message.findUnique({ where: { id: message.id } }))?.read);
    await api
      .delete(`/api/admin/messages/${message.id}`)
      .set("Authorization", auth)
      .expect(200);
    await api
      .post("/api/contact")
      .send({
        name: "Tester",
        email: `${prefix}@example.com`,
        message: "A valid test message.",
      })
      .expect(429);
  });
} else {
  test(
    "PostgreSQL integration suite requires TEST_DATABASE_URL",
    { skip: true },
    () => {},
  );
}

test("valid images are re-encoded and PDFs are sent to S3-compatible storage with generated filenames", async () => {
  const { createServer } = await import("node:http");
  const sharp = (await import("sharp")).default;
  const { PDFDocument } = await import("pdf-lib");
  const uploads: { path: string; type: string; body: Buffer }[] = [];
  const mock = createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk);
    uploads.push({
      path: req.url!,
      type: req.headers["content-type"]!,
      body: Buffer.concat(chunks),
    });
    res.writeHead(200, { ETag: '"test"' });
    res.end();
  });
  await new Promise<void>((r) => mock.listen(0, "127.0.0.1", r));
  const port = (mock.address() as { port: number }).port;
  const keys = [
    "S3_BUCKET",
    "S3_PUBLIC_URL",
    "S3_ENDPOINT",
    "S3_REGION",
    "S3_ACCESS_KEY_ID",
    "S3_SECRET_ACCESS_KEY",
    "S3_FORCE_PATH_STYLE",
  ];
  const previous = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  Object.assign(process.env, {
    S3_BUCKET: "test-bucket",
    S3_PUBLIC_URL: "https://assets.example",
    S3_ENDPOINT: `http://127.0.0.1:${port}`,
    S3_REGION: "us-east-1",
    S3_ACCESS_KEY_ID: "test",
    S3_SECRET_ACCESS_KEY: "test",
    S3_FORCE_PATH_STYLE: "true",
  });
  try {
    const image = await sharp({
      create: { width: 20, height: 20, channels: 3, background: "#3d00b8" },
    })
      .png()
      .toBuffer();
    const storage = new StorageService();
    const result = await storage.upload({
      buffer: image,
      size: image.length,
      mimetype: "image/png",
      originalname: "../../danger.png",
    } as Express.Multer.File);
    assert.match(
      result.url,
      /^https:\/\/assets\.example\/portfolio\/[a-f0-9-]+\.webp$/,
    );
    assert.equal(uploads[0].type, "image/webp");
    assert.equal((await sharp(uploads[0].body).metadata()).format, "webp");
    const pdf = await PDFDocument.create();
    pdf.addPage();
    const bytes = Buffer.from(await pdf.save());
    const uploaded = await storage.upload({
      buffer: bytes,
      size: bytes.length,
      mimetype: "application/pdf",
    } as Express.Multer.File);
    assert.match(uploaded.url, /\.pdf$/);
    assert.equal(uploads[1].type, "application/pdf");
  } finally {
    for (const k of keys) {
      if (previous[k] === undefined) delete process.env[k];
      else process.env[k] = previous[k];
    }
    await new Promise<void>((r) => mock.close(() => r()));
  }
});
