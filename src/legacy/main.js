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
let selectedExploreCategory = 'bali';
const PERSONAL_STATS_KEY = 'resepin-personal-stats-v1';
const FAVORITE_RECIPE_IDS_KEY = 'resep-favorite-ids-v1';
let personalStatsMemory = { ingredientsUsed: 0, recipesOpened: 0 };

function readFavoriteRecipeIds() {
  try {
    const stored = JSON.parse(localStorage.getItem(FAVORITE_RECIPE_IDS_KEY) || '[]');
    return Array.isArray(stored) ? stored.filter(id => Number.isInteger(id)) : [];
  } catch (_) { return []; }
}

function readPersonalStats() {
  try {
    const stored = JSON.parse(localStorage.getItem(PERSONAL_STATS_KEY) || '{}');
    personalStatsMemory = {
      ingredientsUsed: Number.isFinite(stored.ingredientsUsed) && stored.ingredientsUsed > 0 ? Math.floor(stored.ingredientsUsed) : 0,
      recipesOpened: Number.isFinite(stored.recipesOpened) && stored.recipesOpened > 0 ? Math.floor(stored.recipesOpened) : 0
    };
  } catch (_) { /* Keep session-only values if browser storage is unavailable. */ }
  return { ...personalStatsMemory };
}

function renderPersonalStats(stats = readPersonalStats()) {
  const ingredients = document.getElementById('personalIngredientsUsed');
  const recipes = document.getElementById('personalRecipesOpened');
  const numbers = document.getElementById('personalStatsNumbers');
  const empty = document.getElementById('personalStatsEmpty');
  if (ingredients) ingredients.textContent = stats.ingredientsUsed.toLocaleString('id-ID');
  if (recipes) recipes.textContent = stats.recipesOpened.toLocaleString('id-ID');
  const hasActivity = stats.ingredientsUsed > 0 || stats.recipesOpened > 0;
  if (numbers) numbers.hidden = !hasActivity;
  if (empty) empty.hidden = hasActivity;
}

function updatePersonalStats(delta) {
  const current = readPersonalStats();
  personalStatsMemory = {
    ingredientsUsed: current.ingredientsUsed + (delta.ingredientsUsed || 0),
    recipesOpened: current.recipesOpened + (delta.recipesOpened || 0)
  };
  try { localStorage.setItem(PERSONAL_STATS_KEY, JSON.stringify(personalStatsMemory)); } catch (_) { /* Counters still work for this page session. */ }
  renderPersonalStats(personalStatsMemory);
}

window.recordScanIngredientUsage = function recordScanIngredientUsage() {
  const count = detectedIngredients.length;
  if (count > 0) updatePersonalStats({ ingredientsUsed: count });
};

