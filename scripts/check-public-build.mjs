import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
async function walk(dir) {
  const result = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, item.name);
    result.push(...(item.isDirectory() ? await walk(path) : [path]));
  }
  return result;
}
const forbidden = [
  "ADMIN_API_KEY",
  "PORTFOLIO_API_URL",
  "X-CSRF-Token",
  "LOCAL STUDIO",
  "local-test-credential",
];
for (const path of await walk(
  new URL("../client/dist", import.meta.url).pathname,
)) {
  if (!/\.(js|html|css|json)$/.test(path)) continue;
  const source = await readFile(path, "utf8");
  for (const value of forbidden)
    if (source.includes(value))
      throw new Error(`Admin reference in public output: ${value}`);
}
console.log(
  "Public output contains no admin application markers or credential references.",
);
