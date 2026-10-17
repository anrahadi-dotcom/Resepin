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
  vm.runInContext('globalThis.testGenerateContextual = generateContextualResponse', context);
  vm.runInContext('globalThis.testGenerateAsync = generateAIResponseAsync', context);
  return context;
}

test('Chef follows through on a recipe offer instead of claiming the meal is ready', async () => {
  const context = createChatbotContext();
  const calls = [];
  context.fetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    calls.push(body);
    return new Response(JSON.stringify(body.action === 'search'
      ? { references: [] }
      : { answer: 'Bikin mi goreng sosis sayur: rebus mi, tumis sosis dan sayur, masukkan mi dan bumbu, lalu aduk sampai matang.' }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  };

  const history = [
    { role: 'assistant', content: 'Mie instan masih bisa jadi bahan masak kreatif, bro. Mau aku kasih resep mie instan yang lebih lezat?' }
  ];
  for (const reply of ['gas', 'gasss', 'oke bro', 'gasin aku ada Indomie goreng, sosis, sama sayur hijau']) {
    calls.length = 0;
    const result = await context.testGenerateAsync(reply, history);
    assert.equal(result.type, 'text', reply);
    assert.match(result.text, /rebus mi|tumis sosis/i, reply);
    assert.equal(calls.length, 2, reply + ' should be sent through the contextual AI route');
    assert.equal(calls[1].message, reply);
    assert.doesNotMatch(result.text, /makan siangnya sudah siap|mau aku kasih resep/i, reply);
  }
});

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
    assert.match(answer.text, /Gas, bro|nyambung/i, prompt);
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

test('a follow-up asking for ingestion first aid cannot fall into the ingredient-substitution route', () => {
  const source = readFileSync(resolve(root, 'src/legacy/chatbot.js'), 'utf8');
  assert.match(source, /followsNonFoodExposure/);
  assert.match(source, /pertolongan\|tindakan\|gimana/);
});

test('salt-fix technique questions do not get routed to an unrelated recipe card', () => {
  const context = createChatbotContext();
  const answer = context.testGenerate('Bagaimana cara mengurangi rasa asin pada masakan?');
  assert.notEqual(answer.type, 'recipe');
  assert.match(answer.text, /air atau kaldu|bahan utama tawar/);
});

test('web search keeps only the chef avatar and a simple animated three-dot loading bubble', () => {
  const source = readFileSync(resolve(root, 'src/legacy/chatbot.js'), 'utf8');
  const styles = readFileSync(resolve(root, 'css/style.css'), 'utf8');
  assert.match(source, /action: 'search'/);
  assert.match(source, /body: JSON\.stringify\(\{ message, history, references \}\)/);
  assert.match(source, /chef-typing-stack/);
  assert.match(source, /class="typing-dots" aria-hidden="true"><span><\/span><span><\/span><span><\/span>/);
  assert.doesNotMatch(source, /chef-search-activity|chef-search-globe|chef-search-page|Membaca halaman|Memantapkan jawaban/);
  assert.match(source, /chef-web-references/);
  assert.match(styles, /@keyframes typingBounce/);
  assert.doesNotMatch(styles, /chefPageHop|chefSearchSweep|chef-search-globe|chef-search-page/);
  assert.doesNotMatch(styles, /\.typing-dots span\s*\{\s*@apply \[animation:none\]/);
  assert.match(styles, /prefers-reduced-motion:\s*reduce/);
  assert.doesNotMatch(source, /const delay = 1200 \+ Math\.random/);
});

test('Chef admits the tone in the recording was stiff, then conversationally corrects the French-fries mistake', () => {
  const context = createChatbotContext();
  const tone = context.testGenerate('kurang asik itu harus kaya sohib bareng');
  assert.equal(tone.type, 'text');
  assert.match(tone.text, /tadi kaku banget/);
  const history = [
    { role: 'user', content: 'aku punya wortel sama kentang doang bro' },
    { role: 'assistant', content: 'Kamu bisa bikin keripik kentang atau wortel goreng.' },
    { role: 'user', content: 'waduh kalau french fries aja gimana wortel nya gausah deh' },
    { role: 'assistant', content: 'Keripik kentang sih gampang.' }
  ];
  for (const prompt of [
    'bukan keripik kentang bro, french fries',
    'aku ga jadi pake wortel nya',
    'waduh kalau french fries aja gimana wortel nya gausah deh'
  ]) {
    const answer = context.testGenerateContextual(prompt, history);
    assert.equal(answer.type, 'text', prompt);
    assert.match(answer.text, /French fries dari kentang/, prompt);
    assert.match(answer.text, /wortelnya kita skip/i, prompt);
    assert.doesNotMatch(answer.text, /wortel bisa diganti dengan kentang|wortel goreng|keripik kentang sih gampang/i, prompt);
  }
});
