import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const output = new URL('../dist/', import.meta.url);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const entry of ['index.html', 'css', 'src', 'assets', 'favicon.svg', 'site.webmanifest', 'robots.txt', 'sitemap.xml']) {
  await cp(new URL(`../${entry}`, import.meta.url), new URL(`../dist/${entry}`, import.meta.url), { recursive: true });
}

const stylesheets = ['css/style.css', 'css/responsive.css', 'css/reference-theme.css'];
const cacheKey = createHash('sha256');
let html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
cacheKey.update(html);

for (const stylesheet of stylesheets) {
  cacheKey.update(await readFile(new URL(`../${stylesheet}`, import.meta.url)));
}

const assetVersion = cacheKey.digest('hex').slice(0, 10);
for (const stylesheet of stylesheets) {
  html = html.replace(`href="/${stylesheet}"`, `href="/${stylesheet}?v=${assetVersion}"`);
}

await writeFile(new URL('../dist/index.html', import.meta.url), html);
