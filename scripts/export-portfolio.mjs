import { readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const snapshotPath = fileURLToPath(new URL('../client/public/portfolio.json', import.meta.url));
const groups = ['projects', 'skills', 'articles', 'journey'];
function entry(value) {
  if (!value || value.published !== true || typeof value.id !== 'string' ||
      typeof value.slug !== 'string' || !Number.isInteger(value.position) ||
      !value.data || typeof value.data !== 'object' || Array.isArray(value.data))
    throw new Error('Only valid published content can be exported. Publish Profile and Site settings first.');
  return { id: value.id, slug: value.slug, position: value.position,
    published: true, data: value.data,
    ...(typeof value.readTime === 'string' ? { readTime: value.readTime } : {}) };
}
export function publicSnapshot(value) {
  const result = { profile: entry(value?.profile), settings: entry(value?.settings) };
  for (const group of groups) {
    if (!Array.isArray(value[group])) throw new Error(`Missing content group: ${group}`);
    result[group] = value[group].map(entry);
  }
  // The public API validates each content data object. Never export admin lists,
  // messages, environment variables, credentials, or arbitrary top-level fields.
  return result;
}
export async function exportPortfolio(apiUrl = 'http://127.0.0.1:3000/api', destination = snapshotPath) {
  const url = new URL(apiUrl.replace(/\/$/, '') + '/portfolio');
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)))
    throw new Error('Use HTTPS for a hosted API.');
  if (url.username || url.password || url.search || url.hash) throw new Error('Use a public API URL without credentials.');
  const response = await fetch(url, { signal: AbortSignal.timeout(120000) });
  if (!response.ok) throw new Error(`Public API returned ${response.status}. The previous snapshot was preserved.`);
  const body = await response.text();
  if (Buffer.byteLength(body) > 5 * 1024 * 1024) throw new Error('Snapshot exceeds 5 MB.');
  const snapshot = publicSnapshot(JSON.parse(body));
  const temporary = `${destination}.tmp`;
  try {
    await writeFile(temporary, JSON.stringify(snapshot, null, 2) + '\n', { mode: 0o644 });
    await rename(temporary, destination);
  } finally {
    await unlink(temporary).catch(() => {});
  }
  return snapshot;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv[2] === '--check') {
      publicSnapshot(JSON.parse(await readFile(snapshotPath, 'utf8')));
      console.log('Published snapshot is ready.');
    } else {
      const snapshot = await exportPortfolio(process.argv[2]);
      console.log(`Exported published content: ${snapshot.projects.length} projects, ${snapshot.articles.length} articles.`);
      console.log('Commit client/public/portfolio.json and any new public images/CV to publish the update.');
    }
  } catch (error) {
    console.error(`Snapshot failed: ${error.message}`);
    console.error('Start your API and run: node scripts/export-portfolio.mjs (from the repository root).');
    process.exitCode = 1;
  }
}
