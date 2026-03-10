/**
 * Design System Context
 *
 * Two data sources:
 * - Components: Figma REST API (requires FIGMA_API_KEY + FIGMA_DS_FILE_KEY in .env)
 * - Variables:  Daemon eval via figma.teamLibrary (requires Figma open + daemon running)
 *
 * Cache: .ds-cache.json (24h TTL per source)
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CACHE_FILE = join(ROOT, '.ds-cache.json');
const ENV_FILE = join(ROOT, '.env');
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const DAEMON_PORT = 3456;

// Load .env file into process.env (only sets keys not already set)
export function loadEnv() {
  if (!existsSync(ENV_FILE)) return;
  for (const line of readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (key && !process.env[key]) process.env[key] = val;
  }
}

function readCache() {
  if (!existsSync(CACHE_FILE)) return {};
  try { return JSON.parse(readFileSync(CACHE_FILE, 'utf8')); } catch { return {}; }
}

function writeCache(data) {
  writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
}

async function figmaGet(path) {
  loadEnv();
  const key = process.env.FIGMA_API_KEY;
  if (!key) throw new Error('FIGMA_API_KEY not set in .env');
  const res = await fetch(`https://api.figma.com/v1${path}`, {
    headers: { 'X-Figma-Token': key }
  });
  if (!res.ok) throw new Error(`Figma API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function daemonEval(code) {
  let token = null;
  try {
    const tokenFile = join(homedir(), '.figma-ds-cli', '.daemon-token');
    if (existsSync(tokenFile)) token = readFileSync(tokenFile, 'utf8').trim();
  } catch { /* no token */ }

  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['X-Daemon-Token'] = token;

  const res = await fetch(`http://localhost:${DAEMON_PORT}/exec`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action: 'eval', code }),
    signal: AbortSignal.timeout(30000)
  });
  const result = await res.json();
  if (result.error) throw new Error(result.error);
  return result.result;
}

// ── Components (REST API) ──────────────────────────────────────────────────

export async function fetchComponents(fileKey, { force = false } = {}) {
  const cache = readCache();
  if (!force && cache.components?.fileKey === fileKey &&
      Date.now() - (cache.components?.timestamp ?? 0) < CACHE_TTL) {
    return cache.components;
  }

  const data = await figmaGet(`/files/${fileKey}/components`);
  const components = {};
  for (const c of data.meta?.components ?? []) {
    components[c.name] = {
      key: c.key,
      name: c.name,
      description: c.description ?? '',
      frame: c.containing_frame?.name ?? null,
      page: c.containing_page?.name ?? null
    };
  }

  const result = { fileKey, timestamp: Date.now(), count: Object.keys(components).length, components };
  writeCache({ ...readCache(), components: result });
  return result;
}

// ── Variables (daemon eval via figma.teamLibrary) ──────────────────────────

export async function fetchLibraryVariables({ force = false } = {}) {
  const cache = readCache();
  if (!force && cache.variables?.timestamp &&
      Date.now() - cache.variables.timestamp < CACHE_TTL) {
    return cache.variables;
  }

  const code = `(async () => {
    const collections = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();
    const out = [];
    for (const col of collections) {
      const vars = await figma.teamLibrary.getVariablesInLibraryCollectionAsync(col.key);
      out.push({
        collectionKey: col.key,
        collectionName: col.name,
        libraryName: col.libraryName,
        variables: vars.map(v => ({ key: v.key, name: v.name, type: v.resolvedType }))
      });
    }
    return JSON.stringify(out);
  })()`;

  const raw = await daemonEval(code);
  const collections = typeof raw === 'string' ? JSON.parse(raw) : raw;

  const variables = {};
  for (const col of collections) {
    for (const v of col.variables) {
      variables[v.name] = {
        key: v.key,
        name: v.name,
        type: v.type,
        collection: col.collectionName,
        library: col.libraryName
      };
    }
  }

  const result = {
    timestamp: Date.now(),
    count: Object.keys(variables).length,
    collectionNames: [...new Set(collections.map(c => c.collectionName))],
    libraryNames: [...new Set(collections.map(c => c.libraryName))],
    variables
  };
  writeCache({ ...readCache(), variables: result });
  return result;
}

// ── Combined ───────────────────────────────────────────────────────────────

export async function buildDSContext(fileKey, { force = false } = {}) {
  const [comps, vars] = await Promise.all([
    fetchComponents(fileKey, { force }),
    fetchLibraryVariables({ force })
  ]);
  return { components: comps, variables: vars };
}

export function loadDSCache() {
  const cache = readCache();
  if (!cache.components && !cache.variables) return null;
  return cache;
}

// ── Lookup helpers ─────────────────────────────────────────────────────────

export function findVariable(varsCtx, name) {
  const v = varsCtx.variables;
  if (v[name]) return v[name];
  const lower = name.toLowerCase();
  for (const [k, val] of Object.entries(v)) {
    if (k.toLowerCase() === lower) return val;
  }
  for (const [k, val] of Object.entries(v)) {
    if (k.toLowerCase().includes(lower)) return val;
  }
  return null;
}

export function findComponent(compsCtx, name) {
  const c = compsCtx.components;
  if (c[name]) return c[name];
  const lower = name.toLowerCase();
  for (const [k, val] of Object.entries(c)) {
    if (k.toLowerCase() === lower) return val;
  }
  for (const [k, val] of Object.entries(c)) {
    if (k.toLowerCase().includes(lower)) return val;
  }
  return null;
}

export function getColorVariables(varsCtx, filter = '') {
  const lower = filter.toLowerCase();
  return Object.values(varsCtx.variables).filter(v =>
    v.type === 'COLOR' && (!filter || v.name.toLowerCase().includes(lower))
  );
}
