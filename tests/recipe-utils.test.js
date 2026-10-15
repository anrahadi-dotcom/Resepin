import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { calculateRecipeMatch, formatIDR, normalizeIngredient, scaleQuantity, textMatches } from '../src/recipe-utils.mjs';

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
});
