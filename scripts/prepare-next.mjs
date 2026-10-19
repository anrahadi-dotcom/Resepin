import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';

const root = new URL('../', import.meta.url);
const publicDir = new URL('../public/', import.meta.url);
const execFileAsync = promisify(execFile);

await mkdir(publicDir, { recursive: true });
for (const directory of ['assets', 'src', 'css']) {
  await cp(new URL(`../${directory}`, import.meta.url), new URL(`../public/${directory}`, import.meta.url), { recursive: true });
}
for (const file of ['favicon.svg', 'site.webmanifest', 'robots.txt', 'sitemap.xml']) {
  await cp(new URL(`../${file}`, import.meta.url), new URL(`../public/${file}`, import.meta.url));
}

await execFileAsync(process.execPath, [
  fileURLToPath(new URL('../node_modules/@tailwindcss/cli/dist/index.mjs', import.meta.url)),
  '-i', 'css/tailwind.css', '-o', 'public/css/app.css', '--minify'
], { cwd: fileURLToPath(root) });
