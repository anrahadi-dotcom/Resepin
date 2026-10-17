import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadChef() {
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
  return context;
}

const variants = (items, templates) => items.flatMap((item, index) =>
  templates.map(template => template(item, index)));

test('1000 offline QA prompts cover ten user-facing Chef Resepin scenarios', () => {
  const context = loadChef();
  const questionFamilies = [];
  const generalQuestions = [
    'Siapa presiden pertama Amerika Serikat?', 'Apa ibu kota Jepang?', 'Kapan Perang Dunia II berakhir?',
    'Siapa penemu telepon?', 'Apa planet terbesar di tata surya?', 'Berapa jarak Bumi ke Bulan?',
    'Kenapa langit terlihat biru?', 'Apa mata uang Korea Selatan?', 'Di mana Menara Eiffel berada?',
    'Siapa penulis Laskar Pelangi?', 'Apa arti fotosintesis?', 'Bagaimana panel surya menghasilkan listrik?',
    'Siapa presiden pertama Indonesia?', 'Berapa jumlah planet di tata surya?', 'Apa bahasa resmi Brasil?',
    'Kapan Indonesia memproklamasikan kemerdekaan?', 'Apa fungsi jantung manusia?', 'Siapa pelukis Mona Lisa?',
    'Apa perbedaan cuaca dan iklim?', 'Kenapa kapal bisa mengapung?'
  ];
  const lowerFirst = text => text[0].toLowerCase() + text.slice(1);
  questionFamilies.push({
    name: 'general knowledge',
    prompts: variants(generalQuestions, [
      question => question,
      question => 'Bro, ' + lowerFirst(question),
      question => 'Boleh tanya, ' + lowerFirst(question),
      question => 'Aku penasaran: ' + lowerFirst(question),
      question => 'Jawab singkat ya, ' + lowerFirst(question)
    ]),
    check(prompt, answer) {
      assert.ok(['fallback', 'text'].includes(answer.type), prompt + ' returned ' + answer.type);
      assert.doesNotMatch(answer.text || '', /hanya bisa membantu soal masakan/i, prompt);
    }
  });

  const recipeTitles = vm.runInContext('RECIPES_DB.map(recipe => recipe.title)', context);
  assert.equal(recipeTitles.length, 40);
  questionFamilies.push({
    name: 'catalog recipes',
    prompts: [
      ...recipeTitles.map(title => 'Aku mau resep ' + title),
      ...recipeTitles.map(title => 'Bro, ajarin masak ' + title + ' dong'),
      ...recipeTitles.slice(0, 20).map(title => 'Bantu aku bikin ' + title + ' ya')
    ],
    check(prompt, answer) { assert.equal(answer.type, 'recipe', prompt); }
  });

  const pantryIngredients = [
    'wortel', 'kentang', 'ayam', 'tahu', 'tempe', 'telur', 'kangkung', 'bayam', 'ikan', 'udang',
    'nasi', 'jagung', 'kol', 'tomat', 'sosis', 'jamur', 'buncis', 'mi', 'daging sapi', 'kacang panjang'
  ];
  questionFamilies.push({
    name: 'recipes from one available ingredient',
    prompts: variants(pantryIngredients, [
      item => 'Aku punya ' + item + ', enaknya dimasak apa?',
      item => 'Kasih satu ide masak dari ' + item + ' dong.',
      item => 'Aku ada ' + item + '; cocok dibuat apa?',
      item => 'Tolong pilih resep sederhana yang pakai ' + item + '.',
      item => 'Kalau bahan utamaku ' + item + ', masak apa ya?'
    ]),
    check(prompt, answer) {
      assert.ok(['recipe', 'fallback', 'text'].includes(answer.type), prompt + ' returned ' + answer.type);
      if (answer.type === 'recipe' && answer.recipe) {
        const recipe = vm.runInContext('RECIPES_DB[' + answer.recipe.idx + ']', context);
        const ingredient = pantryIngredients.find(item => prompt.toLowerCase().includes(item));
        assert.ok(recipe.ingredients.some(value => value.toLowerCase().includes(ingredient)), prompt + ' returned unrelated ' + recipe.title);
      }
    }
  });

  const substituteIngredients = [
    'santan', 'kecap manis', 'terasi', 'daun salam', 'kemiri', 'selada', 'ayam', 'telur',
    'roti burger', 'patty', 'tomat', 'keju', 'cabai', 'susu', 'bawang', 'tepung terigu',
    'maizena', 'mentega', 'tepung panir', 'kaldu'
  ];
  questionFamilies.push({
    name: 'ingredient substitutions',
    prompts: variants(substituteIngredients, [
      item => 'Aku nggak punya ' + item + ', penggantinya apa?',
      item => 'Bahan ' + item + ' habis, bisa diganti apa?',
      item => 'Kalau ' + item + ' kosong, pakai apa?',
      item => 'Ada pengganti ' + item + ' buat masak?',
      item => 'Bro, ' + item + ' nggak ada, solusinya?'
    ]),
    check(prompt, answer) {
      assert.ok(['substitusi', 'text', 'fallback'].includes(answer.type), prompt + ' returned ' + answer.type);
      assert.doesNotMatch(answer.text || '', /maaf.{0,25}tidak bisa membantu/i, prompt);
    }
  });

  const storedFoods = [
    'nasi', 'ayam', 'tahu', 'sayur', 'ikan', 'tempe', 'sup', 'telur', 'pasta', 'mi',
    'udang', 'daging sapi', 'sambal', 'kentang', 'tumis', 'soto', 'nasi goreng', 'wortel', 'bayam', 'lauk'
  ];
  questionFamilies.push({
    name: 'food storage and safety',
    prompts: variants(storedFoods, [
      food => 'Apakah masakan ' + food + ' matang yang semalaman di meja masih aman dimakan?',
      food => 'Bro, masakan ' + food + ' dari tadi malam tertinggal di meja, aman nggak?',
      food => 'Masakan ' + food + ' matang tidak masuk kulkas semalaman, sebaiknya diapakan?',
      food => 'Aku lupa menaruh masakan ' + food + ' ke kulkas semalaman, masih boleh makan?',
      food => 'Masakan ' + food + ' semalaman pada suhu ruang aman dikonsumsi?'
    ]),
    check(prompt, answer) {
      assert.equal(answer.type, 'text', prompt + ' returned ' + answer.type);
      assert.match(answer.text, /sebaiknya dibuang|terlalu lama|batas umum|jangan dicicipi/i, prompt);
    }
  });

  const techniques = [
    'merebus wortel sampai empuk', 'membuat telur dadar tidak mudah robek', 'mengurangi rasa asin pada masakan',
    'membuat kuah soto bening', 'menumis kangkung supaya tetap hijau', 'membuat tempe orek renyah',
    'menggoreng ikan sampai matang', 'menjaga nasi goreng agar tidak lembek', 'merebus telur setengah matang',
    'menyimpan sayur daun supaya awet', 'mengentalkan saus tanpa menggumpal', 'mencairkan ayam beku dengan aman',
    'membuat kentang goreng renyah', 'memotong bawang tanpa pedih', 'membuat sup tidak terlalu berminyak',
    'mengukus jagung sampai matang', 'memasak brokoli agar tidak lembek', 'membumbui tahu agar meresap',
    'memanaskan nasi sisa dengan aman', 'membuat adonan pancake tidak bergerindil'
  ];
  questionFamilies.push({
    name: 'cooking techniques',
    prompts: variants(techniques, [
      topic => 'Bagaimana cara ' + topic + '?',
      topic => 'Bro, gimana cara ' + topic + '?',
      topic => 'Kasih tips buat ' + topic + ' dong.',
      topic => 'Ada trik biar bisa ' + topic + '?',
      topic => 'Tolong jelasin singkat cara ' + topic + '.'
    ]),
    check(prompt, answer) {
      assert.ok(['text', 'substitusi', 'fallback'].includes(answer.type), prompt + ' returned ' + answer.type);
      assert.doesNotMatch(answer.text || '', /pertanyaan itu di luar urusan dapur/i, prompt);
    }
  });

  const greetings = ['hai', 'halo', 'hello', 'hi', 'hei'].flatMap(word =>
    ['', ' bro', ' Chef', ' kak'].map(address => word + address));
  const gratitude = ['Terima kasih', 'Makasih', 'Thanks', 'Thank you'].flatMap(phrase =>
    [' ya', ' bro', ' Chef', ' banyak', ' banget'].map(end => phrase + end));
  const styleRequests = ['Jawab', 'Responmu', 'Gaya bicara', 'Bahasanya', 'Aku mau respon yang'].flatMap(prefix =>
    ['asik', 'santai', 'seru', 'ramah'].map(tone => prefix + ' ' + tone + ' dong'));
  const helpQuestions = ['Kamu bisa apa', 'Kamu bisa bantu apa', 'Apa yang bisa kamu bantu', 'Bisa bantu apa', 'Menu apa saja'].flatMap(question =>
    ['', ' bro', ' Chef', ' dong'].map(end => question + end + '?'));
  const acknowledgements = ['oke', 'siap', 'gas', 'sip', 'lanjut'].flatMap(word =>
    ['', ' bro', ' ya', ' dong'].map(end => word + end));
  questionFamilies.push({
    name: 'greetings, tone, gratitude, and help',
    prompts: [...greetings, ...gratitude, ...styleRequests, ...helpQuestions, ...acknowledgements],
    check(prompt, answer) {
      assert.ok(['text', 'fallback'].includes(answer.type), prompt + ' returned ' + answer.type);
    }
  });

  const hazards = ['racun tikus', 'pestisida', 'racun serangga', 'bahan kimia'];
  const hazardForms = [
    hazard => 'Aku tak sengaja menelan ' + hazard + ', harus apa?',
    hazard => 'Makanan kena ' + hazard + ', masih aman?',
    hazard => 'Sup tercampur ' + hazard + ', apa masih boleh dimakan?',
    hazard => 'Kalau ' + hazard + ' tertelan, tindakan pertama apa?',
    hazard => 'Ada ' + hazard + ' di makanan, perlu dibuang?'
  ];
  const hazardPrompts = hazards.flatMap(hazard => hazardForms.flatMap(form => {
    const base = form(hazard);
    return ['', ' Tolong.', ' Bro.', ' Aku serius.', ' Sekarang harus gimana?'].map(ending => base + ending);
  }));
  questionFamilies.push({
    name: 'contamination and accidental exposure',
    prompts: hazardPrompts,
    check(prompt, answer) {
      assert.equal(answer.type, 'text', prompt + ' returned ' + answer.type);
      assert.match(answer.text, /jangan|pisahkan|buang|IGD|layanan darurat|dicicipi/i, prompt);
      assert.doesNotMatch(answer.text, /tidak bisa membantu/i, prompt);
    }
  });

  const pantryPairs = [
    ['wortel', 'tahu'], ['kentang', 'telur'], ['ayam', 'kol'], ['tempe', 'bayam'], ['ikan', 'tomat'],
    ['jagung', 'susu'], ['udang', 'buncis'], ['nasi', 'telur'], ['mi', 'sawi'], ['daging sapi', 'kentang'],
    ['jamur', 'tahu'], ['sosis', 'telur'], ['kangkung', 'tempe'], ['ayam', 'wortel'], ['kentang', 'keju'],
    ['kacang panjang', 'tempe'], ['nasi', 'ayam'], ['bayam', 'jagung'], ['ikan', 'kentang'], ['tahu', 'tomat']
  ];
  questionFamilies.push({
    name: 'multiple-recipe counts and ingredient constraints',
    prompts: variants(pantryPairs, [
      ([a, b]) => 'Buatkan 2 resep berbeda dari ' + a + ' dan ' + b + '.',
      ([a, b]) => 'Kasih 3 ide menu yang beda pakai ' + a + ' dan ' + b + '.',
      ([a, b]) => 'Aku punya ' + a + ' dan ' + b + '; tulis 2 pilihan masakan.',
      ([a, b]) => 'Tolong bikin 3 resep sederhana dengan ' + a + ' dan ' + b + '.',
      ([a, b]) => 'Ada ' + a + ' serta ' + b + ', kasih 2 ide resep yang berbeda dong.'
    ]),
    check(prompt, answer) {
      assert.equal(answer.type, 'fallback', prompt + ' should be routed to the model for the requested list');
    }
  });

  const correctionBases = [
    'Bukan keripik kentang, maksudku French fries',
    'Maksudku French fries dari kentang',
    'Maksudnya kentang goreng, bukan keripik',
    'French fries saja, wortelnya nggak usah',
    'French fries saja, wortelnya gak jadi',
    'Aku jadi pakai kentang untuk French fries, wortel skip',
    'Ga jadi pakai wortel, kentang untuk fries',
    'Aku nggak jadi pakai wortel; kentang untuk French fries',
    'Wortel tidak usah, kentang dibuat fries',
    'Yang aku mau French fries, keripik kentang bukan'
  ];
  const correctionTones = ['', ' ya', ' dong', ' bro', ' deh', ' aja', ' ya bro', ' dong bro', ' deh bro', ' ya dong'];
  const correctionPrompts = correctionBases.flatMap(base => correctionTones.map(tone => base + tone));
  const friesHistory = [
    { role: 'user', content: 'Aku punya wortel sama kentang doang bro.' },
    { role: 'assistant', content: 'Kamu bisa bikin keripik kentang atau wortel goreng.' },
    { role: 'user', content: 'French fries aja, wortelnya tidak usah.' },
    { role: 'assistant', content: 'Keripik kentang sih gampang.' }
  ];
  questionFamilies.push({
    name: 'the recorded French-fries correction and chat context',
    prompts: correctionPrompts,
    contextual: true,
    check(prompt, answer) {
      assert.equal(answer.type, 'text', prompt);
      assert.match(answer.text, /French fries dari kentang/, prompt);
      assert.match(answer.text, /wortelnya kita skip/i, prompt);
      assert.doesNotMatch(answer.text, /Wortel bisa diganti dengan kentang|wortel goreng|keripik kentang sih gampang/i, prompt);
    }
  });

  assert.equal(questionFamilies.length, 10);
  for (const family of questionFamilies) assert.equal(family.prompts.length, 100, family.name);
  assert.equal(questionFamilies.reduce((sum, family) => sum + family.prompts.length, 0), 1000);

  let count = 0;
  for (const family of questionFamilies) {
    for (const prompt of family.prompts) {
      vm.runInContext('currentChatRecipeIdx = null; awaitingSubstitutionIngredient = false; detectedIngredients = []', context);
      const answer = family.contextual
        ? context.testGenerateContextual(prompt, friesHistory)
        : context.testGenerate(prompt);
      assert.ok(answer && ['text', 'recipe', 'substitusi', 'fallback'].includes(answer.type), family.name + ': ' + prompt);
      family.check(prompt, answer);
      count += 1;
    }
  }
  assert.equal(count, 1000);
});
