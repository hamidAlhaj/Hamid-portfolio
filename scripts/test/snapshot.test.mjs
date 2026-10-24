import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { publicSnapshot, exportPortfolio } from '../export-portfolio.mjs';
const entry = (id) => ({ id, slug: id, position: 0, published: true, data: { title: id } });
const fixture = () => ({ profile: entry('profile'), settings: entry('settings'), projects: [entry('project')], skills: [], articles: [], journey: [] });
test('export includes only public root/entry fields; rejects drafts and missing content', () => {
  const value = fixture(); value.messages = [{ email: 'private@example.test' }]; value.ADMIN_API_KEY = 'private'; value.projects[0].privateMetadata = 'private';
  const json = JSON.stringify(publicSnapshot(value));
  assert(!json.includes('private')); assert.equal(publicSnapshot(value).projects.length, 1);
  value.projects[0].published = false;
  assert.throws(() => publicSnapshot(value));
  assert.throws(() => publicSnapshot({ ...fixture(), profile: null }));
});
test('exports public GET without a credential and preserves previous snapshot on failure', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'portfolio-snapshot-'));
  let failure = false;
  const server = http.createServer((req, res) => {
    assert.equal(req.url, '/api/portfolio'); assert.equal(req.headers.authorization, undefined);
    res.writeHead(failure ? 503 : 200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(fixture()));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const destination = join(dir, 'portfolio.json');
    const url = `http://127.0.0.1:${server.address().port}/api`;
    await exportPortfolio(url, destination);
    const before = await readFile(destination, 'utf8');
    assert.deepEqual(JSON.parse(before), publicSnapshot(fixture()));
    failure = true; await assert.rejects(exportPortfolio(url, destination));
    assert.equal(await readFile(destination, 'utf8'), before);
  } finally { await new Promise(resolve => server.close(resolve)); await rm(dir, { recursive: true, force: true }); }
});
