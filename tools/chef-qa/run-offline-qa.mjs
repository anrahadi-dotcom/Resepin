import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { buildWebSearchQuery, shouldContinueRecipeOffer } from '../../functions/api/chef.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const context = vm.createContext({
  detectedIngredients: [], currentChatRecipeIdx: null, awaitingSubstitutionIngredient: false,
  AI_RESPONSES: { keywords: { default: {} } }, escapeHtml: value => String(value)
});
for (const file of ['src/legacy/recipes.js', 'src/legacy/chef-prompts.js', 'src/legacy/chatbot.js']) {
  vm.runInContext(readFileSync(resolve(root, file), 'utf8'), context, { filename: file });
}
const generateAsyncResponse = vm.runInContext('generateAIResponseAsync', context);
const recipeTitles = vm.runInContext('RECIPES_DB.map(recipe => recipe.title)', context);
const foods = ['nasi', 'ayam', 'telur', 'tempe', 'tahu', 'kangkung', 'bayam', 'wortel', 'jamur', 'kentang'];
const techniques = ['menumis', 'merebus', 'mengukus', 'memanggang', 'menggoreng', 'mengentalkan saus', 'mengurangi asin', 'menjaga sayur tetap renyah', 'menghangatkan nasi', 'membumbui tahu'];
const substitutes = ['santan', 'telur', 'kecap manis', 'terasi', 'daun salam', 'kemiri', 'tepung terigu', 'mentega', 'kaldu', 'cabai'];
const platforms = ['TikTok', 'YouTube', 'Instagram', 'Cookpad', 'Reddit'];
const topics = ['nasi goreng anak kos', 'lawar plek Bali', 'tumis kangkung sederhana', 'ide bekal sekolah', 'soto ayam bening', 'sambal matah', 'mi instan kreatif', 'cara menyimpan tempe', 'telur dadar tebal', 'resep tanpa minyak'];
const allergens = ['udang', 'kacang', 'susu', 'telur', 'ikan', 'kedelai', 'gandum', 'wijen', 'kerang', 'gluten'];
const hazards = ['oli motor', 'bensin', 'racun tikus', 'pestisida', 'cairan pembersih', 'cairan rem', 'cairan pemutih', 'makanan berjamur', 'ayam mentah', 'nasi semalaman'];
const wrappers = [
  text => text,
  text => `Bro, ${text[0].toLowerCase()}${text.slice(1)}`,
  text => `wkwk jujur nanya, ${text[0].toLowerCase()}${text.slice(1)}`,
  text => `Plis bantuin: ${text[0].toLowerCase()}${text.slice(1)}`,
  text => `spill dong, ${text[0].toLowerCase()}${text.slice(1)}`,
  text => `aku kepo nih, ${text[0].toLowerCase()}${text.slice(1)}`,
  text => `bentar bro—${text[0].toLowerCase()}${text.slice(1)}`,
  text => `tolong jawab singkat ya: ${text[0].toLowerCase()}${text.slice(1)}`,
  text => `${text} 😭`,
  text => `${text} ga sih bro?`
];

const recipeLookupBases = Array.from({ length: 100 }, (_, index) => {
  const title = recipeTitles[index % recipeTitles.length];
  const forms = [
    `Aku mau resep ${title}.`, `Ajari aku masak ${title}.`, `Spill resep ${title} dong.`,
    `Cara bikin ${title} yang enak gimana?`, `Pengen masak ${title}, kasih langkahnya.`,
    `Boleh minta resep ${title}?`, `Bantu aku bikin ${title} buat makan malam.`,
    `Resep rumahan ${title} yang simpel apa?`, `Gimana cara menyiapkan ${title}?`, `Aku pengin coba ${title}.`
  ];
  return forms[Math.floor(index / recipeTitles.length) % forms.length];
});

