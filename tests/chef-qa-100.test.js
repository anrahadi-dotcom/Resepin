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

test('100 offline Chef QA prompts cover general knowledge, catalog, substitutes, safety, and techniques', () => {
  const context = loadChef();
  const general = [
    'Siapa presiden pertama Amerika Serikat?', 'Apa ibu kota Jepang?', 'Kapan Perang Dunia II berakhir?',
    'Siapa penemu telepon?', 'Apa planet terbesar di tata surya?', 'Berapa jarak Bumi ke Bulan?',
    'Jelaskan kenapa langit terlihat biru.', 'Apa mata uang Korea Selatan?', 'Di mana Menara Eiffel berada?',
    'Siapa penulis Laskar Pelangi?', 'Apa arti fotosintesis?', 'Bagaimana kerja panel surya?',
    'Siapa presiden pertama Indonesia?', 'Berapa jumlah planet di tata surya?', 'Apa bahasa resmi Brasil?',
    'Kapan Indonesia memproklamasikan kemerdekaan?', 'Apa fungsi jantung manusia?', 'Siapa yang melukis Mona Lisa?',
    'Apa perbedaan cuaca dan iklim?', 'Kenapa kapal bisa mengapung?'
  ];
  const recipes = vm.runInContext('RECIPES_DB.slice(0, 20).map(recipe => recipe.title)', context)
    .map(title => `Aku mau resep ${title}`);
  const ingredients = [
    'santan', 'kecap manis', 'terasi', 'daun salam', 'kemiri', 'selada', 'ayam', 'telur',
    'roti burger', 'patty', 'tomat', 'keju', 'cabai', 'susu', 'bawang', 'tepung terigu',
    'maizena', 'mentega', 'tepung panir', 'kaldu'
  ];
  const substitutes = ingredients.map(name => `Aku nggak punya ${name}, apa penggantinya?`);
  const foods = ['makanan', 'sup', 'nasi', 'ayam', 'tahu', 'sayur', 'lauk', 'soto', 'ikan', 'tempe', 'udang', 'daging', 'kuah', 'masakan', 'sisa makanan', 'telur', 'sambal', 'kentang', 'pasta', 'mi'];
  const safety = foods.map(food => `Apakah ${food} matang yang semalaman di meja masih aman dimakan?`);
  const techniques = [
    'Bagaimana merebus wortel supaya empuk?', 'Bagaimana bikin telur dadar tebal?',
    'Bagaimana mengurangi rasa asin pada masakan?', 'Cara membuat kuah soto bening?',
    'Cara tumis kangkung supaya tidak layu?', 'Cara bikin tempe orek renyah?',
    'Bagaimana menggoreng ikan sampai matang?', 'Bagaimana agar nasi goreng tidak lembek?',
    'Cara merebus telur setengah matang?', 'Bagaimana memotong bawang agar mata tidak pedih?',
    'Bagaimana mengurangi pedas sambal?', 'Kenapa bolu bisa bantat?',
    'Bagaimana membersihkan kerak gosong di wajan?', 'Cara menumis sayuran supaya tidak berair?',
    'Bagaimana menggoreng tempe supaya renyah?', 'Cara merebus wortel agar tidak terlalu lembek?',
    'Apa cara merebus telur agar setengah matang?', 'Cara mencairkan ayam beku dengan aman?',
    'Bagaimana menyimpan bumbu halus?', 'Bagaimana menyimpan sayur daun agar awet?'
  ];

  const prompts = [
    ...general.map(prompt => ({ prompt, kind: 'general' })),
    ...recipes.map(prompt => ({ prompt, kind: 'recipe' })),
    ...substitutes.map(prompt => ({ prompt, kind: 'substitute' })),
    ...safety.map(prompt => ({ prompt, kind: 'safety' })),
    ...techniques.map(prompt => ({ prompt, kind: 'technique' }))
  ];
  assert.equal(prompts.length, 100);

  const results = prompts.map(({ prompt, kind }) => {
    vm.runInContext('currentChatRecipeIdx = null; awaitingSubstitutionIngredient = false; detectedIngredients = []', context);
    const answer = context.testGenerate(prompt);
    assert.ok(answer && ['text', 'recipe', 'substitusi', 'fallback'].includes(answer.type), prompt);
    assert.doesNotMatch(answer.text || '', /maaf.{0,30}tidak bisa membantu.{0,50}urusan dapur/i, prompt);
    if (kind === 'general') {
      assert.equal(answer.type, 'fallback', `General knowledge should reach web/AI route: ${prompt}`);
    } else if (kind === 'recipe') {
      assert.equal(answer.type, 'recipe', prompt);
    } else if (kind === 'substitute') {
      assert.notEqual(answer.type, 'fallback', prompt);
      assert.ok(answer.text?.length > 25, prompt);
    } else if (kind === 'safety') {
      assert.notEqual(answer.type, 'fallback', prompt);
      assert.match(answer.text, /buang|dibuang|aman|kulkas|suhu ruang/i, prompt);
    } else {
      assert.notEqual(answer.type, 'fallback', prompt);
      assert.ok(answer.text?.length > 20, prompt);
    }
    return { kind, type: answer.type };
  });

  assert.equal(results.length, 100);
  assert.equal(results.filter(item => item.kind === 'general' && item.type === 'fallback').length, 20);
});
