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
    AI_RESPONSES: { keywords: { default: {} } },
    escapeHtml: value => value
  });
  for (const file of ['src/legacy/recipes.js', 'src/legacy/chef-prompts.js', 'src/legacy/chatbot.js']) {
    vm.runInContext(readFileSync(resolve(root, file), 'utf8'), context);
  }
  vm.runInContext('globalThis.testGenerate = generateAIResponse; globalThis.testGenerateContextual = generateContextualResponse', context);
  return context;
}

const wordingVariants = prompt => {
  const lower = prompt[0].toLowerCase() + prompt.slice(1);
  return [
    prompt,
    `Bro, ${lower}`,
    `Tolong ${lower}`,
    `Boleh tanya, ${lower}`,
    `Aku penasaran: ${lower}`,
    `${prompt} ya`,
    `${prompt} dong`,
    `${prompt} bro`,
    `Jujur nanya, ${lower}`,
    `Boleh jelasin, ${lower}`
  ];
};

test('2000 offline QA prompts check intent routing across ten Chef scenarios', () => {
  const context = loadChef();
  const titles = vm.runInContext('RECIPES_DB.map(recipe => recipe.title)', context);
  const families = [
    {
      name: 'general knowledge',
      bases: [
        'Apa ibu kota Jepang?', 'Siapa presiden pertama Indonesia?', 'Kenapa langit terlihat biru?',
        'Apa planet terbesar di tata surya?', 'Kapan Perang Dunia II berakhir?',
        'Apa fungsi jantung manusia?', 'Siapa penulis Laskar Pelangi?', 'Apa arti fotosintesis?',
        'Bagaimana panel surya menghasilkan listrik?', 'Apa mata uang Korea Selatan?',
        'Di mana Menara Eiffel berada?', 'Apa perbedaan cuaca dan iklim?', 'Kenapa kapal bisa mengapung?',
        'Apa bahasa resmi Brasil?', 'Berapa jumlah planet di tata surya?', 'Kapan Indonesia merdeka?',
        'Siapa pelukis Mona Lisa?', 'Berapa hasil 17 dikali 8?', 'Apa nama samudra terbesar?',
        'Kenapa es mengapung di air?'
      ],
      check(prompt, answer) {
        assert.ok(['fallback', 'text'].includes(answer.type), prompt);
        assert.doesNotMatch(answer.text || '', /hanya bisa membantu soal masakan/i, prompt);
      }
    },
    {
      name: 'catalog recipe lookup',
      bases: titles.slice(0, 20).map(title => `Aku mau resep ${title}.`),
      check(prompt, answer) { assert.equal(answer.type, 'recipe', prompt); }
    },
    {
      name: 'recipes from one available ingredient',
      bases: ['wortel', 'kentang', 'ayam', 'tahu', 'tempe', 'telur', 'kangkung', 'bayam', 'ikan', 'udang', 'nasi', 'jagung', 'kol', 'tomat', 'sosis', 'jamur', 'buncis', 'mi', 'daging sapi', 'kacang panjang']
        .map(item => `Aku punya ${item}, enaknya dimasak apa?`),
      check(prompt, answer) {
        assert.ok(['recipe', 'fallback', 'text'].includes(answer.type), prompt);
        if (answer.type === 'recipe' && answer.recipe) {
          const recipe = vm.runInContext(`RECIPES_DB[${answer.recipe.idx}]`, context);
          const ingredient = prompt.match(/punya (.+?), enaknya/i)?.[1];
          assert.ok(recipe.ingredients.some(value => value.toLowerCase().includes(ingredient)), `${prompt} returned unrelated ${recipe.title}`);
        }
      }
    },
    {
      name: 'ingredient substitutions',
      bases: ['santan', 'kecap manis', 'terasi', 'daun salam', 'kemiri', 'selada', 'ayam', 'telur', 'roti burger', 'patty', 'tomat', 'keju', 'cabai', 'susu', 'bawang', 'tepung terigu', 'maizena', 'mentega', 'tepung panir', 'kaldu']
        .map(item => `Aku nggak punya ${item}, penggantinya apa?`),
      check(prompt, answer) {
        assert.ok(['substitusi', 'text', 'fallback'].includes(answer.type), prompt);
        assert.doesNotMatch(answer.text || '', /maaf.{0,25}tidak bisa membantu/i, prompt);
      }
    },
    {
      name: 'food storage and safety',
      bases: ['nasi', 'ayam', 'tahu', 'sayur', 'ikan', 'tempe', 'sup', 'telur', 'pasta', 'mi', 'udang', 'daging sapi', 'sambal', 'kentang', 'tumis', 'soto', 'nasi goreng', 'wortel', 'bayam', 'lauk']
        .map(food => `Masakan ${food} matang semalaman di meja, masih aman dimakan?`),
      check(prompt, answer) {
        assert.equal(answer.type, 'text', prompt);
        assert.match(answer.text, /sebaiknya dibuang|terlalu lama|batas umum|jangan dicicipi/i, prompt);
      }
    },
    {
      name: 'cooking techniques',
      bases: ['merebus wortel sampai empuk', 'membuat telur dadar tidak mudah robek', 'mengurangi rasa asin pada masakan', 'membuat kuah soto bening', 'menumis kangkung supaya tetap hijau', 'membuat tempe orek renyah', 'menggoreng ikan sampai matang', 'menjaga nasi goreng agar tidak lembek', 'merebus telur setengah matang', 'menyimpan sayur daun supaya awet', 'mengentalkan saus tanpa menggumpal', 'mencairkan ayam beku dengan aman', 'membuat kentang goreng renyah', 'memotong bawang tanpa pedih', 'membuat sup tidak terlalu berminyak', 'mengukus jagung sampai matang', 'memasak brokoli agar tidak lembek', 'membumbui tahu agar meresap', 'memanaskan nasi sisa dengan aman', 'membuat adonan pancake tidak bergerindil']
        .map(topic => `Bagaimana cara ${topic}?`),
      check(prompt, answer) {
        assert.ok(['text', 'substitusi', 'fallback'].includes(answer.type), prompt);
        assert.doesNotMatch(answer.text || '', /pertanyaan itu di luar urusan dapur/i, prompt);
      }
    },
    {
      name: 'conversational tone requests',
      bases: ['Jawab', 'Responmu', 'Gaya bicara', 'Bahasanya', 'Aku mau respon yang'].flatMap(prefix =>
        ['asik', 'santai', 'seru', 'ramah'].map(tone => `${prefix} ${tone} dong`)),
      check(prompt, answer) {
        assert.equal(answer.type, 'text', prompt);
        assert.match(answer.text, /Gas, bro|nyambung/i, prompt);
      }
    },
    {
      name: 'accidental exposure and contaminated food',
      bases: ['racun tikus', 'pestisida', 'racun serangga', 'bahan kimia'].flatMap(hazard => [
        `Aku tak sengaja menelan ${hazard}, harus apa?`,
        `Makanan kena ${hazard}, masih aman?`,
        `Sup tercampur ${hazard}, apa masih boleh dimakan?`,
        `Kalau ${hazard} tertelan, tindakan pertama apa?`,
        `Ada ${hazard} di makanan, perlu dibuang?`
      ]),
      check(prompt, answer) {
        assert.equal(answer.type, 'text', prompt);
        assert.match(answer.text, /jangan|pisahkan|buang|IGD|dicicipi/i, prompt);
        assert.doesNotMatch(answer.text, /tidak bisa membantu anda tentang pertanyaan itu/i, prompt);
      }
    },
    {
      name: 'multiple-recipe requests',
      bases: ['wortel dan tahu', 'ayam dan bayam', 'nasi dan telur', 'tempe dan kentang', 'sosis dan sayur', 'ikan dan tomat', 'udang dan jagung', 'tahu dan kangkung', 'ayam dan jamur', 'mi dan telur', 'daging sapi dan kentang', 'nasi dan tempe', 'wortel dan ayam', 'sawi dan tahu', 'kol dan sosis', 'buncis dan telur', 'jagung dan udang', 'bayam dan tempe', 'tahu dan jamur', 'ikan dan kentang']
        .map((items, index) => `Kasih ${index % 2 ? '3' : '2'} ide resep berbeda dari ${items}.`),
      check(prompt, answer) { assert.equal(answer.type, 'fallback', prompt); }
    },
    {
      name: 'correction and latest context',
      bases: ['Bukan keripik kentang, maksudku French fries', 'Maksudku French fries dari kentang', 'Maksudnya kentang goreng, bukan keripik', 'French fries saja, wortelnya nggak usah', 'French fries saja, wortelnya gak jadi', 'Aku jadi pakai kentang untuk French fries, wortel skip', 'Ga jadi pakai wortel, kentang untuk fries', 'Aku nggak jadi pakai wortel; kentang untuk French fries', 'Wortel tidak usah, kentang dibuat fries', 'Yang aku mau French fries, keripik kentang bukan', 'Bukan wortel, pakai kentang buat fries', 'Kentang saja, jangan pakai wortel', 'Wortel tidak usah, aku mau kentang goreng panjang', 'Aku koreksi: yang dimaksud fries, bukan chips', 'Wortelnya tidak usah, kentangnya untuk French fries', 'Tadi salah, bukan keripik tapi French fries', 'Kentang untuk fries ya, wortel tidak jadi', 'Aku maksud kentang goreng gaya restoran', 'Aku mau French fries dari kentang saja, wortel nggak usah', 'Tidak pakai wortel, lanjut kentang untuk fries'],
      contextual: true,
      check(prompt, answer) {
        assert.equal(answer.type, 'text', prompt);
        assert.match(answer.text, /French fries dari kentang/, prompt);
        assert.match(answer.text, /wortelnya kita skip/i, prompt);
        assert.doesNotMatch(answer.text, /keripik kentang sih gampang/i, prompt);
      }
    }
  ];

  assert.equal(families.length, 10);
  for (const family of families) assert.equal(family.bases.length, 20, family.name);
  const cases = families.flatMap(family => family.bases.flatMap(base => wordingVariants(base).map(prompt => ({ ...family, prompt }))));
  assert.equal(cases.length, 2000);
  assert.equal(new Set(cases.map(item => item.prompt)).size, 2000, 'QA prompts must be unique');

  for (let index = 0; index < cases.length; index += 1) {
    const { prompt, name, check, contextual } = cases[index];
    vm.runInContext('currentChatRecipeIdx = null; awaitingSubstitutionIngredient = false; detectedIngredients = []', context);
    const answer = contextual
      ? context.testGenerateContextual(prompt, [
        { role: 'user', content: 'Aku punya wortel sama kentang doang bro.' },
        { role: 'assistant', content: 'Kamu bisa bikin keripik kentang atau wortel goreng.' },
        { role: 'user', content: 'French fries aja, wortelnya tidak usah.' },
        { role: 'assistant', content: 'Keripik kentang sih gampang.' }
      ])
      : context.testGenerate(prompt);
    assert.ok(answer && ['text', 'recipe', 'substitusi', 'fallback'].includes(answer.type), `${name}: ${prompt}`);
    check(prompt, answer);
  }
});
