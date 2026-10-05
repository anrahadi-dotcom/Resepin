/* Resepin: page navigation, camera, recipe browsing, and UI behavior. */

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}


// ============================================================
// STATE
// ============================================================
let detectedIngredients = [];
let currentFilter = 'all';
let cameraStream = null;
let demoRunning = false;
let currentChatRecipeIdx = null;
let awaitingSubstitutionIngredient = false;
let selectedExploreCategory = 'all';

const EXPLORE_CATEGORIES = [
  { id: 'all', label: 'Semua resep', color: '#B65C3A', matches: () => true },
  { id: 'bali', label: 'Masakan Bali', color: '#788466', matches: recipe => recipe.tags.includes('Bali') },
  { id: 'quick', label: '30 menit atau kurang', color: '#D3A64F', matches: recipe => parseInt(recipe.time, 10) <= 30 },
  { id: 'soups', label: 'Sup dan berkuah', color: '#A96F4C', matches: recipe => recipe.tags.includes('Berkuah') },
  { id: 'chicken', label: 'Menu ayam', color: '#8B7653', matches: recipe => recipe.title.toLowerCase().includes('ayam') || recipe.ingredients.some(item => /\bayam\b/i.test(item)) },
  { id: 'snacks', label: 'Camilan', color: '#B97859', matches: recipe => recipe.tags.includes('Camilan') },
  { id: 'noodles', label: 'Mi dan pasta', color: '#6F8061', matches: recipe => recipe.tags.includes('Mi') || recipe.tags.includes('Pasta') || /\b(mie|mi|ramen|spaghetti|pasta)\b/i.test(recipe.title) },
  { id: 'vegetarian', label: 'Tanpa daging', color: '#87906C', matches: recipe => recipe.tags.includes('Vegetarian') },
  { id: 'favorites', label: 'Favorit', color: '#C28B45', matches: recipe => recipe.tags.includes('Favorit') }
];

// AI Response database
const AI_RESPONSES = {
  keywords: {
    "wortel": { recipe: "Sup Wortel Jahe", time: "20 mnt", tip: "Jahe membuat sup wortel lebih hangat dan menyehatkan!" },
    "jagung": { recipe: "Sup Jagung Susu Creamy", time: "25 mnt", tip: "Tambahkan susu evaporasi untuk sup jagung yang lebih creamy!" },
    "telur": { recipe: "Telur Balado Pedas", time: "15 mnt", tip: "Goreng dulu telurnya agar kulit kering sebelum dimasukkan ke sambal." },
    "nasi": { recipe: "Nasi Goreng Spesial", time: "12 mnt", tip: "Nasi kemarin lebih baik untuk nasi goreng karena lebih kering!" },
    "ayam": { recipe: "Ayam Saus Tiram", time: "25 mnt", tip: "Lumuri ayam dengan tepung maizena sebelum digoreng agar lebih crispy!" },
    "tempe": { recipe: "Tempe Mendoan Crispy", time: "20 mnt", tip: "Adonan mendoan yang tipis dan berbumbu adalah kunci kecrispy-an!" },
    "tahu": { recipe: "Tahu Crispy Pedas Manis", time: "20 mnt", tip: "Keringkan tahu sebelum digoreng agar tidak meletup-letup!" },
    "kangkung": { recipe: "Tumis Kangkung Bawang Putih", time: "8 mnt", tip: "Jangan masak kangkung terlalu lama, cukup 2-3 menit saja!" },
    "brokoli": { recipe: "Tumis Brokoli Saus Tiram", time: "15 mnt", tip: "Blanching brokoli sebentar sebelum ditumis agar warnanya tetap hijau cerah!" },
    "mie": { recipe: "Mie Goreng Lezat", time: "12 mnt", tip: "Gunakan api besar saat menggoreng mie agar teksturnya lebih kenyal!" },
    "default": { recipe: "Oseng Bumbu Sederhana", time: "15 mnt", tip: "Pastikan bumbu dasar (bawang merah, bawang putih) selalu tersedia di dapur!" }
  },
  substitusi: {
    "santan": "Bisa diganti dengan susu full cream, atau blender kelapa parut dengan air panas!",
    "kecap": "Ganti dengan campuran gula merah + sedikit air + kecap ikan untuk umami yang mirip.",
    "terasi": "Bisa diganti dengan udang kering yang dihaluskan atau tambahkan lebih banyak garam.",
    "daun salam": "Ganti dengan bay leaf (daun laurel) atau daun jeruk untuk aroma yang serupa.",
    "kemiri": "Bisa diganti dengan kacang macadamia atau skip saja untuk tekstur yang sedikit berbeda."
  }
};

