/* Chef Resepin chat flow, response logic, and chat rendering. */

// ============================================================
// CHEF AI CHAT
// ============================================================
function updateChefBahanBadge() {
  const badge = document.getElementById('chefBahanText');
  if (!badge) return;
  document.querySelector('#page-chef .chat-container')?.classList.toggle('chef-no-ingredients', detectedIngredients.length === 0);
  if (detectedIngredients.length === 0) {
    badge.textContent = 'Belum ada bahan';
  } else {
    badge.textContent = `${detectedIngredients.length} bahan aktif`;
  }
}

function sendQuickPrompt(text) {
  const input = document.getElementById('chatInput');
  input.value = text;
  sendChat();
}

function sendChat() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  if (!message) return;

  const history = [...document.querySelectorAll('#chatMessages .chat-bubble')].slice(-6).map(bubble => ({
    role: bubble.classList.contains('user-bubble') ? 'user' : 'assistant',
    content: bubble.querySelector('.bubble-content')?.innerText?.trim() || ''
  })).filter(item => item.content);

  input.value = '';
  input.style.height = 'auto';

  appendChatMessage(message, 'user');
  hideQuickPrompts();

  // Show typing indicator
  const typingId = 'typing-' + Date.now();
  appendTypingIndicator(typingId);

  // Simulate AI response delay
  const delay = 1200 + Math.random() * 800;
  setTimeout(() => {
    generateAIResponseAsync(message, history).then(response => {
      removeTypingIndicator(typingId);
      appendAIResponse(response);
    });
  }, delay);
}

async function generateAIResponseAsync(message, history = []) {
  const localResponse = generateAIResponse(message);
  if (localResponse.type !== 'fallback') return localResponse;

  try {
    const response = await fetch('/api/chef', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history })
    });
    if (!response.ok) throw new Error(`Chef API returned ${response.status}`);
    const data = await response.json();
    if (typeof data.answer !== 'string' || !data.answer.trim()) throw new Error('Chef API returned no answer');
    return { type: 'text', text: data.answer.trim() };
  } catch (error) {
    console.warn('Chef AI fallback unavailable; using local response.', error);
    return { type: 'text', text: CHEF_PROMPTS.fallback(message) };
  }
}

