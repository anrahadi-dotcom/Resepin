/* Chef Resepin chat flow, response logic, and chat rendering. */

// ============================================================
// CHEF AI CHAT
// ============================================================
function updateChefBahanBadge() {
  const badge = document.getElementById('chefBahanText');
  if (!badge) return;
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
    removeTypingIndicator(typingId);
    const response = generateAIResponse(message);
    appendAIResponse(response);
  }, delay);
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
    bawang: 'gunakan bawang putih atau bawang merah yang tersedia; bila keduanya habis, bubuk bawang bisa dipakai sedikit saja.'
  };
  const substitutionFor = ingredient => {
    const known = Object.keys(substitutionAdvice).find(name => textHasPhrase(ingredient, name));
    if (known) return substitutionAdvice[known];
    if (/sayur|bayam|kangkung|brokoli|sawi|kol|wortel|selada/.test(ingredient)) return 'ganti dengan sayuran lain yang tekstur dan waktu masaknya mirip, seperti kol, sawi, atau wortel. Masukkan sayuran keras lebih dulu.';
    return 'sebutkan jenis masakannya supaya aku bisa pilih pengganti yang rasanya dan fungsinya paling mendekati. Kalau bahan ini hanya pelengkap, biasanya bisa dilewati.';
  };
  const explicitRecipeRequest = /\b(resep|masak|menu|mau|bikin|buat)\b/.test(normalized) ||
    RECIPES_DB.some(recipe => textHasPhrase(normalized, recipe.title)) ||
    /\b(ayam\s+betutu|ayam\s+sere\s+lemo|ayam\s+sisit\s+sere\s+lemo|ayam\s+bakar\s+(?:khas\s+)?bali|coto|babi\s+guling|lawar|fried\s+chicken|pizza|burger|spaghetti|ramen|sushi|taco|pancake|teriyaki|sate\s+lilit)\b/.test(normalized);

  // Handle conversation before looking for ingredients, so a greeting never
  // falls through to an unrelated recipe or generic zero-waste tip.
  if (/^(hai|halo|hello|hi|hei|pagi|siang|sore|malam)(?:\s+(?:bro|kak|bang|sis|guys))?[!?.\s]*$/i.test(normalized.trim())) {
    return { type: 'text', text: CHEF_PROMPTS.greeting };
  }
  if (/\b(terima kasih|makasih|thanks|thank you)\b/.test(normalized)) {
    return { type: 'text', text: CHEF_PROMPTS.thanks };
  }
  if (/\b(kamu siapa|siapa kamu|bisa apa|bant[u]? apa|help|tolong)\b/.test(normalized)) {
    return { type: 'text', text: CHEF_PROMPTS.help };
  }

  if (/\b(belum punya bahan|belum ada bahan|tidak punya bahan|tidak ada bahan|ga punya bahan|gak punya bahan|nggak punya bahan|gak ada bahan|nggak ada bahan|kehabisan bahan)\b/.test(normalized)) {
    return { type: 'text', text: CHEF_PROMPTS.noIngredients };
  }

  const asksSubstitution = /\b(ganti|diganti|pengganti|alternatif|substitusi|tidak ada|tidak punya|nggak ada|ga ada|habis|kehabisan)\b/.test(normalized);
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

  // Match recipes against ingredients from this message and the scan list.
  const availableIngredients = [...new Set([
    ...detectedIngredients.map(item => item.name.toLowerCase()),
    ...( /\b(bun|buns|burger\s+bun|roti\s+burger)\b/.test(normalized) ? ['roti burger'] : [] ),
    ...( /\b(patty|patti|beef\s+patty|chicken\s+patty|patty\s+burger)\b/.test(normalized) ? ['patty'] : [] ),
    ...Object.keys(AI_RESPONSES.keywords).filter(item => item !== 'default' && textHasPhrase(normalized, item)),
    ...RECIPES_DB.flatMap(recipe => recipe.ingredients.map(item => item.replace(/^\S+\s*/, '').toLowerCase()).filter(item => textHasPhrase(normalized, item)))
  ])];
  const asksForRecipe = /\b(resep|masak|masakan|makanan|ide|buat apa|bikin apa|menu)\b/.test(normalized);
  if (availableIngredients.length && (asksForRecipe || availableIngredients.some(item => normalized.includes(item)))) {
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
          text: 'Nah, bun + patty sudah cukup buat burger simpel! 🔥 Masak patty sampai matang, panggang bun sebentar, lalu tumpuk. Keju, saus, atau sayur cuma tambahan kalau ada. Aku tulis langkah lengkapnya di bawah.',
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
      const names = availableIngredients.join(', ');
      return { type: 'text', text: `Aku baru menangkap ${names}. Itu belum cukup untuk memilih resep utama dengan pas. Ada bahan lain yang bisa dipakai, atau kamu sedang mencari pengganti untuk bahan ini?` };
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
    type: 'text',
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
      <div class="bubble-avatar">👤</div>
      <span class="bubble-time">${time}</span>
    `;
  } else {
    div.innerHTML = `
      <div class="bubble-avatar">👩‍🍳</div>
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
        <div class="crc-meta">⏱ ${escapeHtml(r.time)} &nbsp;•&nbsp; ${escapeHtml(r.difficulty)} &nbsp;•&nbsp; 👥 ${escapeHtml(r.servings)}</div>
        <h4>Bahan-bahan</h4>
        <ul class="chat-recipe-ingredients">${r.ingredients.map(ingredient => `<li>${escapeHtml(ingredient)}</li>`).join('')}</ul>
        <h4>Langkah memasak</h4>
        <ol class="chat-recipe-steps">${r.steps.map(step => `<li>${escapeHtml(step)}</li>`).join('')}</ol>
        <button class="crc-link" type="button" onclick="openRecipeByIndex(${response.recipe.idx})">Buka tampilan resep ↗</button>
        <div class="chat-recipe-actions">
          <button type="button" onclick="sendQuickPrompt('Bikin versi lebih pedas')">🌶️ Bikin lebih pedas</button>
          <button type="button" onclick="sendQuickPrompt('Bahan apa yang bisa diganti?')">🔄 Tanya substitusi</button>
          <button type="button" onclick="sendQuickPrompt('Kasih tips biar lebih hemat')">💡 Tips hemat</button>
        </div>
      </section>
    `;
  }

  div.innerHTML = `
    <div class="bubble-avatar">👩‍🍳</div>
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
    <div class="bubble-avatar">👩‍🍳</div>
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
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
}

function autoResizeTextarea(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}