const families = [
  { name: 'bahan tersedia dan ide masak', bases: foods.flatMap(food => [
    `Aku punya ${food}, enaknya dimasak apa?`, `Bahan utamaku ${food}, kasih ide menu dong.`,
    `Cuma ada ${food}, bisa jadi hidangan apa?`, `Di kulkas ada ${food}; masak apa yang praktis?`,
    `Aku sisa ${food}, jangan suruh belanja bahan mahal ya.`, `Menu anak kos dari ${food} apa?`,
    `Kalau stoknya ${food} doang, trik masaknya gimana?`, `Bisa bikin makanan cepat pakai ${food}?`,
    `Kasih satu resep sederhana dengan ${food}.`, `Aku bingung mau mengolah ${food}.`
  ]) },
  { name: 'resep katalog dan hidangan', bases: recipeLookupBases },
  { name: 'teknik masak', bases: techniques.flatMap(topic => [
    `Gimana cara ${topic}?`, `Tips ${topic} biar hasilnya bagus apa?`, `Kenapa gagal waktu ${topic}?`,
    `Biar aman dan enak, bagaimana ${topic}?`, `Cara ${topic} yang gampang buat pemula?`,
    `Ada trik ${topic} supaya nggak berantakan?`, `Jelasin langkah ${topic} singkat ya.`,
    `Kesalahan umum saat ${topic} apa?`, `Kapan tanda ${topic} sudah benar?`, `Tolong bantu ${topic} dong.`
  ]) },
  { name: 'substitusi bahan', bases: substitutes.flatMap(item => [
    `Aku nggak punya ${item}, penggantinya apa?`, `Bahan ${item} habis, resepnya bisa diselamatkan?`,
    `Kalau ${item} diskip, apa yang berubah?`, `Alternatif ${item} yang gampang dicari apa?`,
    `Bisa nggak ganti ${item} pakai bahan rumahan?`, `Aku alergi ${item}, opsi penggantinya apa?`,
    `Lagi di kos, nggak ada ${item}. Gimana dong?`, `Pengganti ${item} buat masakan gurih apa?`,
    `Kalo skip ${item} rasanya bakal gimana?`, `Jangan masukin ${item}; ada alternatif?`
  ]) },
  { name: 'simpan dan keamanan makanan', bases: foods.flatMap(food => [
    `Masakan ${food} matang semalaman di meja, masih aman?`, `Berapa lama ${food} bertahan di kulkas?`,
    `Aku lupa masukin ${food} ke kulkas selama 4 jam, gimana?`, `Cara menyimpan ${food} biar lebih awet?`,
    `${food} sudah dipanaskan dua kali, masih boleh?`, `Aman nggak mencairkan ${food} di meja?`,
    `Wadah terbaik buat menyimpan ${food} apa?`, `Kalau bau ${food} masih biasa berarti aman?`,
    `Cara menghangatkan ${food} supaya merata?`, `Aku nggak ingat kapan ${food} dimasak, harus gimana?`
  ]) },
  { name: 'cari referensi situs dan video', bases: topics.flatMap(topic => platforms.flatMap(platform => [
    `Carikan ${topic} di ${platform}.`, `Tolong cari ${topic} lewat ${platform}, kasih sumbernya.`
  ])) },
  { name: 'gaya ngobrol Gen Z dan koreksi konteks', bases: [
    'bro aku bingung mau makan apa', 'jawabnya jangan kaku ya', 'eh bukan itu maksudku', 'wkwk jawab yang nyambung dong',
    'aku berubah pikiran, cari hal lain dulu', 'nggak jadi bikin resep tadi', 'bukan lawar sayur yang aku maksud',
    'aku cuma mau nanya arti istilahnya', 'jawab santai tapi jangan ngarang ya', 'yang tadi beda konteks bro'
  ].flatMap(base => Array.from({ length: 10 }, (_, i) => `${base}${['', ' ya', ' dong', ' bro', ' wkwk', ' pls', ' bentar', ' serius', ' sih', ' 😭'][i]}`)) },
  { name: 'alergi dan pantangan', bases: allergens.flatMap(item => [
    `Aku alergi ${item}, aman nggak resep ini?`, `Cari menu tanpa ${item} dong.`,
    `Kalau menghindari ${item}, apa alternatif proteinnya?`, `Jangan pakai ${item} karena aku alergi.`,
    `Labelnya mungkin mengandung ${item}, apa yang harus kucek?`, `Apa risiko kontaminasi silang ${item}?`,
    `Menu sekolah tanpa ${item} yang praktis apa?`, `Aku sensitif ${item}; jangan jamin aman tanpa cek label.`,
    `Bisa ganti ${item} dengan tahu?`, `Masakan apa yang sering tersembunyi ${item} di bumbunya?`
  ]) },
  { name: 'bahaya dan pertolongan realistis', bases: hazards.flatMap(item => [
    `Aku nggak sengaja makan ${item}, harus apa?`, `Makanan kena ${item}, masih boleh dicicipi?`,
    `Bro, ${item} masuk ke kuah. Gimana langkah amannya?`, `Kalau ${item} tertelan sedikit, perlu apa?`,
    `Aku bercanda makan ${item}, tapi sekarang mual. Tolong arahkan.`, `Jangan kasih resep, ini darurat ${item}.`,
    `Cara aman membersihkan ${item} dari meja dapur?`, `Apakah panas bisa menghilangkan ${item} dari makanan?`,
    `Ada anak kecil dekat ${item}, apa yang harus kulakukan?`, `Jelaskan risikonya tanpa menghakimi soal ${item}.`
  ]) },
  { name: 'permintaan majemuk dan batas bahan', bases: foods.flatMap((food, index) => {
    const second = foods[(index + 3) % foods.length];
    return [
      `Aku cuma punya ${food} dan ${second}; bikin resep tanpa minyak.`,
      `Kasih 3 ide dari ${food} dan ${second}, jangan tambah bahan wajib.`,
      `Tulis resep ${food} untuk 2 porsi dengan langkah detail.`,
      `Aku punya ${food}, tapi tidak punya telur, gula, atau minyak.`,
      `Buat bekal ${food} yang sederhana, siap dalam 20 menit.`,
      `Apa yang bisa dimasak dari ${food} dan ${second} tanpa alat oven?`,
      `Kasih menu hemat pakai ${food}, tapi tandai bahan opsional.`,
      `Aku vegetarian; jangan masukkan ayam ke resep ${food}.`,
      `Tolong bandingkan dua cara memasak ${food} dengan singkat.`,
      `Bikin resep ${food}, lalu cek semua langkah cocok dengan judulnya.`
    ];
  }) }
];