function generateAIResponse(message) {
  const lowerMsg = message.toLowerCase();
  const normalized = lowerMsg.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const textHasPhrase = (text, phrase) => {
    const textWords = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').match(/\p{L}+/gu) || [];
    const phraseWords = phrase.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').match(/\p{L}+/gu) || [];
    return phraseWords.length > 0 && textWords.some((_, index) =>
      phraseWords.every((word, offset) => textWords[index + offset] === word));
  };
  const substitutionAdvice = {
    santan: 'coba susu cair atau santan bubuk yang dilarutkan. Untuk masakan gurih, susu oat tanpa gula juga bisa dipakai.',
    kecap: 'campurkan sedikit garam dengan gula merah dan air. Rasanya tidak persis sama, jadi tambahkan sedikit demi sedikit.',
    terasi: 'lewati saja atau tambahkan sedikit ikan asin/udang kering yang dihaluskan jika tersedia.',
    'daun salam': 'gunakan daun jeruk atau sedikit thyme untuk aroma; kalau tidak ada, bumbunya tetap bisa dimasak tanpa daun salam.',
    kemiri: 'gunakan sedikit kacang tanah sangrai atau skip saja. Tekstur bumbu akan sedikit berbeda.',
    selada: 'pakai kol iris tipis, timun, atau sawi muda. Untuk isian burger, keringkan sayuran dulu supaya rotinya tidak lembek.',
    ayam: 'gunakan tempe, tahu, jamur tiram, atau ikan sesuai jenis masakannya. Atur kembali waktu masak sampai bahan pengganti matang.',
    telur: 'untuk adonan, coba 1 sdm maizena + 2 sdm air per telur. Untuk lauk, tahu hancur bisa jadi pengganti yang lebih mengenyangkan.',
    'roti burger': 'pakai roti tawar panggang, English muffin, atau nasi sebagai lauk patty.',
    patty: 'gunakan ayam cincang, daging cincang, tempe, atau jamur yang dibentuk pipih.',
    tomat: 'gunakan paprika panggang atau sedikit saus tomat. Jika hanya butuh kesegaran, tambahkan timun.',
    keju: 'boleh dilewati, atau gunakan sedikit susu/saus putih untuk memberi rasa gurih.',
    cabai: 'gunakan lada hitam atau paprika bubuk untuk rasa hangat tanpa pedas yang kuat.',
    susu: 'gunakan susu kedelai tanpa gula atau air/kaldu, tergantung resepnya.',
    bawang: 'gunakan bawang putih atau bawang merah yang tersedia; bila keduanya habis, bubuk bawang bisa dipakai sedikit saja.',
    'tepung terigu': 'untuk pengental, coba maizena atau tapioka yang dilarutkan dulu dengan air. Untuk adonan kue, hasilnya bisa berbeda jadi perlu resep khusus.',
    maizena: 'gunakan tapioka atau tepung terigu untuk mengentalkan, lalu tambahkan sedikit demi sedikit karena daya kentalnya berbeda.',
    mentega: 'untuk tumisan, margarin atau sedikit minyak bisa dipakai. Untuk pastry dan kue, tekstur serta rasanya dapat berubah.',
    'tepung panir': 'gunakan remah roti kering, biskuit tawar yang dihancurkan, atau cornflakes tanpa rasa yang diremukkan.',
    kaldu: 'gunakan air dengan bumbu yang tersedia, seperti bawang, lada, dan sedikit garam. Tambahkan bertahap lalu cicipi.',
    'daging sapi': 'untuk isian gurih, coba tempe, jamur, atau tahu padat. Potongan dan waktu masaknya perlu disesuaikan.',
    serai: 'untuk aroma segar, bisa dilewati atau diganti sedikit kulit jeruk purut/daun jeruk. Aromanya berbeda, jadi pakai sedikit dulu.',
    'baking powder': 'untuk 1 sdt baking powder, campurkan 1/4 sdt baking soda dan 1/2 sdt cream of tartar jika ada. Alternatifnya tergantung resep dan bahan asam di adonan; hasil kue bisa berubah.',
    'baking soda': 'kalau resep memang memakai baking soda, biasanya perlu bahan asam seperti yogurt atau air lemon untuk mengaktifkannya. Baking powder tidak selalu bisa ditukar 1:1; kirim resep dan takarannya dulu.',
    'ragi': 'untuk roti mengembang, ragi tidak punya pengganti langsung yang setara. Baking powder cocok untuk adonan cepat, tapi hasilnya berbeda—sebutkan resepnya supaya aku bisa sarankan pilihan.',
    'kecap manis': 'campurkan kecap asin dengan gula merah atau gula pasir secukupnya; rasanya tidak persis sama, jadi tambahkan sedikit demi sedikit.',
    'minyak goreng': 'untuk menumis bisa memakai margarin atau sedikit mentega. Untuk menggoreng rendam, pengganti bergantung pada titik asap dan jumlah minyak yang diperlukan.'
  };
  const substitutionFor = ingredient => {
    const known = Object.keys(substitutionAdvice).find(name => textHasPhrase(ingredient, name));
    if (known) return substitutionAdvice[known];
    if (/sayur|bayam|kangkung|brokoli|sawi|kol|wortel|selada/.test(ingredient)) return 'ganti dengan sayuran lain yang tekstur dan waktu masaknya mirip, seperti kol, sawi, atau wortel. Masukkan sayuran keras lebih dulu.';
    return 'sebutkan jenis masakannya supaya aku bisa pilih pengganti yang rasanya dan fungsinya paling mendekati. Kalau bahan ini hanya pelengkap, biasanya bisa dilewati.';
  };
  const asksForRecipe = /\b(resep|masak|masakan|makanan|menu|ide|buat apa|bikin apa|mau masak|mau bikin)\b/.test(normalized) ||
    RECIPES_DB.some(recipe => textHasPhrase(normalized, recipe.title)) ||
    /\b(ayam\s+betutu|ayam\s+sere\s+lemo|ayam\s+sisit\s+sere\s+lemo|ayam\s+bakar\s+(?:khas\s+)?bali|coto|babi\s+guling|lawar|fried\s+chicken|pizza|burger|spaghetti|ramen|sushi|taco|pancake|teriyaki|sate\s+lilit)\b/.test(normalized);
  const explicitRecipeRequest = asksForRecipe;

  // Handle conversation before looking for ingredients, so a greeting never
  // falls through to an unrelated recipe or generic zero-waste tip.
  if (/^(hai|halo|hello|hi|hei|pagi|siang|sore|malam)(?:\s+(?:chef|bro|kak|bang|sis|guys))?[!?.\s]*$/i.test(normalized.trim())) {
    return { type: 'text', text: CHEF_PROMPTS.greeting };
  }
  if (/\b(terima kasih|makasih|thanks|thank you)\b/.test(normalized)) {
    return { type: 'text', text: CHEF_PROMPTS.thanks };
  }
  if (/\b(kamu siapa|siapa kamu|bisa apa|bant[u]? apa|help|tolong|apa yang bisa kamu bantu|bisa bantu apa|tanya apa|menu apa saja)\b/.test(normalized)) {
    return { type: 'text', text: CHEF_PROMPTS.help };
  }

  if (/\b(belum punya bahan|belum ada bahan|tidak punya bahan|tidak ada bahan|ga punya bahan|gak punya bahan|nggak punya bahan|gak ada bahan|nggak ada bahan|kehabisan bahan)\b/.test(normalized)) {
    return { type: 'text', text: CHEF_PROMPTS.noIngredients };
  }

  const asksStorage = /\b(simpan|menyimpan|disimpan|penyimpanan|tahan lama|awet|basi|panaskan ulang|dipanasin|dipanaskan|panasin|hangatkan|dihangatkan|kedaluwarsa|kadaluwarsa|aman dimakan|masih aman|aman dikonsumsi|layak dimakan|berapa lama|masih bagus|dicairkan|thawing|defrost|semalaman|semalam|suhu ruang|di meja|dibiarkan|tertinggal)\b/.test(normalized) ||
    (/\b(kulkas|lemari es|freezer|beku)\b/.test(normalized) && /\b(gimana|bagaimana|aman|simpan|tahan|berapa lama|berapa hari|cara)\b/.test(normalized));
  if (asksStorage) {
    if (/\b(semalaman|semalam|di meja|suhu ruang|dibiarkan|tertinggal)\b/.test(normalized) &&
      !/\b(cairkan|mencairkan|dicairkan|thawing|defrost)\b/.test(normalized) &&
      /\b(ayam|daging|ikan|udang|nasi|tahu|makanan|masakan|sisa)\b/.test(normalized)) {
      return { type: 'text', text: 'Makanan matang atau bahan mudah rusak yang dibiarkan di suhu ruang semalaman sebaiknya dibuang. Batas umum makanan mudah rusak adalah 2 jam di suhu ruang (1 jam jika suhu di atas 32°C); memanaskan ulang tidak selalu menghilangkan risiko. Jangan dicicipi untuk mengetes.' };
    }
    if (/\b(cairkan|mencairkan|dicairkan|thawing|defrost)\b/.test(normalized)) {
      return { type: 'text', text: 'Jangan cairkan bahan mudah rusak di meja dapur. Pilihan yang lebih aman: cairkan di kulkas; atau dalam kantong tertutup di air dingin (ganti air berkala) dan langsung masak; microwave juga boleh kalau langsung dimasak setelahnya. Kalau sudah berada di suhu ruang lebih dari 2 jam, lebih aman dibuang. Panduan umum: USDA FSIS.' };
    }
    if (/\b(panasin|dipanasin|dipanaskan|panaskan ulang|hangatkan|dihangatkan)\b/.test(normalized)) {
      return { type: 'text', text: 'Panaskan sisa makanan sampai benar-benar panas merata; untuk acuan keamanan USDA, suhu tengahnya 74°C/165°F. Aduk makanan yang dipanaskan di microwave lalu cek beberapa bagian. Panaskan hanya porsi yang akan dimakan dan jangan memanaskan berulang kali. Kalau sisa makanan sudah terlalu lama di suhu ruang atau kamu tidak yakin cara simpannya, jangan dicicipi untuk mengetes—lebih aman dibuang.' };
    }
    const asksAboutLeftovers = /\b(sisa|nasi matang|makanan matang|masakan matang|sudah dimasak|makanan jadi|leftover)\b/.test(normalized);
    if (/\b(nasi|rice)\b/.test(normalized) && !/\b(beras|nasi mentah)\b/.test(normalized) && /\b(berapa lama|berapa hari|tahan|simpan|awet)\b/.test(normalized)) {
      return { type: 'text', text: 'Untuk nasi yang sudah matang, masukkan ke kulkas segera setelah uap panas berkurang dan habiskan dalam 3–4 hari; bagi ke wadah dangkal agar cepat dingin. Jika dibiarkan di suhu ruang semalaman, buang. Panduan umum penyimpanan sisa makanan: USDA FSIS.' };
    }
    const asksAboutRawProtein = /\b(ayam|daging|ikan|udang|seafood|telur)\b/.test(normalized);
    if (asksAboutLeftovers) {
      const ageDays = Number(normalized.match(/\b(\d+)\s+hari\b/)?.[1] || 0);
      if (ageDays > 4) {
        return { type: 'text', text: 'Lima hari sudah melewati panduan umum 3–4 hari untuk sisa makanan matang di kulkas. Lebih aman dibuang, terutama kalau suhu kulkas atau waktu penyimpanannya tidak pasti. Jangan dicicipi untuk mengetes. Panduan umum: USDA FSIS.' };
      }
      return {
        type: 'text',
        text: 'Untuk sisa makanan matang yang mudah rusak, masukkan ke kulkas dalam 2 jam (1 jam kalau suhu sekitar di atas 32°C). Bagi ke wadah dangkal supaya cepat dingin; umumnya habiskan dalam 3–4 hari atau bekukan. Kalau sudah terlalu lama di suhu ruang, lebih aman dibuang. Kalau kamu sebutkan jenis makanannya dan cara menyimpannya, aku bisa bantu arahkan lebih spesifik. Panduan umum: USDA FSIS.'
      };
    }
    if (asksAboutRawProtein) {
      if (/\b(ayam|unggas)\b/.test(normalized) && /\b(berapa lama|tahan|hari)\b/.test(normalized)) {
        return { type: 'text', text: 'Ayam mentah umumnya disimpan di kulkas pada suhu 4°C atau lebih rendah dan dimasak dalam 1–2 hari; kalau belum akan dipakai, bekukan. Simpan tertutup di rak bawah agar cairannya tidak menetes ke makanan siap santap. Panduan umum: USDA FSIS.' };
      }
      return {
        type: 'text',
        text: 'Untuk bahan mentah seperti ayam, daging, ikan, atau telur, simpan tertutup di kulkas atau bekukan jika belum akan dipakai, dan pisahkan dari makanan siap santap. Lama simpannya bergantung pada jenis bahan, suhu, dan kondisi kemasan. Bahan apa yang kamu simpan, masih mentah atau sudah dimasak?'
      };
    }
    return {
      type: 'text',
      text: 'Cara simpan tiap bahan bisa beda. Sebutkan bahannya (misalnya sayur daun, tahu, nasi, atau bumbu) dan mau disimpan di suhu ruang, kulkas, atau freezer—nanti aku bantu pilih cara yang cocok.'
    };
  }

  if (/\b(menu mingguan|rencana menu|meal prep|meal plan|daftar belanja|belanja mingguan|menu\s+(?:untuk\s+)?\d+\s+hari|menu\s+\d+\s+hari)\b/.test(normalized)) {
    const requestedDays = Number(normalized.match(/\b(\d+)\s+hari\b/)?.[1] || 3);
    const days = Math.max(1, Math.min(requestedDays, 7));
    const excludeAnimalIngredients = /\b(vegetarian|tanpa daging|vegan|nabati|plant based)\b/.test(normalized);
    const excludeDairy = /\b(tanpa susu|bebas susu|vegan|nabati|plant based)\b/.test(normalized);
    const excludeCoconut = /\btanpa santan\b/.test(normalized);
    const quickMeals = RECIPES_DB.filter(recipe => parseInt(recipe.time, 10) <= 30 &&
      (!excludeAnimalIngredients || !recipe.ingredients.some(ingredient => /ayam|daging|ikan|udang|terasi|ebi|belacan|teri|kaldu ayam/i.test(ingredient))) &&
      (!excludeDairy || !recipe.ingredients.some(ingredient => /susu|keju|mentega|krim|telur/i.test(ingredient))) &&
      (!excludeCoconut || !recipe.ingredients.some(ingredient => /santan|kelapa/i.test(ingredient))) &&
      !recipe.tags.includes('Pedas'));
    const plan = Array.from({ length: days }, (_, index) => {
      const recipe = quickMeals[index % Math.max(1, quickMeals.length)];
      return `Hari ${index + 1}: ${recipe?.title || 'pilih resep cepat dari katalog'}`;
    }).join('\n');
    return { type: 'text', text: `Contoh menu ${days} hari dari katalog (waktu singkat):\n${plan}\n\nIni ide, bukan hitungan biaya atau gizi. Sebutkan bahan yang sudah ada, pantangan, dan budget per hari kalau mau aku sesuaikan.` };
  }

  if (/\b(alergi|alergik|intoleransi|tidak cocok|reaksi makanan)\b/.test(normalized)) {
    const allergen = Object.keys(AI_RESPONSES.keywords).find(item => item !== 'default' && textHasPhrase(normalized, item)) ||
      normalized.match(/(?:alergi|alergik|intoleransi)\s+(?:terhadap\s+)?([\p{L}-]+)/u)?.[1];
    return {
      type: 'text',
      text: `Aku bisa bantu menandai resep katalog yang mencantumkan ${allergen || 'bahan pemicu'}, tetapi aku tidak bisa menjamin makanan bebas alergennya karena label produk dan kontaminasi silang perlu dicek langsung. Untuk reaksi berat, jangan coba-coba bahan yang meragukan dan ikuti arahan tenaga kesehatan.`
    };
  }

  if (/\b(vegetarian|vegan|tanpa daging|plant based|nabati|tanpa santan|bebas susu|tanpa susu|gluten free|bebas gluten|halal|tanpa babi)\b/.test(normalized)) {
    const avoid = /\b(tanpa santan)\b/.test(normalized) ? /santan|kelapa/i
      : /\b(bebas susu|tanpa susu)\b/.test(normalized) ? /susu|keju|mentega|krim/i
        : /\b(gluten free|bebas gluten)\b/.test(normalized) ? /terigu|roti|mie|mi|kecap/i
          : /\b(vegan|nabati|plant based)\b/.test(normalized) ? /ayam|daging|ikan|udang|telur|susu|keju|mentega|madu/i
      : /\b(vegetarian|tanpa daging)\b/.test(normalized) ? /ayam|daging|ikan|udang|terasi|ebi|belacan|teri|kaldu ayam/i
              : /\b(tanpa babi|halal)\b/.test(normalized) ? /babi/i : null;
    const candidates = avoid
      ? RECIPES_DB.filter(recipe => !recipe.ingredients.some(ingredient => avoid.test(ingredient)))
      : RECIPES_DB.filter(recipe => recipe.tags.includes('Vegetarian'));
    const titles = candidates.slice(0, 4).map(recipe => recipe.title);
    const condition = normalized.match(/vegetarian|vegan|tanpa daging|plant based|nabati|tanpa santan|bebas susu|tanpa susu|gluten free|bebas gluten|halal|tanpa babi/)?.[0] || 'preferensi itu';
    return { type: 'text', text: titles.length
      ? `Untuk pilihan ${condition}, ini kandidat dari katalog: ${titles.join(', ')}. Ini penyaringan awal dari daftar bahan yang tercatat—cek lagi bumbu, kaldu, merek produk, dan labelnya. Mau rekomendasi dari bahan yang kamu punya?`
      : `Aku belum menemukan resep katalog yang cocok untuk ${condition}. Sebutkan bahan yang tersedia dan aku bantu cari opsi; tetap periksa label dan bahan tersembunyi seperti kaldu atau saus.` };
  }

  const asksSubstitution = /\b(ganti|diganti|pengganti|alternatif|substitusi|tidak ada|tidak punya|nggak ada|ga ada|gak ada|habis|kehabisan)\b/.test(normalized);
  const isAcknowledgement = /^(oke|ok|iya|ya|boleh|siap|gas|lanjut|sip)(?:\s+(?:deh|dong|bro|kak|bang|sis|lanjut|ya|boleh|aja))*[!?.\s]*$/.test(normalized.trim());
  if (awaitingSubstitutionIngredient && !asksSubstitution && !explicitRecipeRequest) {
    if (isAcknowledgement) {
      return { type: 'text', text: CHEF_PROMPTS.substitutionFollowup };
    }
    const suppliedIngredient = Object.keys(substitutionAdvice).find(item => textHasPhrase(normalized, item)) || message.trim().replace(/[?.!,]+$/, '');
    awaitingSubstitutionIngredient = false;
    return { type: 'substitusi', text: `Untuk **${suppliedIngredient}**, ${substitutionFor(suppliedIngredient)}`, tip: 'Sesuaikan takaran sedikit demi sedikit dan cicipi sebelum menambah lagi.' };
  }
  if (asksSubstitution) {
    const missingIngredient = Object.keys(substitutionAdvice).find(item => textHasPhrase(normalized, item));
    if (missingIngredient) {
      awaitingSubstitutionIngredient = false;
      if (missingIngredient === 'telur' && /\b(kue|bolu|cake|adonan)\b/.test(normalized)) {
        return { type: 'text', text: 'Untuk kue, pengganti telur tergantung fungsinya: pisang lumat atau saus apel membantu kelembapan (rasanya ikut berubah); flaxseed giling + air membantu mengikat. Tidak selalu bisa ditukar 1:1 di semua resep. Kirim jenis kue dan jumlah telurnya, nanti aku bantu pilih yang paling cocok.' };
      }
      return { type: 'substitusi', text: `Untuk **${missingIngredient}**, ${substitutionFor(missingIngredient)}`, tip: 'Sesuaikan takaran sedikit demi sedikit dan cicipi sebelum menambah lagi.' };
    }
    awaitingSubstitutionIngredient = true;
    return { type: 'text', text: CHEF_PROMPTS.askMissingIngredient };
  }

  if (isAcknowledgement) {
    if (currentChatRecipeIdx !== null && RECIPES_DB[currentChatRecipeIdx]) {
      const recipe = RECIPES_DB[currentChatRecipeIdx];
      return { type: 'text', text: `Siap 😊 Untuk **${recipe.title}**, sebutkan bahan yang tersedia atau yang mau diganti. Nanti aku sesuaikan resep dan langkahnya buat kamu.` };
    }
    return { type: 'text', text: CHEF_PROMPTS.okay };
  }

  const requestedRecipe = RECIPES_DB.find(recipe => normalized.includes(recipe.title.toLowerCase()) ||
    (recipe.title === 'Coto Makassar' && /\bcoto\b/.test(normalized)) ||
    (recipe.title === 'Ayam Betutu Bali' && /\bayam\s+betutu\b/.test(normalized)) ||
    (recipe.title === 'Ayam Sere Lemo (Ayam Sisit Bali)' && /\b(ayam\s+sere\s+lemo|ayam\s+sisit\s+sere\s+lemo|ayam\s+serli)\b/.test(normalized)) ||
    (recipe.title === 'Ayam Bakar Bumbu Bali' && /\bayam\s+bakar\s+(?:khas\s+)?bali\b/.test(normalized)) ||
    (recipe.title === 'Ayam Bakar Kecap' && /\bayam\s+bakar\b/.test(normalized)) ||
    (recipe.title === 'Lawar Sayur Bali' && /\blawar\b/.test(normalized)) ||
    (recipe.title === 'Babi Guling Bali (Versi Rumahan)' && /\bbabi\s+guling\b/.test(normalized)) ||
    (recipe.title === 'Fried Chicken Rumahan' && /\b(fried\s+chicken|ayam\s+goreng\s+crispy|ayam\s+goreng\s+krispi)\b/.test(normalized)) ||
    (recipe.title === 'Pizza Teflon Keju' && /\bpizza\b/.test(normalized)) ||
    (recipe.title === 'Burger Ayam Rumahan' && /\b(burger|hamburger)\b/.test(normalized)) ||
    (recipe.title === 'Spaghetti Bolognese' && /\b(spaghetti|bolognese)\b/.test(normalized)) ||
    (recipe.title === 'Ramen Ayam Praktis' && /\bramen\b/.test(normalized)) ||
    (recipe.title === 'Sushi Roll Isi Matang' && /\bsushi\b/.test(normalized)) ||
    (recipe.title === 'Taco Daging Sapi' && /\b(taco|tacos)\b/.test(normalized)) ||
    (recipe.title === 'Pancake Lembut' && /\bpancake\b/.test(normalized)) ||
    (recipe.title === 'Ayam Teriyaki' && /\bteriyaki\b/.test(normalized)) ||
    (recipe.title === 'Sate Lilit Bali' && /\bsate\s+lilit\b/.test(normalized))
  );
  if (requestedRecipe) {
    const dietaryNote = ['Babi Guling Bali (Versi Rumahan)', 'Lawar Sayur Bali'].includes(requestedRecipe.title)
      ? '\n\nCatatan: babi guling memakai daging babi. Lawar ini versi sayur tanpa daging dan tanpa darah.'
      : '';
    return { type: 'recipe', text: `Asik, kita bikin **${requestedRecipe.title}**! Aku tuliskan resep lengkapnya di bawah—kalau ada bahan yang nggak tersedia, bilang saja, nanti kita cari gantinya.${dietaryNote}`, recipe: { title: requestedRecipe.title, time: requestedRecipe.time, idx: RECIPES_DB.indexOf(requestedRecipe) } };
  }

  // Only offer a substitution for an ingredient actually mentioned.
  if (currentChatRecipeIdx !== null && /\b(lebih pedas|tambah pedas|kurang pedas|tidak pedas|ga pedas|nggak pedas|lebih hemat|tips|trik)\b/.test(normalized)) {
    const recipe = RECIPES_DB[currentChatRecipeIdx];
    const advice = /\b(lebih pedas|tambah pedas)\b/.test(normalized)
      ? 'Tambahkan cabai sedikit demi sedikit saat menumis bumbu, lalu cicipi sebelum menambah lagi.'
      : /\b(kurang pedas|tidak pedas|ga pedas|nggak pedas)\b/.test(normalized)
        ? 'Kurangi atau hilangkan cabai rawit. Rasa tetap gurih dengan bawang, garam, dan sedikit jeruk limau.'
        : 'Pakai bahan pengganti yang sudah ada, siapkan semua bahan sebelum memasak, dan buat porsi sesuai kebutuhan agar tidak ada sisa.';
    return { type: 'text', text: `Buat **${recipe.title}**, ${advice} Mau ubah bahan tertentu juga boleh—sebutkan bahan yang ingin diganti.` };
  }

  const asksTechnique = /\b(cara|gimana|gmn|bagaimana|kenapa|mengapa|supaya|biar|tips|trik|kok)\b/.test(normalized);
  if (asksTechnique && /\b(nasi goreng|nasi lembek|nasi pera)\b/.test(normalized)) {
    return { type: 'text', text: 'Biar nasi goreng tidak lembek, pakai nasi yang sudah dingin dan agak kering (nasi semalam bisa membantu), uraikan gumpalan, lalu goreng per porsi dengan wajan panas. Masukkan saus sedikit-sedikit supaya nasi tidak basah. Kalau nasinya baru matang, ratakan dulu agar uapnya keluar atau dinginkan sebentar.' };
  }
  if (asksTechnique && /\b(telur|setengah matang|matang sempurna)\b/.test(normalized) && /\b(rebus|merebus|telur)\b/.test(normalized)) {
    return { type: 'text', text: 'Untuk telur setengah matang, masukkan telur ke air yang sudah mendidih perlahan selama kira-kira 6–7 menit, lalu pindahkan ke air dingin agar proses masaknya berhenti. Waktu bisa berubah menurut ukuran telur dan kondisi awalnya; tambah waktu jika ingin kuning lebih padat.' };
  }
  if (asksTechnique && /\b(bawang|mata pedih|mata perih)\b/.test(normalized) && /\b(potong|iris|cincang|pedih|perih)\b/.test(normalized)) {
    return { type: 'text', text: 'Pakai pisau tajam, dinginkan bawang sebentar sebelum dipotong, dan pastikan ventilasi dapur baik. Potong bagian akar terakhir karena area itu cenderung lebih menyengat. Hindari menggosok mata saat memotong.' };
  }
  if (asksTechnique && /\b(sambal|cabai|cabe|pedas)\b/.test(normalized) && /\b(kurang|tidak|nggak|gak|ga|terlalu|mengurangi|bikin|buat)\b/.test(normalized)) {
    return { type: 'text', text: 'Kalau sambal terlanjur terlalu pedas, tambah bahan utama yang netral (misalnya tomat matang atau cabai nonpedas), sedikit demi sedikit. Sedikit gula atau asam bisa menyeimbangkan rasa, tapi tidak menghilangkan pedas; santan/minyak hanya cocok untuk jenis sambal tertentu. Untuk batch berikutnya, kurangi cabai rawit dan buang bijinya.' };
  }
  if (asksTechnique && /\b(adonan|kue|bolu|bantat|mengembang)\b/.test(normalized)) {
    return { type: 'text', text: 'Kue bantat sering terjadi karena takaran tepung/cairan meleset, pengembang sudah lemah, adonan terlalu lama diaduk setelah tepung masuk, atau oven belum cukup panas. Cek tanggal baking powder/soda, timbang bahan bila bisa, aduk secukupnya, dan jangan buka oven terlalu awal. Jenis kuenya apa dan pakai pengembang apa?' };
  }
  if (asksTechnique && /\b(wajan|panci|gosong|kerak)\b/.test(normalized) && /\b(bersihkan|membersihkan|cuci|menghilangkan|gosong|kerak)\b/.test(normalized)) {
    return { type: 'text', text: 'Rendam wajan dengan air hangat dan sabun dulu. Untuk kerak yang masih menempel, rebus air dengan sedikit baking soda beberapa menit, dinginkan, lalu gosok dengan spons yang sesuai bahan wajannya. Hindari wol baja pada lapisan antilengket dan jangan campur bahan pembersih.' };
  }
  if (asksTechnique && /\b(tumis|menumis|rebus|merebus|goreng|menggoreng|panggang|bakar|kukus|potong|iris|cincang|empuk|renyah|crispy|tidak amis|nggak amis|ga amis|bumbu|api kecil|api besar)\b/.test(normalized)) {
    const techniqueTip = /\b(tumis|menumis)\b/.test(normalized)
      ? 'Panaskan wajan lebih dulu, masukkan bahan yang keras lebih awal, lalu tumis dalam porsi kecil supaya bahan tidak menumpuk dan cepat berair.'
      : /\b(renyah|crispy)\b/.test(normalized) && /\b(tempe|tahu|ayam|goreng|menggoreng)\b/.test(normalized)
        ? 'Keringkan permukaan bahan, jangan memenuhi wajan, dan jaga panas minyak tetap stabil. Tiriskan di rak atau tisu setelah matang.'
      : /\b(goreng|menggoreng|renyah|crispy)\b/.test(normalized)
        ? 'Keringkan permukaan bahan, jangan memenuhi wajan, dan beri ruang agar panas minyak tetap stabil. Tiriskan di rak atau tisu setelah matang.'
        : /\b(rebus|merebus)\b/.test(normalized)
          ? 'Potong bahan dengan ukuran seragam agar matangnya lebih merata. Masukkan bahan yang paling lama matang lebih dulu, lalu cek teksturnya berkala.'
          : 'Aku bisa bantu. Sebutkan bahan dan hasil yang kamu inginkan—misalnya lebih empuk, renyah, cepat matang, atau bumbunya lebih meresap—karena caranya tergantung bahan.';
    return { type: 'text', text: `${techniqueTip} Kalau kamu ceritakan bahan atau masakannya, aku bisa sesuaikan langkahnya.` };
  }

  if (/\b(kalori|nutrisi|gizi|protein|karbohidrat|lemak)\b/.test(normalized)) {
    if (/\b(protein|karbohidrat|lemak|nutrisi|gizi)\b/.test(normalized)) {
      return { type: 'text', text: 'Katalog Resepin belum punya data protein, karbohidrat, atau lemak yang terverifikasi, jadi aku tidak mau menebak angkanya. Kalau kamu kirim takaran bahan dan jumlah porsi, aku bisa bantu membuat perkiraan kasar; untuk kebutuhan diet atau kesehatan, gunakan data label/ahli gizi.' };
    }
    if (currentChatRecipeIdx !== null && RECIPES_DB[currentChatRecipeIdx]) {
      const recipe = RECIPES_DB[currentChatRecipeIdx];
      if (/\b(kalori|energi)\b/.test(normalized)) {
        return { type: 'text', text: `Di katalog, **${recipe.title}** tercatat sekitar ${recipe.calories}. Angka pada situs ini hanya data contoh dan bukan analisis gizi terverifikasi. Jangan jadikan angka ini sebagai dasar keputusan diet atau kesehatan.` };
      }
      return { type: 'fallback', text: CHEF_PROMPTS.fallback(message) };
    }
    if (/\b(kalori|energi)\b/.test(normalized)) {
      return { type: 'text', text: 'Info kalori pada katalog masih data contoh dan belum diverifikasi. Sebutkan nama resepnya kalau ingin melihat angka yang tercantum; untuk protein atau nutrisi lain aku perlu komposisi dan takaran bahan yang akurat.' };
    }
    return { type: 'fallback', text: CHEF_PROMPTS.fallback(message) };
  }

  if (/\b(sarapan|makan pagi)\b/.test(normalized) && /\b(cepat|praktis|menu|ide|apa)\b/.test(normalized)) {
    const breakfast = RECIPES_DB.filter(recipe => parseInt(recipe.time, 10) <= 30 && recipe.tags.some(tag => /sarapan|cepat/i.test(tag))).slice(0, 4);
    if (breakfast.length) return { type: 'text', text: `Ide sarapan cepat dari katalog: ${breakfast.map(recipe => `${recipe.title} (${recipe.time})`).join('; ')}. Sebutkan bahan yang ada kalau mau aku pilihkan yang paling cocok.` };
  }

  if (/\b(apa bedanya|bedanya|perbedaan|jelaskan|kenapa|mengapa|berapa|bolehkah|apakah|bagaimana|gimana|cara)\b/.test(normalized) && !asksForRecipe) {
    return { type: 'fallback', text: CHEF_PROMPTS.fallback(message) };
  }

  // Match recipes against ingredients from this message and the scan list.
  const availableIngredients = [...new Set([
    ...detectedIngredients.map(item => item.name.toLowerCase()),
    ...( /\b(bun|buns|burger\s+bun|roti\s+burger)\b/.test(normalized) ? ['roti burger'] : [] ),
    ...( /\b(patty|patti|beef\s+patty|chicken\s+patty|patty\s+burger)\b/.test(normalized) ? ['patty'] : [] ),
    ...Object.keys(AI_RESPONSES.keywords).filter(item => item !== 'default' && textHasPhrase(normalized, item)),
    ...RECIPES_DB.flatMap(recipe => recipe.ingredients.map(item => item.replace(/^\S+\s*/, '').toLowerCase()).filter(item => textHasPhrase(normalized, item)))
  ])];
  const ingredientList = normalized.match(/(?:dari|punya|ada)\s+(.+?)(?:\s+(?:untuk|mau|masak|bikin|buat|resep|apa)\b|[?.!]|$)/)?.[1]
    ?.split(/,|\bdan\b/).map(item => item.trim()).filter(Boolean) || [];
  if (asksForRecipe && ingredientList.length > availableIngredients.length) {
    return { type: 'fallback', text: CHEF_PROMPTS.fallback(message) };
  }
  if (availableIngredients.length && (asksForRecipe || (availableIngredients.length > 1 && availableIngredients.some(item => normalized.includes(item)))) ) {
    const mentionsIngredient = (ingredient, available) => textHasPhrase(ingredient.replace(/^\S+\s*/, ''), available);
    const rankedRecipes = RECIPES_DB.map(recipe => {
      const matched = recipe.ingredients.filter(ingredient => availableIngredients.some(available => mentionsIngredient(ingredient, available)));
      const hasMainIngredient = recipe.ingredients.slice(0, 2).some(ingredient => availableIngredients.some(available => mentionsIngredient(ingredient, available)));
      const asksProtein = /\b(protein|tinggi protein|banyak protein)\b/.test(normalized);
      const asksQuick = /\b(cepat|kilat|sebentar|praktis|singkat)\b/.test(normalized);
      const hasChicken = recipe.ingredients.some(ingredient => mentionsIngredient(ingredient, 'ayam'));
      const meetsIntent = (!asksProtein || hasChicken || recipe.ingredients.some(ingredient => /telur|tempe|tahu|daging|ikan|kacang/i.test(ingredient))) &&
        (!asksQuick || parseInt(recipe.time, 10) <= 30);
      return { recipe, matched, score: matched.length, meetsIntent, hasMainIngredient };
    }).filter(item => item.score > 0 && item.meetsIntent &&
      (availableIngredients.length > 1 || item.hasMainIngredient) &&
      (item.recipe.title !== 'Burger Ayam Rumahan' || /\b(burger|hamburger|bun|patty)\b/.test(normalized)) &&
      (item.recipe.title !== 'Fried Chicken Rumahan' || /\b(fried chicken|crispy|krispi|goreng)\b/.test(normalized))
    ).sort((a, b) => b.score - a.score || parseInt(a.recipe.time, 10) - parseInt(b.recipe.time, 10));

    const best = rankedRecipes[0];
    if (best) {
      const names = availableIngredients.join(', ');
      if (best.recipe.title === 'Burger Ayam Rumahan' && availableIngredients.includes('roti burger') && availableIngredients.includes('patty')) {
        return {
          type: 'recipe',
          text: 'Nah, bun + patty sudah cukup buat burger simpel! Masak patty sampai matang, panggang bun sebentar, lalu tumpuk. Keju, saus, atau sayur cuma tambahan kalau ada. Aku tulis langkah lengkapnya di bawah.',
          recipe: { title: best.recipe.title, time: best.recipe.time, idx: RECIPES_DB.indexOf(best.recipe) }
        };
      }
      return {
        type: 'recipe',
        text: `Dari pesanmu, bahan yang cocok adalah **${names}**. Ide yang paling mendekati: **${best.recipe.title}** (${best.recipe.time}, ${best.recipe.difficulty.toLowerCase()}). Resep ini memakai ${best.matched.join(', ')}. Mau aku bantu sesuaikan langkahnya dengan bahan yang kamu punya?`,
        recipe: { title: best.recipe.title, time: best.recipe.time, idx: RECIPES_DB.indexOf(best.recipe) }
      };
    }
    if (availableIngredients.length) {
      return { type: 'fallback', text: CHEF_PROMPTS.fallback(message) };
    }
  }

  if (asksForRecipe && detectedIngredients.length) {
    const names = detectedIngredients.map(i => i.name).join(', ');
    const ranked = RECIPES_DB.map(recipe => ({ recipe, score: recipe.ingredients.filter(ingredient => detectedIngredients.some(item => ingredient.toLowerCase().includes(item.name.toLowerCase()))).length }))
      .sort((a, b) => b.score - a.score || parseInt(a.recipe.time, 10) - parseInt(b.recipe.time, 10));
    const best = ranked[0];
    if (best && best.score) return { type: 'recipe', text: `Dari daftar bahanmu (${names}), coba **${best.recipe.title}** (${best.recipe.time}). Resep ini paling banyak memakai bahan yang sudah tersedia.`, recipe: { title: best.recipe.title, time: best.recipe.time, idx: RECIPES_DB.indexOf(best.recipe) } };
  }

  if (/\b(tips|cara memasak|cara masak|supaya|agar)\b/.test(normalized)) {
    return { type: 'text', text: 'Tentu, aku bantu. Bahan atau masakan apa yang sedang kamu siapkan? Dengan detail itu aku bisa memberi tips yang pas.' };
  }

  return {
    type: 'fallback',
    text: CHEF_PROMPTS.fallback(message)
  };
}