// ============================================================
// NAVIGATION
// ============================================================
function showPage(pageId) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // Show target page
  const target = document.getElementById(`page-${pageId}`);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  // Update nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.dataset.page === pageId) link.classList.add('active');
  });
  // Close mobile menu
  document.getElementById('navLinks').classList.remove('open');

  // Page-specific init
  if (pageId === 'resep') renderRecipesGrid();
  if (pageId === 'jelajahi') renderJelajahiGrid();
  if (pageId === 'chef') updateChefBahanBadge();
}

function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('open');
}

function applyTheme(theme) {
  const selected = theme === 'dark' ? 'dark' : 'light';
  document.body.dataset.theme = selected;
  const button = document.getElementById('themeToggle');
  const label = document.getElementById('themeLabel');
  const icon = document.getElementById('themeIcon');
  const nextTheme = selected === 'dark' ? 'light' : 'dark';
  if (label) label.textContent = nextTheme === 'dark' ? 'Gelap' : 'Terang';
  if (icon) {
    icon.innerHTML = nextTheme === 'dark'
      ? '<path d="M20.9 13A8.5 8.5 0 0 1 11 3.1 8.5 8.5 0 1 0 20.9 13Z"/>'
      : '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>';
  }
  if (button) {
    button.setAttribute('aria-label', `Aktifkan mode ${nextTheme === 'dark' ? 'gelap' : 'terang'}`);
    button.setAttribute('aria-pressed', String(selected === 'dark'));
  }
  try { localStorage.setItem('resep-theme', selected); } catch (_) { /* Theme still works for this page view. */ }
}

function toggleTheme() {
  applyTheme(document.body.dataset.theme === 'dark' ? 'light' : 'dark');
}

function initTheme() {
  let savedTheme = 'light';
  try { savedTheme = localStorage.getItem('resep-theme') || 'light'; } catch (_) { /* Use the warm light theme by default. */ }
  applyTheme(savedTheme);
}

// ============================================================
// PARTICLES (Hero Section)
// ============================================================
function initParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      animation-duration: ${8 + Math.random() * 12}s;
      animation-delay: ${-Math.random() * 15}s;
      width: ${2 + Math.random() * 4}px;
      height: ${2 + Math.random() * 4}px;
      opacity: ${0.1 + Math.random() * 0.3};
    `;
    container.appendChild(p);
  }
}

// ============================================================
// SCROLL EFFECTS
// ============================================================
function initScrollEffects() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

  // Counter animation for waste stats
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const nums = entry.target.querySelectorAll('.ws-num');
        nums.forEach(num => {
          const target = parseInt(num.dataset.target);
          animateCounter(num, 0, target, 2000);
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  const statsSection = document.querySelector('.waste-stats');
  if (statsSection) observer.observe(statsSection);
}

function animateCounter(el, start, end, duration) {
  const startTime = performance.now();
  const update = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.floor(start + (end - start) * eased);
    el.textContent = value.toLocaleString('id-ID');
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

// Footer live counter
function animateFooterCounter() {
  let count = 12450;
  setInterval(() => {
    count += Math.floor(Math.random() * 3);
    const el = document.getElementById('footerWasteCount');
    if (el) el.textContent = count.toLocaleString('id-ID');
  }, 3000);
}

// ============================================================
// CAMERA / SCAN FUNCTIONALITY
// ============================================================
async function startCamera() {
  const btn = document.getElementById('startCamBtn');
  const placeholder = document.getElementById('cameraPlaceholder');
  const feed = document.getElementById('cameraFeed');
  const overlay = document.getElementById('scanOverlay');

  try {
    btn.textContent = 'Meminta izin...';
    btn.disabled = true;

    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    });

    feed.srcObject = cameraStream;
    feed.style.display = 'block';
    placeholder.style.display = 'none';
    overlay.style.display = 'block';

    const captureBtn = document.getElementById('captureBtn');
    captureBtn.disabled = false;

    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>
      Kamera Aktif
    `;
    btn.style.background = 'linear-gradient(135deg, #27AE60, #1E8449)';
    btn.disabled = false;

    updateDetectionStatus('active', 'Kamera aktif — arahkan ke bahan makanan');

  } catch (err) {
    btn.textContent = 'Buka kamera';
    btn.disabled = false;
    updateDetectionStatus('idle', 'Kamera tidak tersedia. Kamu bisa menambahkan bahan sendiri.');
    showToast('Kamera tidak tersedia di perangkat ini.', 'error');
  }
}