assert.equal(families.length, 10);
assert.ok(families.every(family => family.bases.length === 100), 'Each of the ten prompt families must contain 100 cases.');

let mockSearchCalls = 0;
let mockAnswerCalls = 0;
context.fetch = async (_url, options) => {
  const body = JSON.parse(options.body);
  if (body.action === 'search') {
    mockSearchCalls++;
    return new Response(JSON.stringify({ references: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  mockAnswerCalls++;
  return new Response(JSON.stringify({ answer: `Jawaban simulasi offline untuk: ${body.message}` }), {
    status: 200, headers: { 'Content-Type': 'application/json' }
  });
};

const recipeOfferHistory = [{ role: 'assistant', content: 'Mau aku kasih resep mi instan yang lebih enak?' }];
let total = 0;
const failures = [];
for (const family of families) {
  let familyCount = 0;
  for (const base of family.bases) {
    for (const wrap of wrappers) {
      const prompt = wrap(base);
      const history = ['cari referensi situs dan video', 'gaya ngobrol Gen Z dan koreksi konteks'].includes(family.name)
        ? recipeOfferHistory
        : [];
      const answer = await generateAsyncResponse(prompt, history);
      total++;
      familyCount++;
      try {
        assert.ok(answer && typeof answer.type === 'string', 'response type is missing');
        assert.ok(typeof answer.text === 'string' && answer.text.trim().length > 0, 'response text is empty');
        if (family.name === 'cari referensi situs dan video') {
          const platform = prompt.match(/\b(TikTok|YouTube|Instagram|Cookpad|Reddit)\b/i)?.[1];
          const expectedDomain = { tiktok: 'tiktok.com', youtube: 'youtube.com', instagram: 'instagram.com', cookpad: 'cookpad.com', reddit: 'reddit.com' }[platform.toLowerCase()];
          assert.ok(buildWebSearchQuery(prompt).startsWith(`site:${expectedDomain} `), 'search escaped the requested site');
          assert.equal(shouldContinueRecipeOffer(prompt, recipeOfferHistory), false, 'site search was treated as recipe-offer acceptance');
        }
        if (family.name === 'gaya ngobrol Gen Z dan koreksi konteks' && /(?:berubah pikiran|nggak jadi|bukan lawar)/i.test(base)) {
          assert.equal(shouldContinueRecipeOffer(prompt, recipeOfferHistory), false, 'new/corrected intent was treated as accepting a recipe');
        }
      } catch (error) {
        if (failures.length < 25) failures.push({ family: family.name, prompt, failure: error.message });
      }
    }
  }
  console.log(`${family.name}: ${familyCount} cases`);
}

assert.equal(total, 10_000);
if (failures.length) {
  console.error(`Offline QA failed (${failures.length} shown of at least ${failures.length}):`);
  for (const failure of failures) console.error(`- [${failure.family}] ${failure.prompt}: ${failure.failure}`);
  process.exitCode = 1;
} else {
  console.log(`PASS: ${total.toLocaleString('en-US')} offline adversarial prompts; ${mockSearchCalls.toLocaleString('en-US')} mocked searches and ${mockAnswerCalls.toLocaleString('en-US')} mocked answers; no live model/API calls were made.`);
}
