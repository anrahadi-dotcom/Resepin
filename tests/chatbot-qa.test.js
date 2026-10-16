import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function createChatbotContext() {
  const context = vm.createContext({
    detectedIngredients: [],
    currentChatRecipeIdx: null,
    awaitingSubstitutionIngredient: false,
    AI_RESPONSES: { keywords: { default: {} } },
    escapeHtml: value => value
  });
  for (const file of ['src/legacy/recipes.js', 'src/legacy/chef-prompts.js', 'src/legacy/chatbot.js']) {
    vm.runInContext(readFileSync(resolve(root, file), 'utf8'), context);
  }
  vm.runInContext('globalThis.testGenerate = generateAIResponse', context);
  return context;
}

test('cooked chicken storage questions use cooked leftovers guidance', () => {
  const context = createChatbotContext();
  const answer = context.testGenerate('Bagaimana cara menyimpan ayam matang di kulkas dengan aman sampai besok?');
  assert.equal(answer.type, 'text');
  assert.match(answer.text, /sisa makanan matang/);
  assert.doesNotMatch(answer.text, /bahan mentah seperti ayam/);
});

test('multi-ingredient requests do not recommend recipes matching only one listed ingredient', () => {
  const context = createChatbotContext();
  const answer = context.testGenerate('Buatkan menu makan malam hemat untuk 2 orang dari telur, tahu, dan wortel dengan urutan masak yang jelas.');
  assert.equal(answer.type, 'fallback');
});