function appendChatMessage(text, role) {
  const container = document.getElementById('chatMessages');
  const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const div = document.createElement('div');
  div.className = `chat-bubble ${role === 'user' ? 'user-bubble' : 'bot-bubble'}`;

  if (role === 'user') {
    div.innerHTML = `
      <div class="bubble-content"><p>${escapeHtml(text)}</p></div>
      <div class="bubble-avatar"><svg class="ui-icon" aria-hidden="true"><use href="#ui-icon-user"/></svg></div>
      <span class="bubble-time">${time}</span>
    `;
  } else {
    div.innerHTML = `
      <div class="bubble-avatar"><svg class="ui-icon" aria-hidden="true"><use href="#ui-icon-chef"/></svg></div>
      <div class="bubble-content"><p>${formatBotText(text)}</p></div>
      <span class="bubble-time">${time}</span>
    `;
  }

  container.appendChild(div);
  div.style.animation = 'slideIn 0.3s ease';
  container.scrollTop = container.scrollHeight;
}

function appendAIResponse(response) {
  const container = document.getElementById('chatMessages');
  const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const div = document.createElement('div');
  div.className = 'chat-bubble bot-bubble';

  let recipeCardHTML = '';
  if (response.type === 'recipe' && response.recipe) {
    const r = RECIPES_DB[response.recipe.idx] || RECIPES_DB[0];
    currentChatRecipeIdx = response.recipe.idx;
    recipeCardHTML = `
      <section class="chat-recipe-card" aria-label="Resep ${escapeHtml(r.title)}">
        <div class="crc-title">${r.emoji} ${escapeHtml(r.title)}</div>
        <div class="crc-meta"><span><svg class="ui-icon" aria-hidden="true"><use href="#ui-icon-clock"/></svg>${escapeHtml(r.time)}</span><span>${escapeHtml(r.difficulty)}</span><span><svg class="ui-icon" aria-hidden="true"><use href="#ui-icon-users"/></svg>${escapeHtml(r.servings)}</span></div>
        <h4>Bahan-bahan</h4>
        <ul class="chat-recipe-ingredients">${r.ingredients.map(ingredient => `<li>${escapeHtml(ingredient)}</li>`).join('')}</ul>
        <h4>Langkah memasak</h4>
        <ol class="chat-recipe-steps">${r.steps.map(step => `<li>${escapeHtml(step)}</li>`).join('')}</ol>
        <button class="crc-link" type="button" onclick="openRecipeByIndex(${response.recipe.idx})">Buka tampilan resep ↗</button>
        <div class="chat-recipe-actions">
          <button type="button" onclick="sendQuickPrompt('Bikin versi lebih pedas')">🌶️ Bikin lebih pedas</button>
          <button type="button" onclick="sendQuickPrompt('Bahan apa yang bisa diganti?')"><svg class="ui-icon" aria-hidden="true"><use href="#ui-icon-repeat"/></svg> Tanya substitusi</button>
          <button type="button" onclick="sendQuickPrompt('Kasih tips biar lebih hemat')"><svg class="ui-icon" aria-hidden="true"><use href="#ui-icon-bulb"/></svg> Tips hemat</button>
        </div>
      </section>
    `;
  }

  div.innerHTML = `
    <div class="bubble-avatar"><svg class="ui-icon" aria-hidden="true"><use href="#ui-icon-chef"/></svg></div>
    <div class="bubble-content">
      <p>${formatBotText(response.text)}</p>
      ${recipeCardHTML}
    </div>
    <span class="bubble-time">${time}</span>
  `;

  container.appendChild(div);
  div.style.animation = 'slideIn 0.3s ease';
  container.scrollTop = container.scrollHeight;
}

