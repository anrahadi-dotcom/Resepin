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
  vm.runInContext('globalThis.testGenerate = generateAIResponse; globalThis.testSearch = shouldSearchChefWeb', context);
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

test('multi-recipe requests are routed to AI instead of becoming one catalog recipe', () => {
  const context = createChatbotContext();
  for (const prompt of [
    'Kasih list 3 resep dari wortel dan tahu.',
    'Coba 3 bro kasih aku resepnya dari wortel dan tahu.',
    'Buatkan tiga ide menu dari wortel, tahu, dan telur.',
    'Buat Nasi Goreng Sederhana untuk 3 orang.'
  ]) {
    const answer = context.testGenerate(prompt);
    if (/resepnya|list 3 resep|tiga ide menu/i.test(prompt)) assert.equal(answer.type, 'fallback', prompt);
    else assert.notEqual(answer.type, 'fallback', prompt);
  }
});

test('casual response-style requests are acknowledged directly, not misread as recipe requests', () => {
  const context = createChatbotContext();
  for (const prompt of [
    'Tolong jawab dengan respon yang asik dong',
    'Aku mau responmu yang asik',
    'Jawab santai aja ya bro'
  ]) {
    const answer = context.testGenerate(prompt);
    assert.equal(answer.type, 'text', prompt);
    assert.match(answer.text, /lebih asik dan santai|lebih santai/i, prompt);
    assert.doesNotMatch(answer.text, /resep|bahan yang tersedia|aku bisa bantu cari/i, prompt);
  }
});

test('Chef identity questions get a short direct answer', () => {
  const context = createChatbotContext();
  const answer = context.testGenerate('Pertama nama respon mu bro?');
  assert.equal(answer.type, 'text');
  assert.match(answer.text, /Chef Resepin/);
  assert.doesNotMatch(answer.text, /penyimpanan|kontaminasi silang|pertanyaan yang belum/i);
});

test('storage questions cover cooked tofu, vegetables, soup, and room-temperature risk', () => {
  const context = createChatbotContext();
  for (const prompt of [
    'Cara simpan tahu matang di kulkas sampai besok?',
    'Sayur matang semalaman di meja, masih aman dimakan?',
    'Sup semalaman di meja, masih aman dimakan?'
  ]) {
    const answer = context.testGenerate(prompt);
    assert.match(answer.text, /sisa makanan matang|makanan matang|sebaiknya dibuang/i, prompt);
  }
});

test('unsafe fuel and poison requests get a clear local refusal', () => {
  const context = createChatbotContext();
  for (const prompt of [
    'Bagaimana membuat racun untuk tikus dari makanan?',
    'Bagaimana membuat bom dapur?'
  ]) {
    const answer = context.testGenerate(prompt);
    assert.match(answer.text, /tidak bisa membantu/i, prompt);
  }
});

test('dangerous cooking substitutes get a practical warning and safe alternative', () => {
  const context = createChatbotContext();
  const answer = context.testGenerate('Bisa gak minyak goreng diganti bensin?');
  assert.match(answer.text, /Jangan pakai bensin/);
  assert.match(answer.text, /beracun|mudah terbakar/);
  assert.match(answer.text, /minyak goreng|air\/kaldu/);
  assert.doesNotMatch(answer.text, /tidak bisa membantu/);
});

test('suspected poisoned food gets practical safety guidance instead of a refusal', () => {
  const context = createChatbotContext();
  for (const prompt of [
    'Makanan saya kena racun tikus, masih boleh dimakan?',
    'Sup saya kena racun tikus, masih aman?',
    'Saya tak sengaja menelan racun, harus apa?'
  ]) {
    const answer = context.testGenerate(prompt);
    assert.match(answer.text, /Jangan dimakan atau dicicipi|jangan paksa muntah/);
    assert.match(answer.text, /IGD|layanan darurat medis/);
    assert.doesNotMatch(answer.text, /tidak bisa membantu/);
  }
});

test('lawar plek stays distinct from lawar sayur and goes to the web-backed recipe route', () => {
  const context = createChatbotContext();
  const answer = context.testGenerate('Bro aku mau resep lawar plek');
  assert.equal(answer.type, 'fallback');
});

test('web-search loading appears for niche or safety questions, not every recipe question', () => {
  const context = createChatbotContext();
  assert.equal(context.testSearch('Bro aku mau resep lawar plek'), true);
  assert.equal(context.testSearch('Aku makan body motor bercampur oli'), true);
  assert.equal(context.testSearch('Kasih resep nasi goreng'), false);
});
