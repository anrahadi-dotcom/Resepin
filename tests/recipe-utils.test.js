import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { calculateRecipeMatch, formatIDR, matchesAnyIngredient, normalizeIngredient, scaleQuantity, sortRecipes, textMatches } from '../src/recipe-utils.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(resolve(root, 'src/legacy/recipes.js'), 'utf8');
const recipeContext = vm.createContext({});
vm.runInContext(`${source}\nglobalThis.catalog = RECIPES_DB; globalThis.images = RECIPE_IMAGES;`, recipeContext);

test('normalizes common Indonesian spelling without merging distinct ingredients', () => {
  assert.equal(normalizeIngredient('🌶️ Cabe Merah'), 'cabai merah');
  assert.equal(normalizeIngredient('Mie Goreng'), 'mi goreng');
  assert.equal(textMatches('Bawang Putih', 'bawang putih'), true);
  assert.equal(textMatches('Bawang Putih', 'bawang merah'), false);
  assert.equal(textMatches('Tauge', 'tahu'), false);
});

test('ingredient matching supports a small typo tolerance', () => {
  assert.equal(textMatches('Nasi Goreng Sederhana', 'nasi gorengg'), true);
  assert.equal(textMatches('Nasi Goreng Sederhana', 'soto'), false);
});

test('ingredient search filters on requested ingredients, not assumed pantry basics', () => {
  const pisangGoreng = { ingredients: ['Pisang matang', 'Tepung terigu', 'Garam', 'Air', 'Minyak'] };
  const nasiGoreng = { ingredients: ['Nasi putih', 'Telur', 'Bawang putih', 'Minyak'] };
  assert.equal(matchesAnyIngredient(pisangGoreng, ['nasi']), false);
  assert.equal(matchesAnyIngredient(nasiGoreng, ['nasi']), true);
  assert.equal(matchesAnyIngredient(pisangGoreng, ['nasi', 'pisang']), true);
  assert.equal(matchesAnyIngredient(pisangGoreng, ['nasi', 'ayam']), false);
});

test('calculates available and missing ingredients with assumed staples', () => {
  const result = calculateRecipeMatch({ ingredients: ['🍚 Nasi', '🥚 Telur', '🧂 Garam'] }, ['nasi'], ['telur']);
  assert.equal(result.matched, 2);
  assert.equal(result.total, 3);
  assert.deepEqual(result.missing, ['🧂 Garam']);
});

test('scales quantities conservatively and formats Indonesian currency', () => {
  assert.equal(scaleQuantity(2, 2, 3), 3);
  assert.equal(scaleQuantity(0.5, 2, 3), 0.75);
  assert.equal(scaleQuantity(undefined, 2, 3), null);
  assert.equal(formatIDR(12500), 'Rp12.500');
});

test('recipe sorting is stable and orders by match, time, and estimated cost', () => {
  const recipes = [
    { title: 'Lama', time: '40 mnt', estimatedCostPerServingIDR: 5000, ingredients: ['nasi', 'ayam'] },
    { title: 'Murah', time: '15 mnt', estimatedCostPerServingIDR: 3000, ingredients: ['nasi'] },
    { title: 'Cocok', time: '25 mnt', estimatedCostPerServingIDR: 4000, ingredients: ['nasi', 'telur', 'ayam'] }
  ];
  assert.deepEqual(sortRecipes(recipes, 'fastest').map(recipe => recipe.title), ['Murah', 'Cocok', 'Lama']);
  assert.deepEqual(sortRecipes(recipes, 'cheapest').map(recipe => recipe.title), ['Murah', 'Cocok', 'Lama']);
  assert.deepEqual(sortRecipes(recipes, 'match', ['nasi', 'ayam']).map(recipe => recipe.title), ['Lama', 'Murah', 'Cocok']);
  assert.deepEqual(sortRecipes(recipes, 'unknown').map(recipe => recipe.title), recipes.map(recipe => recipe.title));
});

test('recipe catalog has forty complete entries with available local photos', () => {
  const recipes = recipeContext.catalog;
  assert.equal(recipes.length, 40);
  for (const recipe of recipes) {
    assert.ok(recipe.slug && recipe.title && recipe.category);
    assert.ok(recipe.estimatedCostPerServingIDR > 0);
    assert.ok(Array.isArray(recipe.dietary?.contains));
    assert.equal(recipe.ingredientDetails.length, recipe.ingredients.length);
    assert.ok(recipe.steps.length > 0);
    const photo = resolve(root, 'assets', 'img', `${recipeContext.images[recipe.id]}.jpg`);
    assert.ok(existsSync(photo), `${recipe.title} photo exists`);
  }
});

