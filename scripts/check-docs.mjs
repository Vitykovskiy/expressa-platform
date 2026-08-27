#!/usr/bin/env node

/**
 * Offline Docs-as-Code checks. Documentation uses relative Markdown links.
 * Links in fenced code blocks, external URLs, anchors and mail links are
 * deliberately ignored.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, extname, normalize, relative, resolve, sep } from 'node:path';

const root = process.cwd();
const SCOPES = {
  root: { docs: 'docs', index: 'docs/INDEX.md' },
  backend: { docs: 'backend/docs', index: 'backend/docs/INDEX.md' },
  'front-office': { docs: 'front-office/docs', index: 'front-office/docs/INDEX.md' },
  'back-office': { docs: 'back-office/docs', index: 'back-office/docs/INDEX.md' },
  e2e: { docs: 'e2e/docs', index: 'e2e/docs/INDEX.md' },
};
const EXCLUDED_DIRECTORIES = new Set([
  '.cache', '.codex', '.git', '.turbo', '.vite', 'build', 'cache', 'coverage',
  'dist', 'generated', 'node_modules', 'playwright-report', 'reports', 'test-results', 'tmp', 'vendor',
]);
const HISTORICAL_DIRECTORIES = new Set(['_journal', '_sources']);
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
    if (entry.isDirectory()) return EXCLUDED_DIRECTORIES.has(entry.name) ? [] : walk(path, predicate);
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

function applicationRoot(scope) {
  return scope.appRoot ?? (scope.name === 'root' ? root : resolve(root, scope.name));
}

function scopeNavigationFiles(scope, files) {
  const appRoot = applicationRoot(scope);
  return [...new Set([
    ...files,
    resolve(appRoot, 'README.md'),
    resolve(appRoot, 'AGENTS.md'),
  ])].filter(existsSync);
}

function readmeStructureViolation(text) {
  const lines = text.split(/\r?\n/);
  const headings = lines.flatMap((line, index) => {
    const match = line.match(/^## (?!#)(.+?)\s*#*\s*$/);
    return match ? [{ index, title: match[1] }] : [];
  });
  const structures = headings.filter((heading) => heading.title === 'Структура каталога');
  if (structures.length !== 1) return 'README.md must contain exactly one "## Структура каталога" section';
  if (headings[0]?.index !== structures[0].index) return '"## Структура каталога" must be the first level-two heading';

  let treeStart = structures[0].index + 1;
  while (!lines[treeStart]?.trim()) treeStart += 1;
  if (lines[treeStart]?.trim() !== '```text') return '"## Структура каталога" must be followed by a fenced text tree';

  const treeEnd = lines.findIndex((line, index) => index > treeStart && line.trim() === '```');
  if (treeEnd === -1 || !lines.slice(treeStart + 1, treeEnd).some((line) => line.trim())) {
    return '"## Структура каталога" must be followed by a fenced text tree';
  }
  return null;
}

function checkReadmeStructures(files, scope = 'root') {
  for (const file of files) {
    const violation = readmeStructureViolation(readFileSync(file, 'utf8'));
    if (violation) fail(scope, file, violation);
  }
}

function readmesIn(directory) {
  return walk(directory, (file) => relative(directory, file).split(sep).at(-1) === 'README.md');
}

function trackedNestedReadmes() {
  const paths = execFileSync('git', ['ls-files', '-z', '--', 'README.md', ':(glob)**/README.md'], {
    cwd: root,
    encoding: 'utf8',
  }).split('\0').filter(Boolean);
  return [...new Set(paths)]
    .map((path) => resolve(root, path))
    .filter((file) => file !== resolve(root, 'README.md'))
    .filter((file) => !relative(root, file).split(sep).some((segment) => EXCLUDED_DIRECTORIES.has(segment)));
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

function isHistoricalNote(file, scope) {
  const local = relative(resolve(root, scope.docs), file).split(sep);
  return local.some((segment) => HISTORICAL_DIRECTORIES.has(segment))
    || local.includes('backlog')
    || frontmatter(readFileSync(file, 'utf8')).status === 'superseded';
}

