const SYNONYMS = [
  [/\b(cabe|cabai|lombok)\b/g, 'cabai'],
  [/\b(mie)\b/g, 'mi'],
  [/\b(daun bawang|bawang daun)\b/g, 'daun bawang'],
  [/\b(gula jawa|gula merah)\b/g, 'gula merah']
];

export function normalizeIngredient(value = '') {
  let normalized = String(value).normalize('NFKC').toLocaleLowerCase('id').trim();
  normalized = normalized.replace(/^\p{Extended_Pictographic}+(?:\uFE0F)?\s*/u, '');
  normalized = normalized.replace(/[^\p{L}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').trim();
  for (const [pattern, replacement] of SYNONYMS) normalized = normalized.replace(pattern, replacement);
  return normalized;
}

function editDistance(left, right) {
  if (Math.abs(left.length - right.length) > 1) return 2;
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= right.length; column += 1) {
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1)
      );
    }
    previous = current;
  }
  return previous[right.length];
}

export function textMatches(value, query) {
  const text = normalizeIngredient(value);
  const term = normalizeIngredient(query);
  if (!text || !term) return false;
  const queryWords = term.split(' ');
  const textWords = text.split(' ');
  if (queryWords.length > textWords.length) return false;
  for (let start = 0; start <= textWords.length - queryWords.length; start += 1) {
    const close = queryWords.every((word, offset) => {
      const candidate = textWords[start + offset];
      return candidate === word || (word.length >= 5 && editDistance(candidate, word) <= 1);
    });
    if (close) return true;
  }
  if (queryWords.length === 1 && term.length >= 5 && textWords.some(word => editDistance(word, term) <= 1)) return true;
  return false;
}

export function getIngredientName(ingredient) {
  return typeof ingredient === 'string' ? ingredient : ingredient?.name || '';
}

export function calculateRecipeMatch(recipe, availableIngredients = [], assumedStaples = []) {
  const available = [...availableIngredients, ...assumedStaples];
  const required = (recipe?.ingredients || []).filter(item => !(typeof item === 'object' && item.optional));
  const matched = required.filter(item => available.some(value => textMatches(getIngredientName(item), getIngredientName(value))));
  const missing = required.filter(item => !matched.includes(item)).map(getIngredientName);
  return { matched: matched.length, total: required.length, percentage: required.length ? matched.length / required.length : 0, missing };
}

export function matchesAnyIngredient(recipe, queries = []) {
  const terms = (Array.isArray(queries) ? queries : [queries]).filter(Boolean);
  return (recipe?.ingredients || []).some(ingredient =>
    terms.some(term => textMatches(getIngredientName(ingredient), term))
  );
}

export function sortRecipes(recipes = [], sortBy = 'match', availableIngredients = [], assumedStaples = []) {
  const source = Array.isArray(recipes) ? recipes : [];
  const ranked = source.map((recipe, index) => ({ recipe, index }));
  const compareStable = (left, right, compare) => compare(left.recipe, right.recipe) || left.index - right.index;
  if (sortBy === 'fastest') {
    ranked.sort((left, right) => compareStable(left, right, (a, b) =>
      (Number.parseInt(a.time, 10) || Number.POSITIVE_INFINITY) - (Number.parseInt(b.time, 10) || Number.POSITIVE_INFINITY)));
  } else if (sortBy === 'cheapest') {
    ranked.sort((left, right) => compareStable(left, right, (a, b) =>
      (Number.isFinite(a.estimatedCostPerServingIDR) ? a.estimatedCostPerServingIDR : Number.POSITIVE_INFINITY) -
      (Number.isFinite(b.estimatedCostPerServingIDR) ? b.estimatedCostPerServingIDR : Number.POSITIVE_INFINITY)));
  } else {
    ranked.sort((left, right) => compareStable(left, right, (a, b) =>
      calculateRecipeMatch(b, availableIngredients, assumedStaples).percentage -
      calculateRecipeMatch(a, availableIngredients, assumedStaples).percentage));
  }
  return ranked.map(item => item.recipe);
}

export function scaleQuantity(amount, originalServings, targetServings) {
  if (!Number.isFinite(amount) || !Number.isFinite(originalServings) || originalServings <= 0 || targetServings <= 0) return null;
  const raw = amount * targetServings / originalServings;
  if (raw >= 10) return Math.round(raw);
  const rounded = Math.round(raw * 4) / 4;
  return Number(rounded.toFixed(2));
}

export function formatIDR(amount) {
  if (!Number.isFinite(amount) || amount < 0) return '';
  return `Rp${Math.round(amount).toLocaleString('id-ID')}`;
}

if (typeof window !== 'undefined') {
  window.ResepinRecipeUtils = { calculateRecipeMatch, formatIDR, getIngredientName, matchesAnyIngredient, normalizeIngredient, scaleQuantity, sortRecipes, textMatches };
}
