#!/usr/bin/env node

/**
 * Offline Docs-as-Code checks. Supported links: Markdown `[label](target)` and
 * Obsidian `[[target]]` / `[[target|label]]`. Links in fenced code blocks,
 * external URLs, anchors and mail links are deliberately ignored.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, normalize, relative, resolve, sep } from 'node:path';

const root = process.cwd();
const SCOPES = {
  root: { docs: 'docs', index: 'docs/INDEX.md' },
  backend: { docs: 'backend/docs', index: 'backend/docs/INDEX.md' },
  'front-office': { docs: 'front-office/docs', index: 'front-office/docs/INDEX.md' },
  'back-office': { docs: 'back-office/docs', index: 'back-office/docs/INDEX.md' },
};
const CODE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.vue', '.json', '.yaml', '.yml', '.sql', '.css', '.env']);
const SOURCE_FILE_PATTERN = /[\w./-]+\.(?:tsx|cjs|mjs|json|yaml|yml|vue|sql|css|ts|js|md)(?=$|[^\w])/g;
const REQUIRED_METADATA = ['type', 'owner', 'last_verified', 'sources'];
const failures = [];

function fail(scope, file, message) {
  failures.push({ scope, file: relative(root, file), message });
}

function walk(directory, predicate = () => true) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return walk(path, predicate);
    return predicate(path) ? [path] : [];
  });
}

function withoutFencedCode(text) {
  return text.replace(/^```[\s\S]*?^```\s*$/gm, '');
}

function withoutInlineCode(text) {
  return text.replace(/`[^`\n]*`/g, '');
}

function markdownFiles(scope) {
  return walk(resolve(root, scope.docs), (file) => extname(file) === '.md');
}

function frontmatter(text) {
  const match = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) return {};
  const metadata = {};
  const lines = match[1].split('\n');
  for (let index = 0; index < lines.length; index += 1) {
    const property = lines[index].match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (!property) continue;
    const [, key, value] = property;
    const items = [];
    while (/^\s+-\s+/.test(lines[index + 1] ?? '')) items.push(lines[++index].replace(/^\s+-\s+/, '').trim());
    metadata[key] = value || items.join(' ');
  }
  return metadata;
}

function isKnowledgeNote(file, scope) {
  const local = relative(resolve(root, scope.docs), file).split(sep);
  const name = local.at(-1);
  if (name === 'README.md' || name === 'INDEX.md' || name === 'COVERAGE.md' || name.startsWith('_MOC-')) return false;
  return !local.includes('_journal') && !local.includes('_sources') && !local.includes('backlog');
}

function localTarget(raw) {
  const target = raw.trim().replace(/^<|>$/g, '').replace(/^['"]|['"]$/g, '');
  return target && !target.startsWith('#') && !target.startsWith('/') && !/^(?:https?:|mailto:|tel:|data:)/i.test(target);
}

function withinWorkspace(path) {
  const pathFromRoot = relative(root, path);
  return pathFromRoot === '' || (!pathFromRoot.startsWith(`..${sep}`) && pathFromRoot !== '..');
}

function escapesWorkspace(from, raw) {
  const target = raw.split('#', 1)[0].trim();
  if (!target || target.startsWith('#') || /^(?:https?:|mailto:|tel:|data:)/i.test(target)) return false;
  return target.startsWith('/') || !withinWorkspace(resolve(dirname(from), target));
}

function resolveTarget(from, raw, docsDirectory) {
  const target = raw.split('#', 1)[0].trim();
  if (!localTarget(target)) return null;
  const candidates = [resolve(dirname(from), target)];
  if (!extname(target)) {
    candidates.push(resolve(dirname(from), `${target}.md`));
    candidates.push(resolve(dirname(from), target, 'README.md'));
  }
  // Wikilinks such as [[Auth]] resolve relative to current note first, then docs root.
  if (!target.includes('/') && !extname(target)) candidates.push(resolve(docsDirectory, `${target}.md`));
  const safeCandidates = candidates.filter(withinWorkspace);
  return safeCandidates.find(existsSync) ?? safeCandidates[0] ?? null;
}

function links(text) {
  const clean = withoutInlineCode(withoutFencedCode(text));
  const found = [];
  for (const match of clean.matchAll(/(?<!!)\[[^\]]*\]\(([^)\s]+)(?:\s+['"][^)]*['"])?\)/g)) found.push(match[1]);
  for (const match of clean.matchAll(/\[\[([^\]#]+?)(?:#[^\]|]*)?(?:\\?\|[^\]]*)?\]\]/g)) found.push(match[1].trim());
  return found;
}

function checkLinks(scope, files) {
  const docsDirectory = resolve(root, scope.docs);
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const target of links(text)) {
      if (escapesWorkspace(file, target)) {
        fail(scope.name, file, `link outside workspace: ${target}`);
        continue;
      }
      const resolved = resolveTarget(file, target, docsDirectory);
      if (resolved && !existsSync(resolved)) fail(scope.name, file, `broken link: ${target}`);
    }
  }
}

function checkMetadata(scope, files) {
  for (const file of files) {
    if (!isKnowledgeNote(file, scope)) continue;
    const metadata = frontmatter(readFileSync(file, 'utf8'));
    for (const key of REQUIRED_METADATA) {
      if (!metadata[key]) fail(scope.name, file, `missing metadata: ${key}`);
    }
  }
}

function reachableFiles(scope) {
  const docsDirectory = resolve(root, scope.docs);
  const start = resolve(root, scope.index);
  const seen = new Set();
  const visit = (file) => {
    if (seen.has(file) || !existsSync(file) || extname(file) !== '.md') return;
    seen.add(file);
    for (const target of links(readFileSync(file, 'utf8'))) {
      const next = resolveTarget(file, target, docsDirectory);
      if (next && existsSync(next) && extname(next) === '.md') visit(next);
    }
  };
  visit(start);
  return seen;
}

function checkReachability(scope, files) {
  const reachable = reachableFiles(scope);
  for (const file of files) {
    if (!isKnowledgeNote(file, scope)) continue;
    if (!reachable.has(file)) fail(scope.name, file, `unreachable from ${scope.index}`);
  }
}

function sourcePaths(text, file, docsDirectory) {
  const candidates = links(text);
  const metadata = frontmatter(text);
  if (metadata.sources) {
    for (const source of metadata.sources.matchAll(SOURCE_FILE_PATTERN)) candidates.push(source[0]);
  }
  return candidates
    .filter(localTarget)
    .map((target) => ({ target, resolved: resolveTarget(file, target, docsDirectory) }))
    .filter(({ target, resolved }) => CODE_EXTENSIONS.has(extname(target)) || /(?:^|\/)(?:src|test|tests|openapi|contracts|scripts|\.storybook|config)(?:\/|$)/.test(target) || target.startsWith('.'))
    .map(({ target, resolved }) => ({ target, resolved }));
}

function checkSources(scope, files, sampleSize) {
  const docsDirectory = resolve(root, scope.docs);
  const sources = files.flatMap((file) => sourcePaths(readFileSync(file, 'utf8'), file, docsDirectory)
    .map((source) => ({ ...source, file })));
  const unique = [...new Map(sources.map((source) => [`${source.file}\0${source.target}`, source])).values()]
    .sort((a, b) => `${a.file}:${a.target}`.localeCompare(`${b.file}:${b.target}`));
  const inspected = sampleSize === null ? unique : unique.filter((_, index) => index % Math.max(1, Math.ceil(unique.length / sampleSize)) === 0).slice(0, sampleSize);
  for (const source of inspected) {
    if (!source.resolved || !existsSync(source.resolved)) fail(scope.name, source.file, `missing truth source: ${source.target}`);
  }
  return { total: unique.length, inspected: inspected.length };
}

function sourcePathFromCoverage(cell, file) {
  const docsDirectory = dirname(file);
  const targets = links(cell);
  const quoted = [...cell.matchAll(/`([^`]+)`/g)].map((match) => match[1]);
  for (const target of [...targets, ...quoted]) {
    const resolved = resolveTarget(file, target, docsDirectory);
    if (resolved && CODE_EXTENSIONS.has(extname(resolved))) return normalize(resolved);
  }
  return null;
}

function coverageRows(coverageFile) {
  const lines = readFileSync(coverageFile, 'utf8').split('\n').filter((line) => /^\s*\|/.test(line));
  if (lines.length < 3) return [];
  const headers = splitTableRow(lines[0]).map((cell) => cell.trim().toLowerCase());
  return lines.slice(2).map((line) => {
    const cells = splitTableRow(line).map((cell) => cell.trim());
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']));
  });
}

function splitTableRow(line) {
  const cells = [];
  let cell = '';
  let wikilinkDepth = 0;
  for (let index = 0; index < line.length; index += 1) {
    const pair = line.slice(index, index + 2);
    if (pair === '[[') wikilinkDepth += 1;
    if (pair === ']]' && wikilinkDepth) wikilinkDepth -= 1;
    if (line[index] === '|' && !wikilinkDepth) {
      cells.push(cell);
      cell = '';
    } else cell += line[index];
  }
  cells.push(cell);
  return cells.slice(1, -1);
}

function routeReferences(text) {
  return [...text.matchAll(/(?:^|\s)(\/[^\s|,)`]*)/g)].map((match) => match[1]);
}

function registry(scope) {
  const appRoot = scope.name === 'root' ? root : resolve(root, scope.name);
  const sourceRoot = resolve(appRoot, 'src');
  const files = walk(sourceRoot, (file) => /\.(?:ts|vue)$/.test(file));
  const routeFiles = files.filter((file) => /router(?:\.|$)/.test(file));
  const routeValues = routeFiles.flatMap((file) => [...readFileSync(file, 'utf8').matchAll(/\bpath\s*:\s*['"]([^'"]+)['"]/g)].map((match) => match[1]));
  const openapi = scope.name === 'backend' ? resolve(root, 'backend/openapi/openapi.json') : resolve(appRoot, 'contracts/openapi.json');
  let openapiPaths = [];
  if (existsSync(openapi)) {
    try { openapiPaths = Object.keys(JSON.parse(readFileSync(openapi, 'utf8')).paths ?? {}); } catch { openapiPaths = []; }
  }
  const sourceObjects = files.filter((file) =>
    !/\.(spec|test|types|constants|dependencies)\.(ts|vue)$/.test(file)
    && (/\.store\.ts$/.test(file) || /service.*\.ts$/i.test(file) || /(?:Page|Screen|Dialog)\.vue$/.test(file)));
  return { routeValues, openapiPaths, sourceObjects };
}

function checkCoverage(scope) {
  const coverageFile = resolve(root, scope.docs, 'COVERAGE.md');
  if (!existsSync(coverageFile)) {
    fail(scope.name, coverageFile, 'missing COVERAGE.md');
    return;
  }
  const rows = coverageRows(coverageFile);
  if (!rows.length) {
    fail(scope.name, coverageFile, 'COVERAGE.md has no data rows');
    return;
  }
  const fields = Object.keys(rows[0]);
  for (const required of ['runtime object', 'status', 'authoritative note', 'sources', 'tests']) {
    if (!fields.includes(required)) fail(scope.name, coverageFile, `COVERAGE.md missing column: ${required}`);
  }
  const coveredFiles = new Set();
  const coveredRoutes = new Set();
  const coveredOpenapi = new Set();
  for (const row of rows) {
    const joined = Object.values(row).join(' ');
    const status = row.status?.toLowerCase() ?? '';
    if (!status || (!status.includes('n/a') && !/(current|placeholder|orphan|implemented|active)/.test(status))) {
      fail(scope.name, coverageFile, `invalid coverage status: ${row.status || '(empty)'}`);
    }
    if (status.includes('n/a') && !/reason|причин/i.test(joined)) fail(scope.name, coverageFile, 'N/A coverage row lacks reason');
    const note = row['authoritative note'] ?? '';
    const noteTarget = links(note)[0];
    const resolvedNote = noteTarget && resolveTarget(coverageFile, noteTarget, dirname(coverageFile));
    if (!noteTarget || !resolvedNote || !existsSync(resolvedNote)) fail(scope.name, coverageFile, `invalid authoritative note: ${note || '(empty)'}`);
    for (const field of fields) {
      const source = sourcePathFromCoverage(row[field], coverageFile);
      if (source) coveredFiles.add(source);
    }
    for (const path of routeReferences(joined)) coveredRoutes.add(path);
    for (const value of joined.matchAll(/\b(?:GET|POST|PUT|PATCH|DELETE)\s+(\/[^\s|,)`]+)/g)) coveredOpenapi.add(value[1]);
  }
  const actual = registry(scope);
  for (const file of actual.sourceObjects) if (!coveredFiles.has(normalize(file))) fail(scope.name, coverageFile, `unregistered runtime object: ${relative(root, file)}`);
  for (const path of actual.routeValues) if (!coveredRoutes.has(path)) fail(scope.name, coverageFile, `unregistered route: ${path}`);
  for (const path of actual.openapiPaths) if (!coveredRoutes.has(path) && !coveredOpenapi.has(path)) fail(scope.name, coverageFile, `unregistered OpenAPI path: ${path}`);
}

function parseArguments(argumentsList) {
  let selected = 'all';
  let sampleSize = null;
  let selfTest = false;
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === '--scope') selected = argumentsList[++index];
    else if (argument === '--sample') sampleSize = Number.parseInt(argumentsList[++index], 10);
    else if (argument === '--self-test') selfTest = true;
    else if (argument === '--help') {
      console.log('Usage: node scripts/check-docs.mjs [--scope all|root|backend|front-office|back-office] [--sample N] [--self-test]');
      process.exit(0);
    } else throw new Error(`unknown argument: ${argument}`);
  }
  if (selected !== 'all' && !SCOPES[selected]) throw new Error(`unknown scope: ${selected}`);
  if (sampleSize !== null && (!Number.isInteger(sampleSize) || sampleSize < 1)) throw new Error('--sample must be a positive integer');
  return { selected, sampleSize, selfTest };
}

function runSelfTest() {
  const expected = (actual, value, name) => {
    if (actual !== value) throw new Error(`self-test failed: ${name}`);
  };
  expected(links('[valid](note.md) `[[not-a-link]]` [[Note|label]]').join(','), 'note.md,Note', 'inline code');
  expected(frontmatter('---\nsources:\n  - src/one.ts\n  - src/two.ts\n---\n').sources, 'src/one.ts src/two.ts', 'multiline sources');
  expected(escapesWorkspace(resolve(root, 'docs/note.md'), '../../outside.md'), true, 'workspace boundary');
  expected(splitTableRow('| [[Note|label]] | current |')[0], ' [[Note|label]] ', 'wikilink table cell');
  expected(routeReferences('/ /cart').join(','), '/,/cart', 'root and non-root routes');
  expected([... '../../back-office/package.json'.matchAll(SOURCE_FILE_PATTERN)][0][0], '../../back-office/package.json', 'json source extension');
}

try {
  const { selected, sampleSize, selfTest } = parseArguments(process.argv.slice(2));
  if (selfTest) {
    runSelfTest();
    console.log('Documentation checker self-test passed.');
    process.exit(0);
  }
  const scopes = selected === 'all' ? Object.entries(SCOPES) : [[selected, SCOPES[selected]]];
  const summaries = [];
  for (const [name, definition] of scopes) {
    const scope = { name, ...definition };
    const files = markdownFiles(scope);
    checkLinks(scope, files);
    checkMetadata(scope, files);
    checkReachability(scope, files);
    checkCoverage(scope);
    summaries.push({ name, files: files.length, sources: checkSources(scope, files, sampleSize) });
  }
  for (const summary of summaries) console.log(`${summary.name}: ${summary.files} notes, sampled ${summary.sources.inspected}/${summary.sources.total} truth sources`);
  if (failures.length) {
    for (const failure of failures) console.error(`${failure.scope}: ${failure.file}: ${failure.message}`);
    console.error(`Documentation check failed: ${failures.length} violation(s).`);
    process.exitCode = 1;
  } else console.log('Documentation check passed.');
} catch (error) {
  console.error(`Documentation check failed: ${error.message}`);
  process.exitCode = 1;
}
