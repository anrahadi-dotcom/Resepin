import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);

const output = new URL('../dist/', import.meta.url);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const entry of ['index.html', 'css', 'src', 'assets', 'favicon.svg', 'site.webmanifest', 'robots.txt', 'sitemap.xml']) {
  await cp(new URL(`../${entry}`, import.meta.url), new URL(`../dist/${entry}`, import.meta.url), { recursive: true });
}

await execFileAsync(process.execPath, [
  fileURLToPath(new URL('../node_modules/@tailwindcss/cli/dist/index.mjs', import.meta.url)),
  '-i', 'css/tailwind.css',
  '-o', 'dist/css/app.css',
  '--minify'
], { cwd: fileURLToPath(new URL('..', import.meta.url)) });

for (const source of ['style.css', 'responsive.css', 'reference-theme.css', 'tailwind.css']) {
  await rm(new URL(`../dist/css/${source}`, import.meta.url));
}

const stylesheets = ['css/app.css'];
const cacheKey = createHash('sha256');
let html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
cacheKey.update(html);

for (const stylesheet of stylesheets) {
  cacheKey.update(await readFile(new URL(`../dist/${stylesheet}`, import.meta.url)));
}

const assetVersion = cacheKey.digest('hex').slice(0, 10);
for (const stylesheet of stylesheets) {
  html = html.replace(`href="/${stylesheet}"`, `href="/${stylesheet}?v=${assetVersion}"`);
}

await writeFile(new URL('../dist/index.html', import.meta.url), html);