function runDemo() {
  if (demoRunning) return;
  demoRunning = true;

  const placeholder = document.getElementById('cameraPlaceholder');
  const overlay = document.getElementById('scanOverlay');
  const detBoxes = document.getElementById('detectionBoxes');

  // Show scan UI
  placeholder.style.display = 'none';
  overlay.style.display = 'block';
  detBoxes.innerHTML = '';

  updateDetectionStatus('active', 'Menyiapkan contoh bahan...');

  const demoItems = [
    { emoji: '🌽', name: 'Jagung', conf: 97, box: { top: '15%', left: '8%', width: '38%', height: '38%' } },
    { emoji: '🥕', name: 'Wortel', conf: 94, box: { top: '45%', left: '25%', width: '35%', height: '32%' } },
    { emoji: '🧅', name: 'Bawang Merah', conf: 89, box: { top: '20%', left: '55%', width: '30%', height: '28%' } },
    { emoji: '🧄', name: 'Bawang Putih', conf: 86, box: { top: '55%', left: '60%', width: '25%', height: '25%' } },
  ];

  // Animate detection box appearance + ingredient adding
  demoItems.forEach((item, idx) => {
    setTimeout(() => {
      // Create bounding box
      const box = document.createElement('div');
      box.className = 'det-box';
      box.style.cssText = `top:${item.box.top};left:${item.box.left};width:${item.box.width};height:${item.box.height}`;
      box.innerHTML = `<div class="det-box-label">${item.emoji} ${item.name} ${item.conf}%</div>`;
      detBoxes.appendChild(box);
      box.style.animation = 'slideIn 0.3s ease';

      // Add to ingredient list
      setTimeout(() => addIngredientItem(item.emoji, item.name, item.conf), 300);

      // Final state
      if (idx === demoItems.length - 1) {
        setTimeout(() => {
          updateDetectionStatus('detected', `✅ ${demoItems.length} bahan terdeteksi! Cari resep atau tanya Chef Resepin.`);
          showConfidenceBar(91);
          demoRunning = false;
          document.getElementById('captureBtn').disabled = false;
        }, 500);
      }
    }, 800 + idx * 1000);
  });
}