function isExcludedFromLinkChecks(file, scope) {
  return relative(resolve(root, scope.docs), file)
    .split(sep)
    .some((segment) => HISTORICAL_DIRECTORIES.has(segment));
}

function usesLegacyContentChecks(scope) {
  return scope.name !== 'e2e';
}

function isHistoricalDirectory(directory, scope) {
  return relative(resolve(root, scope.docs), directory)
    .split(sep)
    .some((segment) => HISTORICAL_DIRECTORIES.has(segment));
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

function wikilinks(text) {
  return [...withoutInlineCode(withoutFencedCode(text)).matchAll(/\[\[[^\]]+\]\]/g)].map((match) => match[0]);
}

function checkLinks(scope, files) {
  const docsDirectory = resolve(root, scope.docs);
  for (const file of files) {
    if (isExcludedFromLinkChecks(file, scope)) continue;
    const text = readFileSync(file, 'utf8');
    for (const link of wikilinks(text)) fail(scope.name, file, `Obsidian wikilink is not allowed: ${link}`);
    for (const target of links(text)) {
      if (escapesWorkspace(file, target)) {
        fail(scope.name, file, `link outside workspace: ${target}`);
        continue;
      }
      const resolved = resolveTarget(file, target, docsDirectory);
      if (resolved && !existsSync(resolved)) fail(scope.name, file, `broken link: ${target}`);
      if (resolved && existsSync(resolved) && statSync(resolved).isDirectory()) {
        fail(scope.name, file, `link must target a file: ${target}`);
      }
    }
  }
}

function directSubdirectories(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !EXCLUDED_DIRECTORIES.has(entry.name))
    .map((entry) => resolve(directory, entry.name));
}

function hasDocumentationContent(directory) {
  return walk(directory, (file) => extname(file) === '.md').length > 0;
}

function needsIndex(directory) {
  const notes = readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && extname(entry.name) === '.md')
    .map((entry) => entry.name)
    .filter((name) => !['README.md', 'INDEX.md', 'COVERAGE.md'].includes(name) && !name.startsWith('_MOC-'));
  return notes.length >= 2 || directSubdirectories(directory).some(hasDocumentationContent);
}

function docsDirectories(scope) {
  const docsDirectory = resolve(root, scope.docs);
  const directories = [docsDirectory];
  const visit = (directory) => {
    for (const child of directSubdirectories(directory)) {
      if (isHistoricalDirectory(child, scope)) continue;
      directories.push(child);
      visit(child);
    }
  };
  visit(docsDirectory);
  return directories;
}

function resolvesTo(file, target, expected, docsDirectory) {
  return resolveTarget(file, target, docsDirectory) === expected;
}

function linksTo(file, expected, docsDirectory) {
  return links(readFileSync(file, 'utf8')).some((target) => resolvesTo(file, target, expected, docsDirectory));
}

function checkIndexes(scope) {
  const docsDirectory = resolve(root, scope.docs);
  for (const directory of docsDirectories(scope)) {
    const index = resolve(directory, 'INDEX.md');
    if (needsIndex(directory) && !existsSync(index)) {
      const moc = readdirSync(directory, { withFileTypes: true }).some((entry) => entry.isFile() && entry.name.startsWith('_MOC-'));
      fail(scope.name, directory, moc ? 'local _MOC-* cannot replace required INDEX.md' : 'missing INDEX.md');
      continue;
    }
    if (existsSync(index)) {
      for (const child of directSubdirectories(directory)) {
        const childIndex = resolve(child, 'INDEX.md');
        if (existsSync(childIndex) && !linksTo(index, childIndex, docsDirectory)) {
          fail(scope.name, index, `missing child INDEX.md link: ${relative(root, childIndex)}`);
        }
      }
    }
    if (directory === docsDirectory || !existsSync(index)) continue;
    const parentIndex = resolve(dirname(directory), 'INDEX.md');
    if (existsSync(parentIndex) && !linksTo(index, parentIndex, docsDirectory)) {
      fail(scope.name, index, `missing parent INDEX.md link: ${relative(root, parentIndex)}`);
    }
  }
}