function appendTypingIndicator(id) {
  const container = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.id = id;
  div.className = 'chat-bubble bot-bubble';
  div.innerHTML = `
    <div class="bubble-avatar"><svg class="ui-icon" aria-hidden="true"><use href="#ui-icon-chef"/></svg></div>
    <div class="bubble-content" style="padding:14px 18px">
      <div class="typing-dots">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function hideQuickPrompts() {
  const qp = document.getElementById('quickPrompts');
  if (qp) qp.style.display = 'none';
}

function initQuickPromptDragging() {
  const strip = document.querySelector('.qp-scroll');
  if (!strip || strip.dataset.dragReady) return;
  strip.dataset.dragReady = 'true';

  let startX = 0;
  let startScrollLeft = 0;
  let isDragging = false;
  let didMove = false;

  strip.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    startX = event.clientX;
    startScrollLeft = strip.scrollLeft;
    isDragging = true;
    didMove = false;
  });

  window.addEventListener('pointermove', event => {
    if (!isDragging) return;
    const distance = event.clientX - startX;
    if (Math.abs(distance) > 5) {
      didMove = true;
      strip.classList.add('dragging');
      strip.scrollLeft = startScrollLeft - distance;
    }
  });

  const stopDragging = () => {
    if (!isDragging) return;
    isDragging = false;
    strip.classList.remove('dragging');
    if (didMove) strip.dataset.draggedAt = String(Date.now());
  };
  window.addEventListener('pointerup', stopDragging);
  window.addEventListener('pointercancel', stopDragging);
  strip.addEventListener('click', event => {
    if (Date.now() - Number(strip.dataset.draggedAt || 0) < 250) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
}

function formatBotText(text) {
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
}

function autoResizeTextarea(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}