async function captureAndDetect() {
  const video = document.getElementById('cameraFeed');
  const canvas = document.getElementById('cameraCanvas');
  const boxes = document.getElementById('detectionBoxes');
  if (!cameraStream || !video.videoWidth) {
    showToast('Aktifkan kamera sebelum mengambil foto.', 'error');
    return;
  }

  const button = document.getElementById('captureBtn');
  button.disabled = true;
  updateDetectionStatus('active', 'Memeriksa foto dengan model bahan...');
  const imageScale = Math.min(1, 1600 / Math.max(video.videoWidth, video.videoHeight));
  canvas.width = Math.round(video.videoWidth * imageScale);
  canvas.height = Math.round(video.videoHeight * imageScale);
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  boxes.innerHTML = '';

  try {
    const imageBlob = await new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Foto tidak bisa disiapkan.')), 'image/jpeg', 0.82);
    });
    if (imageBlob.size > 3_900_000) throw new Error('Foto masih terlalu besar. Coba ambil foto dari jarak lebih dekat.');
    const formData = new FormData();
    formData.append('file', imageBlob, 'bahan.jpg');
    const response = await fetch('/api/detect', { method: 'POST', body: formData });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.detail || 'Deteksi gagal. Pastikan server Resepin sedang berjalan.');

    const foodEmojis = {
      'Ayam': '🍗', 'Bawang Bombai': '🧅', 'Bawang Merah': '🧅', 'Bawang Putih': '🧄',
      'Bayam': '🥬', 'Biji Kemiri': '🌰', 'Cabai Hijau': '🫑', 'Cabai Merah': '🌶️',
      'Daging Sapi': '🥩', 'Daun Bawang': '🌿', 'Ikan': '🐟', 'Jagung': '🌽', 'Jahe': '🫚',
      'Kacang Panjang': '🫘', 'Kangkung': '🥬', 'Kencur': '🌿', 'Kentang': '🥔',
      'Ketumbar': '🌿', 'Kol': '🥬', 'Kunyit': '🫚', 'Lada': '⚫', 'Lengkuas': '🌿',
      'Selada': '🥬', 'Tahu': '🟨', 'Telur': '🥚', 'Tempe': '🧱', 'Terong': '🍆',
      'Tomat': '🍅', 'Udang': '🦐', 'Wortel': '🥕'
    };
    const matches = result.detections || [];
    matches.forEach(({ label, confidence, bbox }) => {
      const emoji = foodEmojis[label] || '🥗';
      const name = label;
      const [x1, y1, x2, y2] = bbox;
      const box = document.createElement('div');
      box.className = 'det-box';
      box.style.cssText = `left:${x1 / canvas.width * 100}%;top:${y1 / canvas.height * 100}%;width:${(x2 - x1) / canvas.width * 100}%;height:${(y2 - y1) / canvas.height * 100}%`;
      const caption = document.createElement('div');
      caption.className = 'det-box-label';
      caption.textContent = `${emoji} ${name} ${Math.round(confidence * 100)}%`;
      box.appendChild(caption);
      boxes.appendChild(box);
      addIngredientItem(emoji, name, Math.round(confidence * 100));
    });
    if (matches.length) {
      const confidence = Math.round(matches.reduce((sum, item) => sum + item.confidence, 0) / matches.length * 100);
      updateDetectionStatus('detected', `${matches.length} bahan terdeteksi. Periksa hasilnya sebelum mencari resep.`);
      showConfidenceBar(confidence);
      showToast('Foto berhasil dipindai.', 'success');
    } else {
      updateDetectionStatus('idle', 'Belum menemukan bahan yang didukung. Coba dekatkan objek atau tambah bahan secara manual.');
    }
  } catch (error) {
    updateDetectionStatus('idle', error.message || 'Deteksi gagal. Pastikan server Resepin dan model PyTorch siap.');
    showToast(error.message || 'Deteksi bahan gagal.', 'error');
  } finally {
    button.disabled = false;
  }
}

function updateDetectionStatus(type, message) {
  const el = document.getElementById('detectionStatus');
  const dotClass = type === 'active' ? 'active' : type === 'detected' ? 'detected' : 'idle';
  el.innerHTML = `
    <div class="status-idle">
      <div class="status-dot ${dotClass}"></div>
      <span>${message}</span>
    </div>
  `;
}

function showConfidenceBar(pct) {
  const bar = document.getElementById('confidenceBar');
  const fill = document.getElementById('confFill');
  const pctEl = document.getElementById('confPct');
  bar.style.display = 'flex';
  setTimeout(() => {
    fill.style.width = pct + '%';
    pctEl.textContent = pct + '%';
  }, 100);
}

// ============================================================
// INGREDIENT MANAGEMENT
// ============================================================
function addIngredientItem(emoji, name, conf) {
  // Check duplicate
  if (detectedIngredients.find(i => i.name.toLowerCase() === name.toLowerCase())) return;

  const ingredient = { emoji, name, conf };
  detectedIngredients.push(ingredient);

  renderIngredientList();
  updateIngredientCount();
}

function addIngredient(label) {
  const parts = label.split(' ');
  const emoji = parts[0];
  const name = parts.slice(1).join(' ');
  addIngredientItem(emoji, name, null);
  showToast(`${emoji} ${name} ditambahkan!`, 'success');
}

function addManualIngredient() {
  const input = document.getElementById('manualIngredientInput');
  const val = input.value.trim();
  if (!val) return;

  addIngredientItem('🥘', val, null);
  input.value = '';
  showToast(`🥘 ${val} ditambahkan!`, 'success');
}

function removeIngredient(name) {
  detectedIngredients = detectedIngredients.filter(i => i.name !== name);
  renderIngredientList();
  updateIngredientCount();
}

function renderIngredientList() {
  const list = document.getElementById('ingredientList');
  const empty = document.getElementById('ipEmpty');

  if (detectedIngredients.length === 0) {
    list.innerHTML = '';
    list.appendChild(createEmptyEl());
    return;
  }

  list.innerHTML = detectedIngredients.map(item => `
    <div class="ingredient-item">
      <span class="ing-icon">${item.emoji}</span>
      <div class="ing-info">
        <span class="ing-name">${item.name}</span>
        ${item.conf ? `<span class="ing-conf">Kepercayaan: ${item.conf}%</span>` : '<span class="ing-conf">Diinput manual</span>'}
      </div>
      <button class="ing-remove" onclick="removeIngredient('${item.name}')" title="Hapus">✕</button>
    </div>
  `).join('');
}

