import http from "node:http";
import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { resolve, extname, relative, isAbsolute, sep } from "node:path";
// Keep filesystem containment checks correct on both Windows and POSIX.
export function isWithinDirectory(
  root,
  file,
  paths = { resolve, relative, isAbsolute, sep },
) {
  const child = paths.relative(paths.resolve(root), paths.resolve(file));
  return (
    !paths.isAbsolute(child) &&
    child !== ".." &&
    !child.startsWith(`..${paths.sep}`)
  );
}
export function isLoopback(address) {
  return ["127.0.0.1", "::1", "::ffff:127.0.0.1", "::ffff:7f00:1"].includes(
    address,
  );
}
const media = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".ico": "image/x-icon",
};
export function createAdminServer({
  port = 4310,
  target,
  key,
  dist = fileURLToPath(new URL("./dist", import.meta.url)),
  publicRoot = fileURLToPath(new URL("../client/public/", import.meta.url)),
}) {
  if (!key || key.length < 32)
    throw new Error("Set ADMIN_API_KEY (at least 32 characters) in admin/.env");
  const upstream = new URL(target);
  if (
    upstream.username ||
    upstream.password ||
    upstream.search ||
    upstream.hash
  )
    throw new Error("Invalid backend URL");
  if (
    upstream.protocol !== "https:" &&
    !(
      upstream.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(upstream.hostname)
    )
  )
    throw new Error("Use HTTPS for hosted backend");
  const localImageUploads = ["localhost", "127.0.0.1", "[::1]"].includes(
    upstream.hostname,
  );
  const origin = `http://127.0.0.1:${port}`;
  const csrf = randomBytes(32).toString("hex");
  return http.createServer(async (req, res) => {
    const json = (status, body) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(body));
    };
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' https: http://127.0.0.1:* data: blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    );
    const url = new URL(req.url, origin);
    // A harmless document navigation may come from an external link. This
    // exception never applies to the session token, API or mutation endpoints.
    const documentNavigation =
      req.method === "GET" &&
      url.pathname === "/" &&
      req.headers["sec-fetch-mode"] === "navigate" &&
      req.headers["sec-fetch-dest"] === "document";
    if (!isLoopback(req.socket.remoteAddress)) {
      json(403, {
        message: "Local origin required",
        check: "loopback-address",
      });
      return;
    }
    if (
      req.headers.host === `localhost:${port}` &&
      req.method === "GET" &&
      url.pathname === "/"
    ) {
      res.writeHead(303, { Location: `${origin}/` });
      res.end();
      return;
    }
    if (req.headers.host !== `127.0.0.1:${port}`) {
      json(403, {
        message: "Local origin required",
        check: "host",
        expected: origin,
      });
      return;
    }
    if (!documentNavigation && req.headers["sec-fetch-site"] === "cross-site") {
      json(403, {
        message: "Local origin required",
        check: "cross-site-request",
      });
      return;
    }
    if (
      !documentNavigation &&
      req.headers.origin &&
      req.headers.origin !== origin
    ) {
      json(403, {
        message: "Local origin required",
        check: "origin",
        expected: origin,
      });
      return;
    }
    if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      json(405, { message: "Method not allowed" });
      return;
    }
    if (req.method !== "GET") {
      const supplied = Buffer.from(String(req.headers["x-csrf-token"] || ""));
      const expected = Buffer.from(csrf);
      if (
        req.headers.origin !== origin ||
        supplied.length !== expected.length ||
        !timingSafeEqual(supplied, expected)
      ) {
        json(403, { message: "Invalid local request token" });
        return;
      }
    }
    if (url.pathname === "/session" && req.method === "GET") {
      json(200, { csrf, localImageUploads });
      return;
    }
    if (url.pathname === "/api/local-images" && req.method === "POST") {
      if (!localImageUploads) {
        json(409, {
          message: "Use object storage uploads when the backend is hosted.",
        });
        return;
      }
      const mime = String(req.headers["content-type"] || "").split(";")[0];
      if (!["image/png", "image/jpeg", "image/webp"].includes(mime)) {
        json(400, {
          message:
            "Choose a JPEG, PNG or WebP image. SVG uploads are not accepted.",
        });
        return;
      }
      const maxBytes = 8 * 1024 * 1024;
      const chunks = [];
      let size = 0;
      try {
        for await (const chunk of req) {
          size += chunk.length;
          if (size > maxBytes) {
            json(413, { message: "Each image must be 8 MB or smaller." });
            return;
          }
          chunks.push(chunk);
        }
        let output;
        try {
          const image = sharp(Buffer.concat(chunks), {
            limitInputPixels: 20000000,
          });
          const info = await image.metadata();
          if (!["jpeg", "png", "webp"].includes(info.format))
            throw new Error("Invalid format");
          output = await image
            .rotate()
            .resize({
              width: 2400,
              height: 2400,
              fit: "inside",
              withoutEnlargement: true,
            })
            .webp({ quality: 85 })
            .toBuffer();
        } catch {
          json(400, {
            message: "This file is not a valid JPEG, PNG or WebP image.",
          });
          return;
        }
        const name = `${randomUUID()}.webp`;
        const directory = resolve(publicRoot, "images", "uploads");
        await mkdir(directory, { recursive: true });
        await writeFile(resolve(directory, name), output, { flag: "wx" });
        json(201, {
          url: `/images/uploads/${name}`,
          type: "image/webp",
          storage: "local",
        });
      } catch {
        json(500, {
          message:
            "Cannot save the image. Check write access to client/public/images/uploads.",
        });
      }
      return;
    }
    if (url.pathname.startsWith("/api/")) {
      const path = url.pathname.slice(5);
      if (
        !/^(content\/(profile|projects|skills|articles|journey|settings)(\/[a-zA-Z0-9-]+)?|reorder\/(profile|projects|skills|articles|journey|settings)|messages(\/[a-zA-Z0-9-]+)?|uploads)$/.test(
          path,
        )
      ) {
        json(404, { message: "Unknown endpoint" });
        return;
      }
      try {
        const chunks = [];
        let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 9 * 1024 * 1024) {
            json(413, { message: "Upload too large" });
            return;
          }
          chunks.push(chunk);
        }
        const headers = {
          Accept: "application/json",
          Authorization: `Bearer ${key}`,
        };
        if (req.headers["content-type"])
          headers["Content-Type"] = req.headers["content-type"];
        const response = await fetch(
          `${target.replace(/\/$/, "")}/admin/${path}${url.search}`,
          {
            method: req.method,
            headers,
            body: req.method === "GET" ? undefined : Buffer.concat(chunks),
            redirect: "error",
            signal: AbortSignal.timeout(30000),
          },
        );
        // Only forward JSON; never relay arbitrary headers or expose server credentials.
        const body = await response
          .json()
          .catch(() => ({ message: "Backend returned an invalid response" }));
        if (!response.ok) {
          json(response.status, {
            message:
              response.status >= 500
                ? "Backend unavailable or storage not configured. Check the backend logs."
                : body.message || "Request rejected",
          });
          return;
        }
        json(response.status, body);
      } catch {
        json(502, {
          message:
            "Cannot reach the portfolio backend. Check its URL and connection.",
        });
      }
      return;
    }
    if (req.method !== "GET") {
      json(404, { message: "Not found" });
      return;
    }
    try {
      const pathname = decodeURIComponent(url.pathname);
      const file = resolve(
        dist,
        pathname === "/" ? "index.html" : `.${pathname}`,
      );
      if (!isWithinDirectory(dist, file)) {
        json(404, { message: "Not found" });
        return;
      }
      const asset = pathname === "/cv.pdf" || pathname.startsWith("/images/");
      const publicFile = resolve(publicRoot, `.${pathname}`);
      if (asset && !isWithinDirectory(publicRoot, publicFile)) {
        json(404, { message: "Not found" });
        return;
      }
      const body = await readFile(asset ? publicFile : file);
      res.writeHead(200, {
        "Content-Type": media[extname(file)] || "application/octet-stream",
      });
      res.end(body);
    } catch {
      json(404, {
        message: "Build the local admin UI with npm run build first.",
      });
    }
  });
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.ADMIN_PORT || 4310);
  if (!Number.isInteger(port) || port < 1024 || port > 65535)
    throw new Error("Invalid ADMIN_PORT");
  createAdminServer({
    port,
    target: process.env.PORTFOLIO_API_URL || "http://127.0.0.1:3000/api",
    key: process.env.ADMIN_API_KEY,
  }).listen(port, "127.0.0.1", () =>
    console.log(`Local Studio: http://127.0.0.1:${port}`),
  );
}