test('critical static UI controls stay accessible and independent of external Vue CDN', () => {
  const html = readFileSync(resolve(root, 'index.html'), 'utf8');
  const main = readFileSync(resolve(root, 'src/legacy/main.js'), 'utf8');
  assert.match(html, /assets\/vendor\/vue-3\.5\.22\.global\.prod\.js" defer/);
  assert.ok(existsSync(resolve(root, 'assets/vendor/vue-3.5.22.global.prod.js')));
  assert.doesNotMatch(html, /unpkg\.com\/vue/);
  assert.match(html, /id="galleryIngredientUpload" type="file" accept="image\/\*"/);
  assert.doesNotMatch(html, /id="galleryIngredientUpload"[^>]*capture=/);
  assert.match(html, /id="chatInput" aria-label=/);
  assert.match(html, /aria-label="Kirim pesan"[^>]*id="chatSendBtn"/);
  assert.match(html, /id="chatMessages" role="log" aria-live="polite"/);
  assert.doesNotMatch(html, /href="#resep"/);
  assert.doesNotMatch(html, /id="recipeJsonLd"/);
  assert.match(html, /class="recipes-scroll" aria-label="Resep unggulan"><\/div>/);
  assert.match(main, /RECIPES_DB\.slice\(0, 6\)\.map\(recipe => createRecipeCardHTML\(recipe\)\)/);
  assert.match(main, /href="#\/resep\/\$\{recipeSlug\(r\)\}"/);
  assert.match(main, /checkScanBackendAvailability/);
  assert.match(html, /Cari resep dari bahan di rumah/);
  assert.match(html, /id="recipeSort"/);
  assert.match(html, /id="clearRecipeFilters"[^>]*hidden/);
  assert.doesNotMatch(html, /🧺|🍲/u);
  assert.doesNotMatch(readFileSync(resolve(root, 'src/legacy/recipes.js'), 'utf8'), /🧱|emoji:/u);
});

test('phase three preserves one main landmark per route and manages focus and theme before paint', () => {
  const html = readFileSync(resolve(root, 'index.html'), 'utf8');
  const main = readFileSync(resolve(root, 'src/legacy/main.js'), 'utf8');
  assert.doesNotMatch(html, /<main\b/i);
  assert.equal((html.match(/class="page[^\"]*" id="page-[^\"]+" role="main" tabindex="-1"/g) || []).length, 8);
  assert.match(html, /<a class="skip-link"[^>]*onclick="focusActivePage\(event\)"/);
  assert.match(main, /window\.focusActivePage = focusActivePage/);
  assert.match(main, /requestAnimationFrame\(\(\) => document\.getElementById\(`page-\$\{page\}`\)\?\.focus/);
  assert.ok(html.indexOf("localStorage.getItem('resep-theme')") < html.indexOf('rel="stylesheet"'));
  assert.match(html, /document\.body\.dataset\.theme = document\.documentElement\.dataset\.theme/);
  assert.match(html, /role="dialog" aria-modal="false"/);
  assert.doesNotMatch(html, /trapFloatingChatFocus/);
});

test('desktop navbar waits for its expansion before links and actions accept pointer clicks', () => {
  const html = readFileSync(resolve(root, 'index.html'), 'utf8');
  const main = readFileSync(resolve(root, 'src/legacy/main.js'), 'utf8');
  const styles = readFileSync(resolve(root, 'css/reference-theme.css'), 'utf8');
  assert.match(main, /function initDesktopNavHoverGuard\(\)/);
  assert.match(main, /setTimeout\(\(\) => \{\s*if \(nav\.matches\(':hover'\)\) nav\.classList\.add\('hover-ready'\);\s*\}, delay\)/);
  assert.match(main, /pointerMovedAfterEntry = true/);
  assert.match(main, /event\.stopImmediatePropagation\(\);\s*navigateToPage\('home'\);/);
  assert.match(main, /initDesktopNavHoverGuard\(\);/);
  assert.match(styles, /\.nav-container:not\(\.hover-ready\):not\(:focus-within\) #navLinks,[\s\S]*?pointer-events: none !important;/);
  assert.match(html, /class="nav-logo" href="#\/"[^>]*aria-label="Resepin, kembali ke Beranda"/);
});