function createEmptyEl() {
  const div = document.createElement('div');
  div.id = 'ipEmpty';
  div.className = 'ip-empty';
  div.innerHTML = `
    <div class="ip-empty-icon">🔍</div>
    <p>Belum ada bahan terdeteksi.<br/>Aktifkan kamera atau coba Mode Demo</p>
  `;
  return div;
}

function updateIngredientCount() {
  const count = detectedIngredients.length;
  document.getElementById('ingredientCount').textContent = `${count} bahan`;
  document.getElementById('ingredientCountBtn').textContent = count;

  const findBtn = document.getElementById('findRecipesBtn');
  findBtn.disabled = count === 0;
  if (count > 0) {
    findBtn.innerHTML = `🍳 Cari Resep (<span id="ingredientCountBtn">${count}</span> bahan)`;
  }
}

// ============================================================
// RECIPES GRID
// ============================================================
function renderRecipesGrid() {
  const grid = document.getElementById('recipesGrid');
  if (!grid) return;
  const query = document.getElementById('recipeSearch')?.value?.toLowerCase() || '';
  let filtered = RECIPES_DB;

  // Apply text search
  if (query) {
    filtered = filtered.filter(r =>
      r.title.toLowerCase().includes(query) ||
      r.tags.some(t => t.toLowerCase().includes(query)) ||
      r.ingredients.some(i => i.toLowerCase().includes(query))
    );
  }

  // Apply filter chip
  if (currentFilter !== 'all') {
    filtered = filtered.filter(r => {
      switch (currentFilter) {
        case 'mudah': return r.difficulty === 'Mudah';
        case 'cepat': return parseInt(r.time) <= 15;
        case 'sehat': return r.tags.includes('Sehat');
        case 'sayur': return r.tags.some(t => ['Sayur', 'Sehat'].includes(t));
        case 'berkuah': return r.tags.includes('Berkuah');
        case '5bahan': return r.ingredients.length <= 5;
        default: return true;
      }
    });
  }

  grid.innerHTML = filtered.length === 0
    ? `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted)"><div style="font-size:3rem;margin-bottom:16px">🍳</div><p>Tidak ada resep yang cocok.<br/>Coba kata kunci lain!</p></div>`
    : filtered.map(r => createRecipeCardHTML(r)).join('');
  bindRecipeImageFallbacks(grid);
}

// URL foto hidangan sudah matang untuk sebuah resep
function getRecipeImage(recipe) {
  if (!recipe) return '';
  if (recipe.image) return recipe.image;
  const slug = RECIPE_IMAGES[recipe.id];
  return slug ? `assets/img/${slug}.jpg` : '';
}

// Elemen foto hidangan yang sudah matang, dengan fallback ke emoji bila foto gagal dimuat
function recipeImageHTML(recipe, className, altText) {
  const src = getRecipeImage(recipe);
  const alt = altText || (recipe ? recipe.title : 'Halaman Resepin');
  if (!src) return `<span class="${className}">${recipe ? recipe.emoji : '\uD83C\uDF7F'}</span>`;
  return `<img class="${className}" src="${src}" alt="${alt}" loading="lazy" data-fallback="${(recipe ? recipe.emoji : '\uD83C\uDF7F').replace(/"/g, '&quot;')}" />`;
}

// Pasang fallback emoji untuk foto yang gagal dimuat (dipasang sekali per render)
function bindRecipeImageFallbacks(root = document) {
  root.querySelectorAll('img[data-fallback]').forEach(img => {
    img.addEventListener('error', function handleError() {
      const span = document.createElement('span');
      span.className = img.className;
      span.textContent = img.dataset.fallback || '\uD83C\uDF7F';
      img.replaceWith(span);
    }, { once: true });
  });
}