const EXPLORE_CATEGORIES = [
  { id: 'bali', label: 'Masakan Bali', color: '#788466', matches: recipe => recipe.tags.includes('Bali') },
  { id: 'quick', label: '30 menit atau kurang', color: '#D3A64F', matches: recipe => parseInt(recipe.time, 10) <= 30 },
  { id: 'soups', label: 'Sup dan berkuah', color: '#A96F4C', matches: recipe => recipe.tags.includes('Berkuah') },
  { id: 'chicken', label: 'Menu ayam', color: '#8B7653', matches: recipe => recipe.title.toLowerCase().includes('ayam') || recipe.ingredients.some(item => /\bayam\b/i.test(item)) },
  { id: 'snacks', label: 'Camilan', color: '#B97859', matches: recipe => recipe.tags.includes('Camilan') },
  { id: 'noodles', label: 'Mi dan pasta', color: '#6F8061', matches: recipe => recipe.tags.includes('Mi') || recipe.tags.includes('Pasta') || /\b(mie|mi|ramen|spaghetti|pasta)\b/i.test(recipe.title) },
  { id: 'vegetarian', label: 'Tanpa daging', color: '#87906C', matches: recipe => recipe.tags.includes('Vegetarian') }
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
const PAGE_HASHES = {
  home: '#/', resep: '#/resep', chef: '#/chef', jelajahi: '#/jelajahi',
  scan: '#/scan', profil: '#/pengaturan', tersimpan: '#/tersimpan'
};

function recipeSlug(recipe) {
  return recipe.title.toLocaleLowerCase('id').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function routeFromLocation() {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const parts = raw.split('/').filter(Boolean).map(part => decodeURIComponent(part));
  if (!raw && new URLSearchParams(window.location.search).has('bahan')) return { page: 'resep' };
  if (!parts.length) return { page: 'home' };
  if (parts[0] === 'resep') return { page: 'resep', recipeSlug: parts[1] || '' };
  const routePages = { chef: 'chef', jelajahi: 'jelajahi', scan: 'scan', pengaturan: 'profil', tersimpan: 'tersimpan' };
  return routePages[parts[0]] ? { page: routePages[parts[0]] } : { page: 'not-found' };
}

function renderLocationRoute() {
  const route = routeFromLocation();
  const recipe = route.recipeSlug && RECIPES_DB.find(item => recipeSlug(item) === route.recipeSlug);
  const page = route.recipeSlug && !recipe ? 'not-found' : route.page;
  if (window.resepinApp) {
    window.resepinApp.activePage = page;
    window.resepinApp.floatingChefChatOpen = false;
  }
  showPage(page);
  if (recipe) openRecipeModal(recipe.title, recipe.time, recipe.servings, recipe.ingredients, recipe.steps, { updateRoute: false });
  else closeRecipeModal({ preserveRoute: true });
}

function navigateToPage(page, { replace = false } = {}) {
  const route = PAGE_HASHES[page];
  if (!route) return;
  closeRecipeModal({ preserveRoute: true });
  const next = `${window.location.pathname}${window.location.search}${route}`;
  window.history[replace ? 'replaceState' : 'pushState']({}, '', next);
  renderLocationRoute();
}

window.navigateToPage = navigateToPage;

function showPage(pageId) {
  if (pageId !== 'scan' && cameraStream) stopCamera();
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
    link.removeAttribute('aria-current');
    if (link.dataset.page === pageId) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });
  // Close mobile menu
  document.getElementById('navLinks').classList.remove('open');

  // Page-specific init
  if (pageId === 'resep') renderRecipesGrid();
  if (pageId === 'jelajahi') renderJelajahiGrid();
  if (pageId === 'tersimpan') renderSavedRecipes();
  if (pageId === 'chef') updateChefBahanBadge();
  requestAnimationFrame(() => window.refreshMotionReveals?.());
}

// Reveal content gently as it enters the viewport, while keeping all text visible without JS.
let motionRevealObserver;
window.refreshMotionReveals = function refreshMotionReveals() {
  const targets = document.querySelectorAll('.section-header, .step-card, .recipe-card, .cat-card, .scan-layout, .ingredients-panel, .camera-viewport, .ai-cta-card, .chat-container, .profile-card');
  if (!motionRevealObserver) {
    motionRevealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('motion-visible');
          motionRevealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -24px 0px' });
  }
  targets.forEach((element, index) => {
    if (element.classList.contains('motion-ready')) return;
    element.classList.add('motion-ready');
    element.style.setProperty('--motion-delay', `${(index % 4) * 75}ms`);
    motionRevealObserver.observe(element);
  });
};

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

}

// ============================================================
// CAMERA / SCAN FUNCTIONALITY
// ============================================================
async function startCamera() {
  const btn = document.getElementById('startCamBtn');
  const placeholder = document.getElementById('cameraPlaceholder');
  const feed = document.getElementById('cameraFeed');
  const overlay = document.getElementById('scanOverlay');

  if (cameraStream) {
    stopCamera();
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    const message = 'Kamera tidak tersedia di browser ini. Kamu tetap bisa mencoba contoh atau menambahkan bahan secara manual.';
    updateDetectionStatus('idle', message);
    showToast('Kamera tidak tersedia. Coba contoh atau input manual.', 'error');
    return;
  }

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

    btn.textContent = 'Matikan kamera';
    btn.style.background = 'linear-gradient(135deg, #27AE60, #1E8449)';
    btn.disabled = false;

    updateDetectionStatus('active', 'Kamera aktif — arahkan ke bahan makanan');

  } catch (err) {
    btn.textContent = 'Buka kamera';
    btn.disabled = false;
    const message = ['NotAllowedError', 'PermissionDeniedError'].includes(err?.name)
      ? 'Izin kamera belum diberikan. Kamu tetap bisa mencoba contoh atau menambahkan bahan secara manual.'
      : 'Kamera tidak dapat digunakan saat ini. Kamu tetap bisa mencoba contoh atau menambahkan bahan secara manual.';
    updateDetectionStatus('idle', message);
    showToast('Kamera tidak aktif. Coba contoh atau input manual.', 'error');
  }
}

