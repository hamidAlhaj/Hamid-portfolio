import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createAdminServer } from "../server.mjs";
const key = "local-test-credential-more-than-32-characters";
async function listen(server) {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return server.address().port;
}
test("local origin, Host and CSRF checks protect the server-only credential", async () => {
  let calls = 0;
  let forwarded = "";
  const upstream = http.createServer((req, res) => {
    calls++;
    forwarded = req.headers.authorization;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: true }));
  });
  const remotePort = await listen(upstream);
  // Reserve a port so the Host/origin policy knows it before listening.
  const reserve = http.createServer();
  const port = await listen(reserve);
  await new Promise((r) => reserve.close(r));
  const server = createAdminServer({
    port,
    target: `http://127.0.0.1:${remotePort}/api`,
    key,
  });
  await new Promise((r) => server.listen(port, "127.0.0.1", r));
  const origin = `http://127.0.0.1:${port}`;
  try {
    const session = await fetch(`${origin}/session`);
    assert.equal(session.status, 200);
    const { csrf } = await session.json();
    assert(csrf);
    assert(!JSON.stringify({ csrf }).includes(key));
    assert.equal(
      await new Promise((resolve, reject) => {
        const req = http.get(
          `${origin}/session`,
          { headers: { Host: "attacker.example" } },
          (res) => {
            res.resume();
            resolve(res.statusCode);
          },
        );
        req.on("error", reject);
      }),
      403,
    );
    assert.equal(
      (
        await fetch(`${origin}/session`, {
          headers: { Origin: "https://attacker.example" },
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await fetch(`${origin}/api/content/projects`, {
          method: "POST",
          headers: { Origin: origin },
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await fetch(`${origin}/api/content/projects`, {
          method: "POST",
          headers: { Origin: "https://attacker.example", "X-CSRF-Token": csrf },
        })
      ).status,
      403,
    );
    assert.equal(calls, 0);
    const result = await fetch(`${origin}/api/content/projects`, {
      method: "POST",
      headers: {
        Origin: origin,
        "X-CSRF-Token": csrf,
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    assert.equal(result.status, 200);
    assert.equal(forwarded, `Bearer ${key}`);
    assert(!(await result.text()).includes(key));
    assert.equal((await fetch(`${origin}/api/../../secrets`)).status, 404);
  } finally {
    await new Promise((r) => server.close(r));
    await new Promise((r) => upstream.close(r));
  }
});
test("rejects missing credentials and non-TLS hosted backends", () => {
  assert.throws(() =>
    createAdminServer({ port: 4310, target: "http://example.com/api", key }),
  );
  assert.throws(() =>
    createAdminServer({
      port: 4310,
      target: "https://example.com/api",
      key: "",
    }),
  );
});

test("Windows asset paths stay within the configured directory", async () => {
  const { win32, posix } = await import("node:path");
  const { isWithinDirectory, isLoopback } = await import("../server.mjs");
  assert(
    isWithinDirectory(
      "C:\\portfolio\\admin\\dist",
      "C:\\portfolio\\admin\\dist\\assets\\index.js",
      win32,
    ),
  );
  assert(
    !isWithinDirectory(
      "C:\\portfolio\\admin\\dist",
      "C:\\portfolio\\admin\\.env",
      win32,
    ),
  );
  assert(
    !isWithinDirectory(
      "C:\\portfolio\\admin\\dist",
      "C:\\portfolio\\admin\\dist-other\\secret",
      win32,
    ),
  );
  assert(!isWithinDirectory("C:\\portfolio\\admin\\dist", "D:\\secret", win32));
  assert(isWithinDirectory("/app/dist", "/app/dist/assets/index.css", posix));
  assert(!isWithinDirectory("/app/dist", "/app/.env", posix));
  assert(isLoopback("::ffff:7f00:1"));
  assert(!isLoopback("192.168.1.10"));
});

test("external document navigation loads UI but cross-site session and API requests remain blocked", async () => {
  const { mkdtemp, writeFile, mkdir, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const dist = await mkdtemp(join(tmpdir(), "studio-nav-"));
  await mkdir(join(dist, "assets"));
  await writeFile(
    join(dist, "index.html"),
    "<!doctype html><title>Studio</title>",
  );
  await writeFile(join(dist, "assets", "test.js"), 'console.log("studio")');
  const reserve = http.createServer();
  const port = await listen(reserve);
  await new Promise((r) => reserve.close(r));
  const server = createAdminServer({
    port,
    target: "http://127.0.0.1:3000/api",
    key,
    dist,
  });
  await new Promise((r) => server.listen(port, "127.0.0.1", r));
  const origin = `http://127.0.0.1:${port}`;
  const get = (path, headers = {}) =>
    new Promise((resolve, reject) => {
      http
        .get(`${origin}${path}`, { headers }, (res) => {
          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () =>
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: Buffer.concat(chunks).toString(),
            }),
          );
        })
        .on("error", reject);
    });
  try {
    const navigation = {
      "sec-fetch-mode": "navigate",
      "sec-fetch-dest": "document",
      "sec-fetch-site": "cross-site",
    };
    assert.equal((await get("/", navigation)).status, 200);
    assert.equal((await get("/session", navigation)).status, 403);
    assert.equal((await get("/api/messages", navigation)).status, 403);
    assert.equal((await get("/assets/test.js")).status, 200);
    const redirect = await get("/", { Host: `localhost:${port}` });
    assert.equal(redirect.status, 303);
    assert.equal(redirect.headers.location, `${origin}/`);
    const badHost = await get("/", { Host: `evil.example:${port}` });
    assert.equal(badHost.status, 403);
    assert.equal(JSON.parse(badHost.body).check, "host");
    assert.equal((await get("/%2e%2e/.env")).status, 404);
  } finally {
    await new Promise((r) => server.close(r));
    await rm(dist, { recursive: true, force: true });
  }
});

test("local image upload is CSRF-protected, validates bytes, persists WebP and serves the image", async () => {
  const { mkdtemp, readdir, readFile, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const sharp = (await import("sharp")).default;
  const publicRoot = await mkdtemp(join(tmpdir(), "studio-images-"));
  const reserve = http.createServer();
  const port = await listen(reserve);
  await new Promise((r) => reserve.close(r));
  const server = createAdminServer({
    port,
    target: "http://127.0.0.1:3000/api",
    key,
    publicRoot,
  });
  await new Promise((r) => server.listen(port, "127.0.0.1", r));
  const origin = `http://127.0.0.1:${port}`;
  try {
    const session = await (await fetch(`${origin}/session`)).json();
    assert.equal(session.localImageUploads, true);
    const png = await sharp({
      create: { width: 10, height: 10, channels: 3, background: "#21dda2" },
    })
      .png()
      .toBuffer();
    const upload = (body, type = "image/png", extra = {}) =>
      fetch(`${origin}/api/local-images`, {
        method: "POST",
        headers: {
          Origin: origin,
          "X-CSRF-Token": session.csrf,
          "Content-Type": type,
          ...extra,
        },
        body,
      });
    assert.equal(
      (await upload(png, "image/png", { "X-CSRF-Token": "" })).status,
      403,
    );
    assert.equal(
      (await upload(png, "image/png", { Origin: "https://evil.example" }))
        .status,
      403,
    );
    assert.equal((await upload("<svg/>", "image/svg+xml")).status, 400);
    assert.equal((await upload("<svg/>", "image/png")).status, 400);
    assert.equal((await upload(Buffer.alloc(8 * 1024 * 1024 + 1))).status, 413);
    const response = await upload(png);
    assert.equal(response.status, 201);
    const result = await response.json();
    assert.match(result.url, /^\/images\/uploads\/[a-f0-9-]+\.webp$/);
    const files = await readdir(join(publicRoot, "images", "uploads"));
    assert.equal(files.length, 1);
    const saved = await readFile(
      join(publicRoot, "images", "uploads", files[0]),
    );
    assert.equal((await sharp(saved).metadata()).format, "webp");
    const served = await fetch(`${origin}${result.url}`);
    assert.equal(served.status, 200);
    assert.equal(served.headers.get("content-type"), "image/webp");
    assert.deepEqual(Buffer.from(await served.arrayBuffer()), saved);
  } finally {
    await new Promise((r) => server.close(r));
    await rm(publicRoot, { recursive: true, force: true });
  }
});

test("hosted backends cannot use local filesystem uploads", async () => {
  const reserve = http.createServer();
  const port = await listen(reserve);
  await new Promise((r) => reserve.close(r));
  const server = createAdminServer({
    port,
    target: "https://api.example.com/api",
    key,
  });
  await new Promise((r) => server.listen(port, "127.0.0.1", r));
  const origin = `http://127.0.0.1:${port}`;
  try {
    const session = await (await fetch(`${origin}/session`)).json();
    assert.equal(session.localImageUploads, false);
    assert.equal(
      (
        await fetch(`${origin}/api/local-images`, {
          method: "POST",
          headers: {
            Origin: origin,
            "X-CSRF-Token": session.csrf,
            "Content-Type": "image/png",
          },
          body: "test",
        })
      ).status,
      409,
    );
  } finally {
    await new Promise((r) => server.close(r));
  }
});