function createRecipeCardHTML(r) {
  const recipeIndex = RECIPES_DB.indexOf(r);
  return `
    <div class="recipe-card" onclick="openRecipeByIndex(${recipeIndex})">
      <div class="recipe-img" style="background:${r.gradient}">
        ${recipeImageHTML(r, 'recipe-img-photo', r.title)}
      </div>
      <div class="recipe-badge-diff ${r.difficulty === 'Mudah' ? 'easy' : 'medium'}">${r.difficulty}</div>
      <div class="recipe-info">
        <h3>${r.title}</h3>
        <p class="recipe-meta">⏱ ${r.time} &nbsp;|&nbsp; 👥 ${r.servings} &nbsp;|&nbsp; 🔥 ${r.calories}</p>
        <div class="recipe-tags">${r.tags.map(t => `<span>${t}</span>`).join('')}</div>
        <div class="recipe-ingredients-preview">
          ${r.ingredients.slice(0, 4).map(i => `<span>${i.split(' ')[0]}</span>`).join('')}
          ${r.ingredients.length > 4 ? `<span class="more">+${r.ingredients.length - 4}</span>` : ''}
        </div>
      </div>
    </div>
  `;
}

function filterRecipes() {
  renderRecipesGrid();
}

function setFilter(filter, el) {
  currentFilter = filter;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderRecipesGrid();
}

function getExploreRecipes(categoryId = selectedExploreCategory) {
  const category = EXPLORE_CATEGORIES.find(item => item.id === categoryId) || EXPLORE_CATEGORIES[0];
  return RECIPES_DB.filter(category.matches);
}

