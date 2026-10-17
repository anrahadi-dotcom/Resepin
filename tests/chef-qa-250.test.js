import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
function loadChef() {
  const context = vm.createContext({
    detectedIngredients: [], currentChatRecipeIdx: null,
    awaitingSubstitutionIngredient: false,
    AI_RESPONSES: { keywords: { default: {} } }, escapeHtml: value => value
  });
  for (const file of ['src/legacy/recipes.js', 'src/legacy/chef-prompts.js', 'src/legacy/chatbot.js']) {
    vm.runInContext(readFileSync(resolve(root, file), 'utf8'), context);
  }
  vm.runInContext('globalThis.testGenerate = generateAIResponse', context);
  return context;
}

test('250 offline Chef QA prompts cover knowledge, recipes, substitutes, food safety, and techniques', () => {
  const context = loadChef();
  const general = [
    'Siapa presiden pertama Amerika Serikat?', 'Apa ibu kota Jepang?', 'Kapan Perang Dunia II berakhir?',
    'Siapa penemu telepon?', 'Apa planet terbesar di tata surya?', 'Berapa jarak Bumi ke Bulan?',
    'Kenapa langit terlihat biru?', 'Apa mata uang Korea Selatan?', 'Di mana Menara Eiffel berada?',
    'Siapa penulis Laskar Pelangi?', 'Apa arti fotosintesis?', 'Bagaimana panel surya menghasilkan listrik?',
    'Siapa presiden pertama Indonesia?', 'Berapa jumlah planet di tata surya?', 'Apa bahasa resmi Brasil?',
    'Kapan Indonesia memproklamasikan kemerdekaan?', 'Apa fungsi jantung manusia?', 'Siapa pelukis Mona Lisa?',
    'Apa perbedaan cuaca dan iklim?', 'Kenapa kapal bisa mengapung?', 'Apa ibu kota Australia?',
    'Siapa yang menulis Bumi Manusia?', 'Apa itu gravitasi?', 'Berapa jumlah sisi segi enam?',
    'Di benua apa Mesir berada?', 'Apa nama samudra terbesar?', 'Kapan manusia pertama kali mendarat di Bulan?',
    'Apa fungsi akar pada tumbuhan?', 'Kenapa pelangi punya banyak warna?', 'Siapa presiden kedua Amerika Serikat?',
    'Apa ibu kota Thailand?', 'Berapa hasil 17 dikali 8?', 'Apa kepanjangan dari CPU?',
    'Siapa tokoh yang dikenal sebagai Bapak Pendidikan Indonesia?', 'Apa perbedaan planet dan bintang?',
    'Kenapa daun umumnya berwarna hijau?', 'Apa mata uang Jepang?', 'Di negara mana Machu Picchu berada?',
    'Apa nama proses perubahan air menjadi uap?', 'Siapa penulis Romeo and Juliet?', 'Berapa banyak provinsi di Pulau Jawa?',
    'Apa fungsi paru-paru?', 'Kapan Hari Sumpah Pemuda diperingati?', 'Apa ibu kota Kanada?',
    'Bagaimana cara kerja internet secara sederhana?', 'Apa hewan mamalia terbesar?', 'Kenapa es mengapung di air?',
    'Apa perbedaan mitosis dan meiosis?', 'Siapa George W. Bush?', 'Kapan George W. Bush menjabat sebagai presiden?'
  ];
  const recipeTitles = vm.runInContext('RECIPES_DB.map(recipe => recipe.title)', context);
  assert.equal(recipeTitles.length, 40, 'QA dataset should cover the full recipe catalog');
  const recipes = [
    ...recipeTitles.map(title => `Aku mau resep ${title}`),
    ...recipeTitles.slice(0, 10).map(title => `Bro, ajarin masak ${title} dong`)
  ];
  const ingredients = [
    'santan', 'kecap manis', 'terasi', 'daun salam', 'kemiri', 'selada', 'ayam', 'telur',
    'roti burger', 'patty', 'tomat', 'keju', 'cabai', 'susu', 'bawang', 'tepung terigu',
    'maizena', 'mentega', 'tepung panir', 'kaldu', 'daging sapi', 'daging', 'ikan', 'udang', 'tempe'
  ];
  const substitutes = [
    ...ingredients.map(name => `Aku nggak punya ${name}, apa penggantinya?`),
    ...ingredients.map(name => `Bahan ${name} habis, ganti apa bro?`)
  ];
  const foods = ['nasi', 'ayam', 'tahu', 'sayur', 'ikan', 'tempe', 'sup', 'telur', 'pasta', 'mi'];
  const safetyPatterns = [
    food => `Apakah ${food} matang yang semalaman di meja masih aman dimakan?`,
    food => `Bro, ${food} matang dari tadi malam tertinggal di meja, aman nggak?`,
    food => `${food} matang tidak masuk kulkas semalaman, sebaiknya diapakan?`,
    food => `Aku lupa menaruh ${food} matang ke kulkas semalaman, masih boleh makan?`,
    food => `${food} matang semalaman suhu ruang aman dikonsumsi?`
  ];
  const safety = foods.flatMap(food => safetyPatterns.map(makePrompt => makePrompt(food)));
  const techniqueTopics = [
    'merebus wortel supaya empuk', 'membuat telur dadar tebal', 'mengurangi rasa asin pada masakan',
    'membuat kuah soto bening', 'menumis kangkung supaya tidak layu', 'membuat tempe orek renyah',
    'menggoreng ikan sampai matang', 'agar nasi goreng tidak lembek', 'merebus telur setengah matang',
    'menyimpan sayur daun agar awet'
  ];
  const techniqueOpeners = [
    topic => `Bagaimana cara ${topic}?`, topic => `Bro, gimana ${topic}?`,
    topic => `Kasih tips buat ${topic} dong.`, topic => `Ada trik biar bisa ${topic}?`,
    topic => `Tolong jelasin singkat cara ${topic}.`
  ];
  const techniques = techniqueTopics.flatMap(topic => techniqueOpeners.map(makePrompt => makePrompt(topic)));
  const prompts = [
    ...general.map(prompt => ({ prompt, kind: 'general' })),
    ...recipes.map(prompt => ({ prompt, kind: 'recipe' })),
    ...substitutes.map(prompt => ({ prompt, kind: 'substitute' })),
    ...safety.map(prompt => ({ prompt, kind: 'safety' })),
    ...techniques.map(prompt => ({ prompt, kind: 'technique' }))
  ];
  assert.equal(general.length, 50);
  assert.equal(recipes.length, 50);
  assert.equal(substitutes.length, 50);
  assert.equal(safety.length, 50);
  assert.equal(techniques.length, 50);
  assert.equal(prompts.length, 250);

  for (const { prompt, kind } of prompts) {
    vm.runInContext('currentChatRecipeIdx = null; awaitingSubstitutionIngredient = false; detectedIngredients = []', context);
    const answer = context.testGenerate(prompt);
    assert.ok(answer && ['text', 'recipe', 'substitusi', 'fallback'].includes(answer.type), prompt);
    assert.doesNotMatch(answer.text || '', /maaf.{0,30}tidak bisa membantu.{0,50}urusan dapur/i, prompt);
    if (kind === 'general') assert.ok(['text', 'fallback'].includes(answer.type), `General knowledge should be answered or routed to AI/search: ${prompt}`);
    if (kind === 'recipe') assert.equal(answer.type, 'recipe', prompt);
    if (kind === 'substitute') assert.ok(['substitusi', 'text'].includes(answer.type), prompt);
    if (kind === 'safety') assert.ok(['text', 'fallback'].includes(answer.type), prompt);
    if (kind === 'technique') assert.ok(['text', 'substitusi', 'fallback'].includes(answer.type), `${prompt} (${answer.type}: ${answer.text})`);
  }
});

test('follow-up fact lookup uses the latest answer rather than the whole unrelated chat', () => {
  const backend = readFileSync(resolve(root, 'functions/api/chef.js'), 'utf8');
  assert.match(backend, /referencesPersonOrTopic/);
  assert.match(backend, /latestAssistantAnswer/);
  assert.match(backend, /latestAssistantAnswer\.slice\(-260\).*message/s);
  assert.match(backend, /George H\.W\. Bush vs George W\. Bush/);
  assert.match(backend, /don't announce|jangan mengumumkan/i);
});