function stopCamera() {
  cameraStream?.getTracks().forEach(track => track.stop());
  cameraStream = null;
  const feed = document.getElementById('cameraFeed');
  const placeholder = document.getElementById('cameraPlaceholder');
  const overlay = document.getElementById('scanOverlay');
  const button = document.getElementById('startCamBtn');
  const capture = document.getElementById('captureBtn');
  if (feed) { feed.pause(); feed.srcObject = null; feed.style.display = 'none'; }
  if (placeholder) placeholder.style.display = '';
  if (overlay) overlay.style.display = 'none';
  if (capture) capture.disabled = true;
  if (button) { button.textContent = 'Buka kamera'; button.style.background = ''; button.disabled = false; }
  updateDetectionStatus('idle', 'Kamera dimatikan. Kamu tetap bisa mencoba contoh atau menambahkan bahan secara manual.');
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
    { emoji: '🌽', name: 'Jagung', box: { top: '15%', left: '8%', width: '38%', height: '38%' } },
    { emoji: '🥕', name: 'Wortel', box: { top: '45%', left: '25%', width: '35%', height: '32%' } },
    { emoji: '🧅', name: 'Bawang Merah', box: { top: '20%', left: '55%', width: '30%', height: '28%' } },
    { emoji: '🧄', name: 'Bawang Putih', box: { top: '55%', left: '60%', width: '25%', height: '25%' } },
  ];

  // Animate detection box appearance + ingredient adding
  demoItems.forEach((item, idx) => {
    setTimeout(() => {
      // Create bounding box
      const box = document.createElement('div');
      box.className = 'det-box';
      box.style.cssText = `top:${item.box.top};left:${item.box.left};width:${item.box.width};height:${item.box.height}`;
      const label = document.createElement('div');
      label.className = 'det-box-label';
      label.textContent = `${item.emoji} ${item.name} · contoh`;
      box.appendChild(label);
      detBoxes.appendChild(box);
      box.style.animation = 'slideIn 0.3s ease';

      // Add to ingredient list
      setTimeout(() => addIngredientItem(item.emoji, item.name, null), 300);

      // Final state
      if (idx === demoItems.length - 1) {
        setTimeout(() => {
          updateDetectionStatus('idle', `Contoh ${demoItems.length} bahan ditampilkan — ini bukan hasil deteksi kamera.`);
          document.getElementById('confidenceBar').style.display = 'none';
          demoRunning = false;
          document.getElementById('captureBtn').disabled = !cameraStream;
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
  if (!el) return;
  const dotClass = type === 'active' ? 'active' : type === 'detected' ? 'detected' : 'idle';
  el.replaceChildren();
  const row = document.createElement('div');
  row.className = 'status-idle';
  const dot = document.createElement('div');
  dot.className = 'status-dot ' + dotClass;
  const text = document.createElement('span');
  text.textContent = message;
  row.append(dot, text);
  el.appendChild(row);
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
  const cleanName = String(name || '').trim().replace(/\s+/g, ' ');
  if (!cleanName || detectedIngredients.some(i => i.name.toLocaleLowerCase('id') === cleanName.toLocaleLowerCase('id'))) return;

  const ingredient = { emoji: String(emoji || '🥘'), name: cleanName, conf };
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
  const val = input.value.trim().replace(/\s+/g, ' ');
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

  list.replaceChildren(...detectedIngredients.map(item => {
    const row = document.createElement('div');
    row.className = 'ingredient-item';
    const emoji = document.createElement('span');
    emoji.className = 'ing-icon';
    emoji.textContent = item.emoji;
    const info = document.createElement('div');
    info.className = 'ing-info';
    const name = document.createElement('span');
    name.className = 'ing-name';
    name.textContent = item.name;
    const confidence = document.createElement('span');
    confidence.className = 'ing-conf';
    confidence.textContent = item.conf ? ('Kepercayaan: ' + item.conf + '%') : 'Diinput manual';
    info.append(name, confidence);
    const remove = document.createElement('button');
    remove.className = 'ing-remove';
    remove.type = 'button';
    remove.title = 'Hapus ' + item.name;
    remove.setAttribute('aria-label', 'Hapus ' + item.name);
    remove.textContent = '✕';
    remove.addEventListener('click', () => removeIngredient(item.name));
    row.append(emoji, info, remove);
    return row;
  }));
}

function createEmptyEl() {
  const div = document.createElement('div');
  div.id = 'ipEmpty';
  div.className = 'ip-empty';
  div.innerHTML = `
    <div class="ip-empty-icon"><svg class="ui-icon ui-icon-large" aria-hidden="true"><use href="#ui-icon-search"/></svg></div>
    <h4>Belum ada bahan</h4>
    <p>Coba contoh bahan tanpa membuka kamera, atau tambahkan bahan secara manual.</p>
    <button class="btn-primary ip-empty-example" type="button" onclick="runDemo()">Coba contoh</button>
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
    findBtn.innerHTML = `<svg class="ui-icon" aria-hidden="true"><use href="#ui-icon-pot"/></svg> Cari Resep (<span id="ingredientCountBtn">${count}</span> bahan)`;
  }
}

// ============================================================
// RECIPES GRID
// ============================================================
function recipeIngredientMatches(ingredient, term) {
  const words = value => value.toLocaleLowerCase('id').match(/[\p{L}\p{N}]+/gu) || [];
  const ingredientWords = words(ingredient);
  const termWords = words(term);
  if (!termWords.length) return false;
  return ingredientWords.some((_, start) => termWords.every((word, offset) => ingredientWords[start + offset] === word));
}

function renderRecipesGrid() {
  const grid = document.getElementById('recipesGrid');
  if (!grid) return;
  const query = document.getElementById('recipeSearch')?.value?.toLocaleLowerCase('id') || '';
  const searchTerms = query.split(',').map(term => term.trim()).filter(Boolean);
  const ingredientQuery = new URLSearchParams(window.location.search).getAll('bahan').map(value => value.trim().toLocaleLowerCase('id')).filter(Boolean);
  let filtered = RECIPES_DB;

  // Query parameters from the hero match any selected ingredient in the recipe data.
  if (ingredientQuery.length) {
    filtered = filtered.filter(recipe => ingredientQuery.some(term => recipe.ingredients.some(ingredient => recipeIngredientMatches(ingredient, term))));
  } else if (searchTerms.length) {
    // Comma-separated ingredient queries match any term; ordinary text remains a single term.
    filtered = filtered.filter(recipe => searchTerms.some(term =>
      recipe.title.toLocaleLowerCase('id').includes(term) ||
      recipe.tags.some(tag => tag.toLocaleLowerCase('id').includes(term)) ||
      recipe.ingredients.some(ingredient => recipeIngredientMatches(ingredient, term))
    ));
  }

  // Apply filter chip
  if (currentFilter !== 'all') {
    filtered = filtered.filter(r => {
      switch (currentFilter) {
        case 'mudah': return r.difficulty === 'Mudah';
        case 'cepat': return parseInt(r.time, 10) < 15;
        case 'sehat': return r.tags.includes('Sehat');
        case 'sayur': return r.tags.some(t => ['Sayur', 'Sehat'].includes(t));
        case 'berkuah': return r.tags.includes('Berkuah');
        case '5bahan': return r.ingredients.length <= 5;
        default: return true;
      }
    });
  }

  grid.innerHTML = filtered.length === 0
    ? `<div class="recipe-empty-state"><svg class="ui-icon ui-icon-large" aria-hidden="true"><use href="#ui-icon-book"/></svg><p>Tidak ada resep yang cocok.<br/>Coba kata kunci lain!</p></div>`
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
  const alt = altText || (recipe ? `Foto hidangan ${recipe.title}` : 'Foto hidangan');
  if (!src) return `<span class="${className}">${recipe ? recipe.emoji : '\uD83C\uDF7F'}</span>`;
  const fallback = (recipe ? recipe.emoji : '\uD83C\uDF7F').replace(/"/g, '&quot;');
  const objectPosition = recipe?.imagePosition || 'center';
  const image = `<img class="${className}" src="${src}" alt="${escapeHtml(alt)}" style="object-position:${objectPosition}" loading="lazy" decoding="async" data-fallback="${fallback}" />`;
  if (recipe && RECIPE_WEBP_IDS.has(recipe.id)) {
    return `<picture class="recipe-picture ${className}-picture"><source srcset="${src.replace(/\.jpe?g$/i, '.webp')}" type="image/webp" />${image}</picture>`;
  }
  return image;
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
  const ingredientCount = Array.isArray(r.ingredients) ? r.ingredients.length : null;
  return `
    <button class="recipe-card" type="button" aria-label="Lihat resep ${escapeHtml(r.title)}" onclick="openRecipeByIndex(${recipeIndex})">
      <div class="recipe-img" style="background:${r.gradient}">
        ${recipeImageHTML(r, 'recipe-img-photo')}
      </div>
      <div class="recipe-badge-diff ${r.difficulty === 'Mudah' ? 'easy' : 'medium'}">${r.difficulty}</div>
      <div class="recipe-info">
        <h3>${escapeHtml(r.title)}</h3>
        <p class="recipe-meta"><span><svg class="ui-icon" aria-hidden="true"><use href="#ui-icon-clock"/></svg>${escapeHtml(r.time)}</span>${ingredientCount === null ? '' : `<span class="recipe-ingredient-count">${ingredientCount} bahan</span>`}</p>
      </div>
    </button>
  `;
}

function renderFeaturedRecipes() {
  const list = document.querySelector('.featured-recipes .recipes-scroll');
  if (!list) return;
  list.innerHTML = RECIPES_DB.slice(0, 6).map(recipe => createRecipeCardHTML(recipe)).join('');
  bindRecipeImageFallbacks(list);
}

function renderSavedRecipes() {
  const grid = document.getElementById('savedRecipesGrid');
  if (!grid) return;
  const savedIds = new Set(readFavoriteRecipeIds());
  const recipes = RECIPES_DB.filter(recipe => savedIds.has(recipe.id));
  grid.innerHTML = recipes.length
    ? recipes.map(recipe => createRecipeCardHTML(recipe)).join('')
    : `<div class="recipe-empty-state"><svg class="ui-icon ui-icon-large" aria-hidden="true"><use href="#ui-icon-book"/></svg><p>Belum ada resep tersimpan.</p><a class="btn-primary saved-empty-action" href="#/jelajahi" onclick="event.preventDefault();navigateToPage('jelajahi')">Jelajahi koleksi resep</a></div>`;
  bindRecipeImageFallbacks(grid);
}

function filterRecipes() {
  const url = new URL(window.location.href);
  if (url.searchParams.has('bahan')) {
    url.searchParams.delete('bahan');
    window.history.replaceState(window.history.state, '', url);
  }
  renderRecipesGrid();
}

function setFilter(filter, el) {
  currentFilter = filter;
  document.querySelectorAll('.filter-chip').forEach(c => {
    const active = c === el;
    c.classList.toggle('active', active);
    c.setAttribute('aria-pressed', String(active));
  });
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
          ${recipeImageHTML(recipe, 'qr-photo')}
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

function openRecipeModal(title, time, servings, ingredients, steps, { updateRoute = true } = {}) {
  const modal = document.getElementById('recipeModal');
  const recipe = RECIPES_DB.find(r => r.title === title);
  if (updateRoute && recipe) {
    const nextHash = `#/resep/${recipeSlug(recipe)}`;
    if (window.location.hash !== nextHash) {
      window.history.pushState({ recipeModal: true }, '', `${window.location.pathname}${window.location.search}${nextHash}`);
    }
  }
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalMeta').innerHTML = `
    <span><svg class="ui-icon" aria-hidden="true"><use href="#ui-icon-clock"/></svg>${time}</span>
    <span><svg class="ui-icon" aria-hidden="true"><use href="#ui-icon-users"/></svg>${servings}</span>
    ${recipe?.difficulty ? `<span>${escapeHtml(recipe.difficulty)}</span>` : ''}
  `;

  if (recipe) updatePersonalStats({ recipesOpened: 1 });
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
    return `<li style="${detected ? 'border-color:rgba(46,196,182,0.5);background:rgba(46,196,182,0.08)' : ''}">${ing}${detected ? ' (tersedia)' : ''}</li>`;
  }).join('');

  document.getElementById('modalSteps').innerHTML = steps.map(s => `<li>${s}</li>`).join('');

  const ingredientName = ingredients[0]?.split(' ').slice(1).join(' ').toLowerCase() || '';
  const tip = findAITip(ingredientName);
  document.getElementById('modalTip').textContent = tip;
  const favoriteButton = document.querySelector('#recipeModal .btn-secondary');
  if (favoriteButton) favoriteButton.textContent = recipe && readFavoriteRecipeIds().includes(recipe.id) ? 'Hapus dari Favorit' : 'Simpan Resep';

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function openRecipeByIndex(index) {
  const recipe = RECIPES_DB[index];
  if (!recipe) return;
  openRecipeModal(recipe.title, recipe.time, recipe.servings, recipe.ingredients, recipe.steps);
}

function findAITip(ingredientName) {
  for (const [key, val] of Object.entries(AI_RESPONSES.keywords)) {
    if (ingredientName.includes(key)) return val.tip;
  }
  return AI_RESPONSES.keywords.default.tip;
}

function closeRecipeModal({ preserveRoute = false } = {}) {
  document.getElementById('recipeModal').classList.remove('open');
  document.body.style.overflow = '';
  if (!preserveRoute && /^#\/resep\//.test(window.location.hash)) {
    if (window.history.state?.recipeModal) window.history.back();
    else window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}#/resep`);
  }
}

function closeModal(event) {
  if (event.target === document.getElementById('recipeModal')) closeRecipeModal();
}

function saveRecipe() {
  const title = document.getElementById('modalTitle')?.textContent;
  const recipe = RECIPES_DB.find(item => item.title === title);
  if (!recipe) return;
  const ids = readFavoriteRecipeIds();
  const saved = ids.includes(recipe.id);
  const next = saved ? ids.filter(id => id !== recipe.id) : [...ids, recipe.id];
  try { localStorage.setItem(FAVORITE_RECIPE_IDS_KEY, JSON.stringify(next)); }
  catch (_) { showToast('Favorit tidak bisa disimpan di browser ini.', 'error'); return; }
  const button = document.querySelector('#recipeModal .btn-secondary');
  if (button) button.textContent = saved ? 'Simpan Resep' : 'Hapus dari Favorit';
  showToast(saved ? 'Resep dihapus dari Favorit.' : 'Resep disimpan ke Favorit!', 'success');
  if (document.getElementById('page-jelajahi')?.classList.contains('active')) renderJelajahiGrid();
  if (document.getElementById('page-tersimpan')?.classList.contains('active')) renderSavedRecipes();
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
  window.addEventListener('popstate', renderLocationRoute);
  window.addEventListener('hashchange', renderLocationRoute);
  initTheme();
  initQuickPromptDragging();
  initParticles();
  initScrollEffects();
  renderPersonalStats();
  const requestedIngredients = new URLSearchParams(window.location.search).getAll('bahan').map(value => value.trim()).filter(Boolean);
  if (requestedIngredients.length) {
    const search = document.getElementById('recipeSearch');
    if (search) search.value = requestedIngredients.join(', ');
  }
  if (window.location.hash || requestedIngredients.length) renderLocationRoute();
  else navigateToPage('home', { replace: true });
  window.refreshMotionReveals?.();
  bindRecipeImageFallbacks();

  // Initial recipe grid render
  renderFeaturedRecipes();
  setTimeout(() => {
    renderJelajahiGrid();
  }, 100);
});