function checkEntrypoints(scope) {
  const appRoot = applicationRoot(scope);
  for (const name of ['README.md', 'AGENTS.md', 'docs/INDEX.md']) {
    const file = resolve(appRoot, name);
    if (!existsSync(file)) fail(scope.name, file, `missing required entrypoint: ${name}`);
  }
}

function validateScope(scope, sampleSize = null) {
  const files = markdownFiles(scope);
  checkEntrypoints(scope);
  checkLinks(scope, scopeNavigationFiles(scope, files));
  checkIndexes(scope);
  if (usesLegacyContentChecks(scope)) {
    checkMetadata(scope, files);
    checkCoverage(scope);
  }
  checkReachability(scope, files);
  return { files, sources: checkSources(scope, files, sampleSize) };
}

function requiredRootNavigationFiles() {
  const required = [resolve(root, 'README.md'), resolve(root, 'AGENTS.md')];
  for (const [name, definition] of Object.entries(SCOPES)) {
    const scope = { name, ...definition };
    const appRoot = scope.name === 'root' ? root : resolve(root, scope.name);
    required.push(resolve(appRoot, 'README.md'), resolve(appRoot, 'AGENTS.md'));
    required.push(...docsDirectories(scope).map((directory) => resolve(directory, 'INDEX.md')).filter(existsSync));
  }
  return [...new Set(required)];
}

function rootReachableFiles() {
  const start = resolve(root, 'README.md');
  const seen = new Set();
  const visit = (file) => {
    if (seen.has(file) || !existsSync(file) || extname(file) !== '.md') return;
    seen.add(file);
    for (const target of links(readFileSync(file, 'utf8'))) {
      const next = resolveTarget(file, target, root);
      if (next && existsSync(next) && extname(next) === '.md') visit(next);
    }
  };
  visit(start);
  return seen;
}

function checkRootReachability() {
  const reachable = rootReachableFiles();
  for (const file of requiredRootNavigationFiles()) {
    if (relative(root, file).split(sep).some((segment) => HISTORICAL_DIRECTORIES.has(segment))) continue;
    if (!reachable.has(file)) fail('root', file, 'unreachable from README.md');
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
    if (!isKnowledgeNote(file, scope) || isHistoricalNote(file, scope)) continue;
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
    .filter(({ target, resolved }) => CODE_EXTENSIONS.has(extname(target)) || /(?:^|\/)(?:src|test|tests|openapi|contracts|scripts|config)(?:\/|$)/.test(target) || target.startsWith('.'))
    .map(({ target, resolved }) => ({ target, resolved }));
}

function checkSources(scope, files, sampleSize) {
  const docsDirectory = resolve(root, scope.docs);
  const sources = files.filter((file) => !isHistoricalNote(file, scope))
    .flatMap((file) => sourcePaths(readFileSync(file, 'utf8'), file, docsDirectory)
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
      console.log('Usage: node scripts/check-docs.mjs [--scope all|root|backend|front-office|back-office|e2e] [--sample N] [--self-test]');
      process.exit(0);
    } else throw new Error(`unknown argument: ${argument}`);
  }
  if (selected !== 'all' && !SCOPES[selected]) throw new Error(`unknown scope: ${selected}`);
  if (sampleSize !== null && (!Number.isInteger(sampleSize) || sampleSize < 1)) throw new Error('--sample must be a positive integer');
  return { selected, sampleSize, selfTest };
}

function writeFixture(directory, files) {
  for (const [path, text] of Object.entries(files)) {
    const file = resolve(directory, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, text);
  }
}