function filterByCategory(categoryId) {
  selectedExploreCategory = categoryId;
  renderExploreResults();
  document.querySelectorAll('.cat-card').forEach(button => {
    const active = button.dataset.category === categoryId;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  document.getElementById('exploreResults')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================================
// JELAJAHI GRID
// ============================================================
function renderJelajahiGrid() {
  const categoryGrid = document.getElementById('exploreCategories');
  if (!categoryGrid) return;

  categoryGrid.innerHTML = EXPLORE_CATEGORIES.map(category => {
    const count = RECIPES_DB.filter(category.matches).length;
    const active = category.id === selectedExploreCategory;
    return `<button class="cat-card${active ? ' active' : ''}" type="button" data-category="${category.id}" aria-pressed="${active}" onclick="filterByCategory('${category.id}')" style="--cat-color:${category.color}">
      <span class="cat-swatch" aria-hidden="true"></span>
      <span class="cat-name">${category.label}</span>
      <span class="cat-count">${count} resep</span>
    </button>`;
  }).join('');

  const quickList = document.getElementById('quickRecipesList');
  if (quickList) {
    const quickRecipes = RECIPES_DB.filter(recipe => parseInt(recipe.time, 10) <= 30)
      .sort((a, b) => parseInt(a.time, 10) - parseInt(b.time, 10));
    const quickCount = document.getElementById('quickRecipesCount');
    if (quickCount) quickCount.textContent = `Menampilkan ${Math.min(4, quickRecipes.length)} dari ${quickRecipes.length} resep`;
    quickList.innerHTML = quickRecipes.length
      ? quickRecipes.slice(0, 4).map(recipe => `<button class="qr-item" type="button" onclick="openRecipeByIndex(${RECIPES_DB.indexOf(recipe)})">
          ${recipeImageHTML(recipe, 'qr-photo', recipe.title)}
          <span class="qr-info"><span class="qr-name">${recipe.title}</span><span class="qr-meta">${recipe.difficulty} · ${recipe.ingredients.length} bahan</span></span>
          <span class="qr-time">${recipe.time}</span>
        </button>`).join('')
      : '<p class="explore-empty">Belum ada resep singkat di katalog.</p>';
    bindRecipeImageFallbacks(quickList);
  }

  const fiveBahanGrid = document.getElementById('fiveBahanGrid');
  if (fiveBahanGrid) {
    const fiveBahan = RECIPES_DB.filter(recipe => recipe.ingredients.length <= 5);
    fiveBahanGrid.innerHTML = fiveBahan.length
      ? fiveBahan.map(recipe => createRecipeCardHTML(recipe)).join('')
      : '<p class="explore-empty">Belum ada resep dengan lima bahan atau kurang.</p>';
    bindRecipeImageFallbacks(fiveBahanGrid);
  }
  renderExploreResults();
}

function renderExploreResults() {
  const title = document.getElementById('exploreResultsTitle');
  const count = document.getElementById('exploreResultsCount');
  const grid = document.getElementById('exploreResultsGrid');
  const category = EXPLORE_CATEGORIES.find(item => item.id === selectedExploreCategory) || EXPLORE_CATEGORIES[0];
  const recipes = getExploreRecipes(category.id);
  if (title) title.textContent = category.label;
  if (count) count.textContent = `${recipes.length} resep dari katalog`;
  if (grid) {
    grid.innerHTML = recipes.length
      ? recipes.map(recipe => createRecipeCardHTML(recipe)).join('')
      : '<p class="explore-empty">Belum ada resep dalam kategori ini.</p>';
    bindRecipeImageFallbacks(grid);
  }
}

// ============================================================
// RECIPE MODAL
// ============================================================
const EMOJI_GRADIENTS = {
  '🌽': 'linear-gradient(135deg,#e67e22,#f39c12)',
  '🍚': 'linear-gradient(135deg,#8e44ad,#9b59b6)',
  '🥬': 'linear-gradient(135deg,#27ae60,#2ecc71)',
  '🧱': 'linear-gradient(135deg,#e74c3c,#c0392b)',
  '🥦': 'linear-gradient(135deg,#1abc9c,#16a085)',
  '🍗': 'linear-gradient(135deg,#f39c12,#d68910)',
};

function openRecipeModal(title, time, servings, calories, ingredients, steps) {
  const modal = document.getElementById('recipeModal');
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalMeta').innerHTML = `
    <span>⏱ ${time}</span>
    <span>👥 ${servings}</span>
    <span>🔥 ${calories}</span>
  `;

  const recipe = RECIPES_DB.find(r => r.title === title);
  const hero = document.getElementById('modalHero');
  const heroMedia = document.getElementById('modalHeroMedia');
  const photoSrc = getRecipeImage(recipe);
  if (photoSrc) {
    heroMedia.innerHTML = `<img class="modal-hero-photo" src="${photoSrc}" alt="${title}" onerror="this.style.display='none';document.getElementById('modalHeroEmoji').style.display='flex'" />`;
    document.getElementById('modalHeroEmoji').style.display = 'none';
  } else {
    heroMedia.innerHTML = '';
    const firstEmoji = ingredients[0]?.split(' ')[0] || '🍳';
    const heroEmoji = document.getElementById('modalHeroEmoji');
    heroEmoji.textContent = firstEmoji + (ingredients[1]?.split(' ')[0] || '');
    heroEmoji.style.display = 'flex';
  }
  const firstEmoji = ingredients[0]?.split(' ')[0] || '🍳';
  const gradient = EMOJI_GRADIENTS[firstEmoji] || 'linear-gradient(135deg,rgba(255,107,53,0.2),rgba(46,196,182,0.15))';
  hero.style.background = gradient;

  document.getElementById('modalIngredients').innerHTML = ingredients.map(ing => {
    const detected = detectedIngredients.some(d => ing.toLowerCase().includes(d.name.toLowerCase()));
    return `<li style="${detected ? 'border-color:rgba(46,196,182,0.5);background:rgba(46,196,182,0.08)' : ''}">${ing}${detected ? ' ✅' : ''}</li>`;
  }).join('');

  document.getElementById('modalSteps').innerHTML = steps.map(s => `<li>${s}</li>`).join('');

  const ingredientName = ingredients[0]?.split(' ').slice(1).join(' ').toLowerCase() || '';
  const tip = findAITip(ingredientName);
  document.getElementById('modalTip').textContent = tip;

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function openRecipeByIndex(index) {
  const recipe = RECIPES_DB[index];
  if (!recipe) return;
  openRecipeModal(recipe.title, recipe.time, recipe.servings, recipe.calories, recipe.ingredients, recipe.steps);
}

function findAITip(ingredientName) {
  for (const [key, val] of Object.entries(AI_RESPONSES.keywords)) {
    if (ingredientName.includes(key)) return val.tip;
  }
  return AI_RESPONSES.keywords.default.tip;
}

function closeRecipeModal() {
  document.getElementById('recipeModal').classList.remove('open');
  document.body.style.overflow = '';
}

function closeModal(event) {
  if (event.target === document.getElementById('recipeModal')) closeRecipeModal();
}

function saveRecipe() {
  showToast('❤️ Resep disimpan ke Favorit!', 'success');
  closeRecipeModal();
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
let toastTimeout;
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeRecipeModal();
    document.getElementById('navLinks').classList.remove('open');
  }
});

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initQuickPromptDragging();
  initParticles();
  initScrollEffects();
  animateFooterCounter();
  showPage('home');
  bindRecipeImageFallbacks();

  // Initial recipe grid render
  setTimeout(() => {
    renderJelajahiGrid();
  }, 100);
});