function e2eFixtureFailures(files) {
  mkdirSync(resolve(root, '.codex/tmp'), { recursive: true });
  const directory = mkdtempSync(resolve(root, '.codex/tmp/check-docs-self-test-'));
  try {
    writeFixture(directory, {
      'e2e/README.md': '# E2E\n\nКраткое назначение.\n\n## Структура каталога\n\n```text\ne2e/\n└── docs/\n```\n\n[Документация](docs/INDEX.md)\n',
      'e2e/AGENTS.md': '[Документация](docs/INDEX.md)\n',
      'e2e/docs/INDEX.md': '# E2E\n',
      ...files,
    });
    const scope = {
      name: 'e2e',
      appRoot: resolve(directory, 'e2e'),
      docs: relative(root, resolve(directory, 'e2e/docs')),
      index: relative(root, resolve(directory, 'e2e/docs/INDEX.md')),
    };
    const firstFailure = failures.length;
    validateScope(scope);
    checkReadmeStructures(readmesIn(scope.appRoot), scope.name);
    return failures.splice(firstFailure);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function runSelfTest() {
  const expected = (actual, value, name) => {
    if (actual !== value) throw new Error(`self-test failed: ${name}`);
  };
  const finds = (files, message, name) => {
    if (!e2eFixtureFailures(files).some((failure) => failure.message.includes(message))) {
      throw new Error(`self-test failed: ${name}`);
    }
  };
  expected(links('[valid](note.md) `[[not-a-link]]` [[Note|label]]').join(','), 'note.md,Note', 'inline code');
  expected(frontmatter('---\nsources:\n  - src/one.ts\n  - src/two.ts\n---\n').sources, 'src/one.ts src/two.ts', 'multiline sources');
  expected(escapesWorkspace(resolve(root, 'docs/note.md'), '../../outside.md'), true, 'workspace boundary');
  expected(splitTableRow('| [[Note|label]] | current |')[0], ' [[Note|label]] ', 'wikilink table cell');
  expected(routeReferences('/ /cart').join(','), '/,/cart', 'root and non-root routes');
  expected([... '../../back-office/package.json'.matchAll(SOURCE_FILE_PATTERN)][0][0], '../../back-office/package.json', 'json source extension');
  expected(Boolean(SCOPES.e2e), true, 'e2e scope');
  expected(wikilinks('[valid](note.md) `[[not-a-link]]` [[Note|label]]').join(','), '[[Note|label]]', 'forbidden wikilink');
  expected(needsIndex(resolve(root, 'docs')), true, 'nested docs directory needs index');
  finds({
    'e2e/README.md': '# E2E\n\nКраткое назначение.\n',
  }, 'must contain exactly one', 'missing README structure section');
  finds({
    'e2e/README.md': '# E2E\n\nКраткое назначение.\n\n## Команды\n\n## Структура каталога\n\n```text\ne2e/\n```\n',
  }, 'must be the first level-two heading', 'README structure section order');
  finds({
    'e2e/README.md': '# E2E\n\nКраткое назначение.\n\n## Структура каталога\n\nТекст вместо дерева.\n',
  }, 'must be followed by a fenced text tree', 'README structure tree');
  finds({
    'e2e/docs/child/INDEX.md': '[Родитель](../INDEX.md)\n',
  }, 'missing child INDEX.md link', 'parent to child index');
  finds({
    'e2e/docs/INDEX.md': '[Нет](missing.md)\n',
  }, 'broken link', 'broken link');
  finds({
    'e2e/docs/INDEX.md': '[Каталог](pages/)\n',
    'e2e/docs/pages/.keep': '',
  }, 'link must target a file', 'directory link');
  finds({
    'e2e/docs/INDEX.md': '[[Guide]]\n',
    'e2e/docs/Guide.md': '# Guide\n',
  }, 'Obsidian wikilink is not allowed', 'wikilink');
  expected(e2eFixtureFailures({
    'e2e/docs/INDEX.md': '[Guide](Guide.md)\n',
    'e2e/docs/Guide.md': '# Guide\n',
  }).length, 0, 'e2e navigation without legacy checks');
  expected(e2eFixtureFailures({
    'e2e/generated/README.md': '# Generated\n',
    'e2e/vendor/README.md': '# Vendor\n',
    'e2e/docs/generated/README.md': '# Generated\n',
    'e2e/docs/generated/Note.md': '# Generated note\n',
    'e2e/docs/vendor/README.md': '# Vendor\n',
    'e2e/docs/vendor/Note.md': '# Vendor note\n',
  }).length, 0, 'generated and vendor files are excluded');
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
    const summary = validateScope(scope, sampleSize);
    summaries.push({ name, files: summary.files.length, sources: summary.sources });
  }
  checkReadmeStructures(trackedNestedReadmes());
  if (selected === 'all' || selected === 'root') checkRootReachability();
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
