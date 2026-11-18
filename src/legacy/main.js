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
let currentDietFilter = 'all';
let currentBudgetFilter = null;
let currentRecipeSort = 'match';
let assumePantryBasics = true;
let scanBackendAvailable = null;
let cameraStream = null;
let scanPreviewObjectUrl = null;
let scanRequestSequence = 0;
let activeScanController = null;
let scanDropDepth = 0;
let currentChatRecipeIdx = null;
let awaitingSubstitutionIngredient = false;
let selectedExploreCategory = 'bali';
let activeModalRecipe = null;
let activeModalServings = 1;
let activeCookingStep = 0;
let cookingWakeLock = null;
let cookingTimerInterval = null;
let previousRecipeFocus = null;
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

window.prepareScanRecipeSearch = function prepareScanRecipeSearch() {
  const names = detectedIngredients.map(item => item.name).filter(Boolean);
  const search = document.getElementById('recipeSearch');
  if (search) search.value = names.join(', ');
  const url = new URL(window.location.href);
  url.searchParams.delete('bahan');
  names.forEach(name => url.searchParams.append('bahan', name));
  window.history.replaceState(window.history.state, '', url);
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
  if (!window.location.hash && new URLSearchParams(window.location.search).has('bahan')) return { page: 'resep' };
  if (!parts.length) return { page: 'home' };
  if (parts[0] === 'resep') return { page: 'resep', recipeSlug: parts[1] || '' };
  const routePages = { chef: 'chef', jelajahi: 'jelajahi', scan: 'scan', pengaturan: 'profil', tersimpan: 'tersimpan' };
  return routePages[parts[0]] ? { page: routePages[parts[0]] } : { page: 'not-found' };
}

function updateRouteMetadata(page, recipe) {
  const pageCopy = {
    home: ['Resepin — Masak dari Sisa, Praktis & Lezat', 'Temukan ide masakan rumahan dari bahan yang tersedia di dapurmu.'],
    resep: ['Semua Resep — Resepin', 'Cari dan saring resep rumahan berdasarkan bahan yang kamu punya.'],
    chef: ['Chef Resepin — Asisten Dapur', 'Tanya Chef Resepin tentang resep, substitusi, dan teknik memasak.'],
    jelajahi: ['Jelajahi Resep — Resepin', 'Jelajahi koleksi resep rumahan dari berbagai kategori.'],
    scan: ['Scan Bahan — Resepin', 'Pindai atau masukkan bahan dapur untuk menemukan ide resep.'],
    profil: ['Pengaturan — Resepin', 'Atur tampilan Resepin sesuai kenyamananmu.'],
    tersimpan: ['Resep Tersimpan — Resepin', 'Buka kembali resep pilihan yang tersimpan di browser ini.'],
    'not-found': ['Halaman Tidak Ditemukan — Resepin', 'Tautan ini belum memiliki halaman Resepin.']
  };
  const [title, description] = recipe
    ? [`${recipe.title} — Resepin`, `Resep ${recipe.title}: ${recipe.steps.length} langkah, sekitar ${recipe.time}.`]
    : pageCopy[page] || pageCopy['not-found'];
  document.title = title;
  const setMeta = (selector, value, attribute = 'content') => {
    const element = document.querySelector(selector);
    if (element) element.setAttribute(attribute, value);
  };
  setMeta('meta[name="description"]', description);
  setMeta('meta[property="og:title"]', title);
  setMeta('meta[property="og:description"]', description);
  setMeta('meta[property="og:url"]', window.location.href);
  setMeta('meta[name="twitter:title"]', title);
  setMeta('meta[name="twitter:description"]', description);
  let structuredData = document.getElementById('recipeJsonLd');
  if (!recipe) {
    structuredData?.remove();
    return;
  }
  if (!structuredData) {
    structuredData = document.createElement('script');
    structuredData.id = 'recipeJsonLd';
    structuredData.type = 'application/ld+json';
    document.head.appendChild(structuredData);
  }
  structuredData.textContent = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Recipe', name: recipe.title,
    image: new URL(getRecipeImage(recipe), window.location.href).href,
    recipeCategory: recipe.category, recipeCuisine: 'Indonesia', recipeYield: recipe.servings,
    totalTime: `PT${Number.parseInt(recipe.time, 10) || 0}M`,
    recipeIngredient: recipe.ingredientDetails.map(item => item.name),
    recipeInstructions: recipe.steps.map((step, index) => ({ '@type': 'HowToStep', position: index + 1, text: typeof step === 'string' ? step : step.text })),
    suitableForDiet: recipe.dietary.vegetarian ? 'https://schema.org/VegetarianDiet' : undefined
  });
}

function renderLocationRoute() {
  const route = routeFromLocation();
  const recipe = route.recipeSlug && RECIPES_DB.find(item => recipeSlug(item) === route.recipeSlug);
  const page = route.recipeSlug && !recipe ? 'not-found' : route.page;
  updateRouteMetadata(page, recipe);
  if (window.resepinApp) {
    window.resepinApp.activePage = page;
    window.resepinApp.floatingChefChatOpen = false;
    window.resepinApp.menuOpen = false;
  }
  showPage(page);
  if (recipe) openRecipeModal(recipe.title, recipe.time, recipe.servings, recipe.ingredients, recipe.steps, { updateRoute: false });
  else {
    closeRecipeModal({ preserveRoute: true });
    restoreRecipeFocus();
    requestAnimationFrame(() => document.getElementById(`page-${page}`)?.focus({ preventScroll: true }));
  }
}

function focusActivePage(event) {
  event?.preventDefault();
  const activePage = document.querySelector('.page.active[role="main"]');
  if (!activePage) return;
  activePage.focus({ preventScroll: true });
  activePage.scrollIntoView({ block: 'start', behavior: 'smooth' });
}
window.focusActivePage = focusActivePage;

function navigateToPage(page, { replace = false } = {}) {
  const route = PAGE_HASHES[page];
  if (!route) return;
  closeRecipeModal({ preserveRoute: true });
  previousRecipeFocus = null;
  const url = new URL(window.location.href);
  if (page === 'home') url.searchParams.delete('bahan');
  const next = `${url.pathname}${url.search}${route}`;
  window.history[replace ? 'replaceState' : 'pushState']({}, '', next);
  renderLocationRoute();
}

window.navigateToPage = navigateToPage;

function showPage(pageId) {
  if (pageId !== 'scan') {
    if (cameraStream) stopCamera();
    else beginScanRequest();
    releaseScanPreview();
  }
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // Show target page
  const target = document.getElementById(`page-${pageId}`);
  if (target) {
    target.classList.add('active');
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) skipLink.href = `#${target.id}`;
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
  toggleMenu(false);

  // Page-specific init
  if (pageId === 'resep') renderRecipesGrid();
  if (pageId === 'jelajahi') renderJelajahiGrid();
  if (pageId === 'tersimpan') renderSavedRecipes();
  if (pageId === 'chef') updateChefBahanBadge();
  requestAnimationFrame(() => window.refreshMotionReveals?.());
}

// Reveal content gently as it enters the viewport, while keeping all text visible without JS.
let motionRevealObserver;
let scrollProgressFrame = 0;
let scrollProgressListenerReady = false;
function updateScrollProgress() {
  if (scrollProgressFrame) return;
  scrollProgressFrame = requestAnimationFrame(() => {
    scrollProgressFrame = 0;
    const progress = document.querySelector('.scroll-progress');
    if (!progress) return;
    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    const amount = scrollableHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollableHeight)) : 0;
    progress.style.transform = `scaleX(${amount})`;
  });
}

function ensureScrollProgress() {
  if (!document.querySelector('.scroll-progress')) {
    const progress = document.createElement('div');
    progress.className = 'scroll-progress';
    progress.setAttribute('aria-hidden', 'true');
    document.body.append(progress);
  }
  if (!scrollProgressListenerReady) {
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    window.addEventListener('resize', updateScrollProgress, { passive: true });
    scrollProgressListenerReady = true;
  }
  updateScrollProgress();
}

window.refreshMotionReveals = function refreshMotionReveals() {
  ensureScrollProgress();
  const targets = document.querySelectorAll('.section-header, .step-card, .recipe-card, .cat-card, .stats-banner, .footer-grid, .jelajahi-section, .scan-layout, .ingredients-panel, .camera-viewport, .ai-cta-card, .chat-container, .profile-card');
  if (!motionRevealObserver) {
    motionRevealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('motion-visible');
          motionRevealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -36px 0px' });
  }
  targets.forEach((element, index) => {
    if (element.classList.contains('motion-ready')) return;
    element.classList.add('motion-ready');
    element.style.setProperty('--motion-delay', `${(index % 5) * 90}ms`);
    motionRevealObserver.observe(element);
  });
};

function toggleMenu(isOpen) {
  const links = document.getElementById('navLinks');
  if (!links) return;
  const shouldOpen = typeof isOpen === 'boolean' ? isOpen : !links.classList.contains('open');
  links.classList.toggle('open', shouldOpen);
}

function applyTheme(theme) {
  const selected = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = selected;
  document.body.dataset.theme = selected;
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.content = selected === 'dark' ? '#1f150c' : '#e1dcc9';
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
  let savedTheme = window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  try { savedTheme = localStorage.getItem('resep-theme') || savedTheme; } catch (_) { /* Use the system theme when storage is unavailable. */ }
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

function initNavHint() {
  const navbar = document.getElementById('navbar');
  const trigger = navbar?.querySelector('.nav-container');
  if (!navbar || !trigger) return;
  navbar.classList.add('nav-hint-visible');
  const dismiss = () => {
    if (navbar.classList.contains('nav-hint-dismissed')) return;
    navbar.classList.add('nav-hint-dismissed');
    trigger.removeEventListener('pointerenter', dismiss);
    trigger.removeEventListener('focusin', dismiss);
    trigger.removeEventListener('touchstart', dismiss);
    trigger.removeEventListener('click', dismiss);
  };
  trigger.addEventListener('pointerenter', dismiss, { once: true });
  trigger.addEventListener('focusin', dismiss, { once: true });
  trigger.addEventListener('touchstart', dismiss, { once: true, passive: true });
  trigger.addEventListener('click', dismiss, { once: true });
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

  if (!window.isSecureContext && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    updateDetectionStatus('idle', 'Kamera butuh koneksi aman (HTTPS). Unggah foto atau tambahkan bahan secara manual.');
    showToast('Kamera hanya tersedia di HTTPS atau localhost.', 'error');
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    const message = 'Kamera tidak tersedia di browser ini. Unggah foto atau tambahkan bahan secara manual.';
    updateDetectionStatus('idle', message);
    showToast('Kamera tidak tersedia. Unggah foto atau input bahan manual.', 'error');
    return;
  }

  const requestId = beginScanRequest();
  try {
    removePhotoDetectedIngredients();
    releaseScanPreview();
    document.getElementById('detectionBoxes')?.replaceChildren();
    document.getElementById('confidenceBar').style.display = 'none';
    btn.textContent = 'Meminta izin...';
    btn.disabled = true;
    updateDetectionStatus('active', 'Meminta izin kamera…');

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    if (requestId !== scanRequestSequence) {
      stream.getTracks().forEach(track => track.stop());
      btn.textContent = 'Buka kamera';
      btn.style.background = '';
      btn.disabled = false;
      return;
    }
    cameraStream = stream;

    feed.srcObject = cameraStream;
    feed.style.display = 'block';
    placeholder.hidden = true;
    overlay.style.display = 'block';

    const captureBtn = document.getElementById('captureBtn');
    captureBtn.disabled = false;

    btn.textContent = 'Matikan kamera';
    btn.style.background = 'linear-gradient(135deg, #27AE60, #1E8449)';
    btn.disabled = false;

    updateDetectionStatus('active', 'Kamera aktif — arahkan ke bahan makanan');

  } catch (err) {
    if (requestId !== scanRequestSequence) return;
    btn.textContent = 'Buka kamera';
    btn.disabled = false;
    const message = ['NotAllowedError', 'PermissionDeniedError'].includes(err?.name)
      ? 'Izin kamera belum diberikan. Unggah foto atau tambahkan bahan secara manual.'
      : 'Kamera tidak dapat digunakan saat ini. Unggah foto atau tambahkan bahan secara manual.';
    updateDetectionStatus('error', message);
    showToast('Kamera tidak aktif. Unggah foto atau input bahan manual.', 'error');
  }
}

function stopCamera({ updateStatus = true } = {}) {
  beginScanRequest();
  cameraStream?.getTracks().forEach(track => track.stop());
  cameraStream = null;
  const feed = document.getElementById('cameraFeed');
  const placeholder = document.getElementById('cameraPlaceholder');
  const overlay = document.getElementById('scanOverlay');
  const button = document.getElementById('startCamBtn');
  const capture = document.getElementById('captureBtn');
  if (feed) { feed.pause(); feed.srcObject = null; feed.style.display = 'none'; }
  if (placeholder && !scanPreviewObjectUrl) placeholder.hidden = false;
  if (overlay) overlay.style.display = scanPreviewObjectUrl ? 'block' : 'none';
  if (capture) capture.disabled = true;
  if (button) { button.textContent = 'Buka kamera'; button.style.background = ''; button.disabled = false; }
  if (updateStatus) updateDetectionStatus('idle', 'Kamera dimatikan. Unggah foto atau tambahkan bahan secara manual.');
}

async function captureAndDetect() {
  const video = document.getElementById('cameraFeed');
  const canvas = document.getElementById('cameraCanvas');
  if (!cameraStream || !video.videoWidth) {
    showToast('Aktifkan kamera sebelum mengambil foto.', 'error');
    return;
  }

  const button = document.getElementById('captureBtn');
  const requestId = beginScanRequest();
  button.disabled = true;
  updateDetectionStatus('active', 'Mendeteksi bahan…');
  const imageScale = Math.min(1, 1600 / Math.max(video.videoWidth, video.videoHeight));
  canvas.width = Math.round(video.videoWidth * imageScale);
  canvas.height = Math.round(video.videoHeight * imageScale);
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  try {
    const imageBlob = await new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Foto tidak bisa disiapkan.')), 'image/jpeg', 0.82);
    });
    await submitPhotoForDetection(imageBlob, canvas.width, canvas.height, 'bahan.jpg', requestId);
  } catch (error) {
    if (requestId === scanRequestSequence) {
      updateDetectionStatus('error', error.message || 'Deteksi gagal. Coba lagi atau tambah bahan manual.');
      showToast(error.message || 'Deteksi bahan gagal.', 'error');
    }
  } finally {
    if (requestId === scanRequestSequence) button.disabled = false;
  }
}

function beginScanRequest() {
  scanRequestSequence += 1;
  activeScanController?.abort();
  activeScanController = null;
  return scanRequestSequence;
}

async function submitPhotoForDetection(imageBlob, width, height, filename, requestId) {
  if (requestId !== scanRequestSequence) return;
  if (imageBlob.size > 3_900_000) throw new Error('Foto tidak bisa diperkecil cukup kecil. Coba gambar lain atau tambah bahan manual.');
  const boxes = document.getElementById('detectionBoxes');
  boxes.replaceChildren();
  updateDetectionStatus('active', 'Mendeteksi bahan…');
  const formData = new FormData();
  formData.append('file', imageBlob, filename);
  const controller = new AbortController();
  let timedOut = false;
  const timeout = window.setTimeout(() => { timedOut = true; controller.abort(); }, 30000);
  activeScanController = controller;
  try {
    const response = await fetch('/api/detect', { method: 'POST', body: formData, signal: controller.signal });
    const result = await response.json().catch(() => ({}));
    if (requestId !== scanRequestSequence) return;
    if (!response.ok) throw new Error(result.detail || 'Server pemindai tidak tersedia. Tambah bahan manual atau coba lagi nanti.');
    const matches = Array.isArray(result.detections) ? result.detections.filter(item =>
      item && typeof item.label === 'string' && Number.isFinite(item.confidence) &&
      Array.isArray(item.bbox) && item.bbox.length === 4 && item.bbox.every(Number.isFinite)
    ) : [];
    removePhotoDetectedIngredients();
    matches.forEach(({ label, confidence, bbox }) => {
      const box = document.createElement('div');
      box.className = 'det-box';
      box.style.cssText = getDetectionBoxStyle(bbox, width, height);
      const caption = document.createElement('div');
      caption.className = 'det-box-label';
      caption.innerHTML = `${ingredientIconHTML(label)} ${escapeHtml(label)} ${Math.round(confidence * 100)}%`;
      box.appendChild(caption);
      boxes.appendChild(box);
      addIngredientItem(label, Math.round(confidence * 100), 'photo');
    });
    if (matches.length) {
      const confidence = Math.round(matches.reduce((sum, item) => sum + item.confidence, 0) / matches.length * 100);
      updateDetectionStatus('detected', `${matches.length} bahan terdeteksi dari foto. Periksa dan koreksi daftar bahan.`);
      showConfidenceBar(confidence);
      showToast('Foto berhasil dipindai.', 'success');
    } else {
      boxes.replaceChildren();
      updateDetectionStatus('error', 'Tidak ada bahan terdeteksi, coba foto lain atau tambah manual.');
    }
  } catch (error) {
    if (requestId !== scanRequestSequence) return;
    const message = timedOut
      ? 'Pemindaian terlalu lama. Coba lagi atau tambah bahan secara manual.'
      : error?.name === 'AbortError'
        ? 'Pemindaian dihentikan. Coba lagi atau tambah bahan secara manual.'
        : error instanceof TypeError
          ? 'Server pemindai tidak tersedia. Coba lagi nanti atau tambah bahan secara manual.'
          : error.message || 'Foto gagal diproses. Coba gambar lain atau tambah bahan manual.';
    updateDetectionStatus('error', message);
    throw new Error(message);
  } finally {
    window.clearTimeout(timeout);
    if (activeScanController === controller) activeScanController = null;
  }
}

async function handleGalleryUpload(input) {
  const file = input.files?.[0];
  if (!file) return;
  input.value = '';
  await processUploadedScanImage(file);
}

async function processUploadedScanImage(file) {
  const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
  const extensionAllowed = /\.(jpe?g|png|webp)$/i.test(file.name || '');
  const mimeAllowed = !file.type || allowedMimeTypes.has(file.type.toLowerCase());
  if (!extensionAllowed || !mimeAllowed) {
    const message = 'Format belum didukung. Pilih gambar JPG, PNG, atau WebP.';
    updateDetectionStatus('error', message);
    showToast(message, 'error');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    const message = 'Ukuran gambar maksimal 5 MB. Pilih file yang lebih kecil.';
    updateDetectionStatus('error', message);
    showToast(message, 'error');
    return;
  }

  if (cameraStream) stopCamera({ updateStatus: false });
  const requestId = beginScanRequest();
  const cameraButton = document.getElementById('startCamBtn');
  if (cameraButton) {
    cameraButton.textContent = 'Buka kamera';
    cameraButton.style.background = '';
    cameraButton.disabled = false;
  }
  removePhotoDetectedIngredients();
  releaseScanPreview({ restorePlaceholder: false });
  const preview = document.getElementById('scanImagePreview');
  const placeholder = document.getElementById('cameraPlaceholder');
  const feed = document.getElementById('cameraFeed');
  const overlay = document.getElementById('scanOverlay');
  const canvas = document.getElementById('cameraCanvas');
  const actions = document.getElementById('scanImageActions');
  scanPreviewObjectUrl = URL.createObjectURL(file);
  preview.alt = `Pratinjau gambar bahan ${file.name}`;
  preview.src = scanPreviewObjectUrl;
  preview.hidden = false;
  placeholder.hidden = true;
  feed.style.display = 'none';
  overlay.style.display = 'block';
  actions.hidden = false;
  document.getElementById('detectionBoxes')?.replaceChildren();
  document.getElementById('confidenceBar').style.display = 'none';
  updateDetectionStatus('active', 'Mendeteksi bahan…');

  try {
    try {
      await waitForImage(preview);
    } catch {
      releaseScanPreview();
      throw new Error('File gambar rusak atau tidak dapat dibaca. Pilih gambar lain atau tambah bahan manual.');
    }
    if (requestId !== scanRequestSequence) return;
    const scale = Math.min(1, 1600 / Math.max(preview.naturalWidth, preview.naturalHeight));
    canvas.width = Math.max(1, Math.round(preview.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(preview.naturalHeight * scale));
    canvas.getContext('2d').drawImage(preview, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Foto tidak bisa disiapkan.')), 'image/jpeg', .82));
    if (requestId !== scanRequestSequence) return;
    await submitPhotoForDetection(blob, canvas.width, canvas.height, 'gambar.jpg', requestId);
  } catch (error) {
    if (requestId !== scanRequestSequence) return;
    const message = error.message || 'Foto tidak dapat dibaca. Coba gambar lain atau tambah bahan manual.';
    updateDetectionStatus('error', message);
    showToast(message, 'error');
  }
}

function waitForImage(image) {
  if (image.complete && image.naturalWidth > 0) return Promise.resolve(image);
  if (typeof image.decode === 'function') return image.decode().then(() => image);
  return new Promise((resolve, reject) => {
    image.addEventListener('load', () => resolve(image), { once: true });
    image.addEventListener('error', () => reject(new Error('File gambar rusak atau tidak dapat dibaca.')), { once: true });
  });
}

function getDetectionBoxStyle(bbox, sourceWidth, sourceHeight) {
  const [x1, y1, x2, y2] = bbox;
  const viewport = document.getElementById('cameraViewport');
  const viewportWidth = viewport?.clientWidth || sourceWidth;
  const viewportHeight = viewport?.clientHeight || sourceHeight;
  const scale = Math.min(viewportWidth / sourceWidth, viewportHeight / sourceHeight);
  const offsetX = (viewportWidth - sourceWidth * scale) / 2;
  const offsetY = (viewportHeight - sourceHeight * scale) / 2;
  const left = offsetX + x1 * scale;
  const top = offsetY + y1 * scale;
  const width = Math.max(0, (x2 - x1) * scale);
  const height = Math.max(0, (y2 - y1) * scale);
  return `left:${left / viewportWidth * 100}%;top:${top / viewportHeight * 100}%;width:${width / viewportWidth * 100}%;height:${height / viewportHeight * 100}%`;
}

function removePhotoDetectedIngredients() {
  const remaining = detectedIngredients.filter(item => item.source !== 'photo');
  if (remaining.length === detectedIngredients.length) return;
  detectedIngredients = remaining;
  renderIngredientList();
  updateIngredientCount();
}

function releaseScanPreview({ restorePlaceholder = true } = {}) {
  if (scanPreviewObjectUrl) URL.revokeObjectURL(scanPreviewObjectUrl);
  scanPreviewObjectUrl = null;
  const preview = document.getElementById('scanImagePreview');
  if (preview) { preview.removeAttribute('src'); preview.hidden = true; }
  const actions = document.getElementById('scanImageActions');
  if (actions) actions.hidden = true;
  document.getElementById('cameraViewport')?.classList.remove('is-drop-target');
  scanDropDepth = 0;
  if (!cameraStream) {
    const overlay = document.getElementById('scanOverlay');
    if (overlay) overlay.style.display = 'none';
    if (restorePlaceholder) {
      const placeholder = document.getElementById('cameraPlaceholder');
      if (placeholder) placeholder.hidden = false;
    }
  }
}

function clearScanImage() {
  beginScanRequest();
  removePhotoDetectedIngredients();
  document.getElementById('detectionBoxes')?.replaceChildren();
  document.getElementById('confidenceBar').style.display = 'none';
  releaseScanPreview();
  updateDetectionStatus('idle', 'Gambar dihapus. Ambil foto, unggah gambar, atau tambah bahan manual.');
}

function bindScanUploadInteractions() {
  const viewport = document.getElementById('cameraViewport');
  const fileInput = document.getElementById('galleryIngredientUpload');
  if (!viewport || !fileInput || viewport.dataset.uploadBound === 'true') return;
  viewport.dataset.uploadBound = 'true';
  document.getElementById('uploadImageBtn')?.addEventListener('click', () => fileInput.click());
  document.getElementById('replaceScanImageBtn')?.addEventListener('click', () => fileInput.click());
  document.getElementById('clearScanImageBtn')?.addEventListener('click', clearScanImage);
  viewport.addEventListener('dragenter', event => {
    event.preventDefault();
    scanDropDepth += 1;
    viewport.classList.add('is-drop-target');
  });
  viewport.addEventListener('dragover', event => {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  });
  viewport.addEventListener('dragleave', event => {
    event.preventDefault();
    scanDropDepth = Math.max(0, scanDropDepth - 1);
    if (!scanDropDepth) viewport.classList.remove('is-drop-target');
  });
  viewport.addEventListener('drop', event => {
    event.preventDefault();
    scanDropDepth = 0;
    viewport.classList.remove('is-drop-target');
    const file = [...(event.dataTransfer?.files || [])].find(item => item.type.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(item.name));
    if (file) processUploadedScanImage(file);
    else {
      const message = 'Lepas gambar JPG, PNG, atau WebP di area pratinjau.';
      updateDetectionStatus('error', message);
      showToast(message, 'error');
    }
  });
}

async function checkScanBackendAvailability() {
  const requestSequenceAtStart = scanRequestSequence;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  let ready = false;
  try {
    for (const endpoint of ['/api/health', '/api/detect']) {
      try {
        const response = await fetch(endpoint, { method: 'GET', cache: 'no-store', signal: controller.signal });
        if (!response.ok) continue;
        const result = await response.json().catch(() => ({}));
        if (result.ready === true) { ready = true; break; }
      } catch (_) {
        if (controller.signal.aborted) break;
      }
    }
  } finally {
    clearTimeout(timeout);
  }
  scanBackendAvailable = ready;
  const statusMessage = ready
    ? 'Pemindai foto tersedia. Gunakan kamera, unggah gambar, atau tambah bahan manual.'
    : 'Server pemindai belum merespons. Kamu tetap bisa unggah gambar atau tambah bahan manual.';
  const description = document.getElementById('scanAvailabilityNote');
  if (description) description.textContent = ready
    ? 'Foto akan diperiksa oleh model bahan yang tersedia di server. Periksa hasilnya dan lengkapi daftar secara manual.'
    : 'Kamera dan unggah gambar tetap tersedia. Jika server pemindai belum siap, bahan bisa ditambahkan secara manual.';
  if (requestSequenceAtStart === scanRequestSequence && document.getElementById('detectionStatus')?.dataset.state !== 'active') {
    updateDetectionStatus(ready ? 'idle' : 'unavailable', statusMessage);
  }
  return ready;
}

function updateDetectionStatus(type, message) {
  const el = document.getElementById('detectionStatus');
  if (!el) return;
  const dotClass = type === 'active' ? 'active' : type === 'detected' ? 'detected' : type === 'error' ? 'error' : 'idle';
  el.dataset.state = type;
  document.getElementById('scanOverlay')?.classList.toggle('is-detecting', type === 'active');
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
function addIngredientItem(name, conf, source = 'manual') {
  const cleanName = String(name || '').trim().replace(/\s+/g, ' ');
  if (!cleanName || detectedIngredients.some(i => i.name.toLocaleLowerCase('id') === cleanName.toLocaleLowerCase('id'))) return;

  const ingredient = { name: cleanName, conf, source };
  detectedIngredients.push(ingredient);

  renderIngredientList();
  updateIngredientCount();
}

function addIngredient(label) {
  const name = String(label || '').trim().replace(/\s+/g, ' ');
  if (!name) return;
  addIngredientItem(name, null);
  showToast(`${name} ditambahkan!`, 'success');
}

function addManualIngredient() {
  const input = document.getElementById('manualIngredientInput');
  const val = input.value.trim().replace(/\s+/g, ' ');
  if (!val) return;

  addIngredientItem(val, null);
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
    emoji.innerHTML = ingredientIconHTML(item.name);
    const info = document.createElement('div');
    info.className = 'ing-info';
    const name = document.createElement('span');
    name.className = 'ing-name';
    name.textContent = item.name;
    const confidence = document.createElement('span');
    confidence.className = 'ing-conf';
    confidence.textContent = item.source === 'photo' ? 'Terdeteksi dari foto' : 'Diinput manual';
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
    <p>Ambil foto, unggah gambar, atau tambah bahan secara manual.</p>
  `;
  return div;
}

function updateIngredientCount() {
  const count = detectedIngredients.length;
  document.getElementById('ingredientCount').textContent = `${count} bahan`;
  document.getElementById('ingredientCountBtn').textContent = count;

  const findBtn = document.getElementById('findRecipesBtn');
  findBtn.disabled = count === 0;
  findBtn.innerHTML = `<svg class="ui-icon" aria-hidden="true"><use href="#ui-icon-pot"/></svg> Cari Resep (<span id="ingredientCountBtn">${count}</span> bahan)`;
}

// ============================================================
// RECIPES GRID
// ============================================================
function recipeIngredientMatches(ingredient, term) {
  return window.ResepinRecipeUtils?.textMatches(ingredient, term) || false;
}

function currentIngredientNames() {
  const urlIngredients = new URLSearchParams(window.location.search).getAll('bahan').map(value => value.trim()).filter(Boolean);
  if (urlIngredients.length) return urlIngredients;
  const input = document.getElementById('recipeSearch')?.value?.trim() || '';
  const queryItems = input.split(/[,;\n]+/).map(value => value.trim()).filter(Boolean);
  if (queryItems.length > 1 || (queryItems.length === 1 && RECIPES_DB.some(recipe => recipe.ingredients.some(ingredient => recipeIngredientMatches(ingredient, queryItems[0]))))) return queryItems;
  return detectedIngredients.map(item => item.name);
}

function assumedStapleNames() {
  if (!assumePantryBasics) return [];
  return ['garam', 'gula', 'minyak', 'air', 'merica', 'lada', 'bawang putih', 'bawang merah'];
}

function recipeMatch(recipe, available = currentIngredientNames()) {
  return window.ResepinRecipeUtils?.calculateRecipeMatch(recipe, available, assumedStapleNames()) || { matched: 0, total: recipe.ingredients.length, percentage: 0, missing: recipe.ingredients };
}

function setAssumePantryBasics(enabled) {
  assumePantryBasics = Boolean(enabled);
  try { localStorage.setItem('resep-assume-pantry-basics', String(assumePantryBasics)); } catch (_) { /* Keep the current page preference for this session. */ }
  renderRecipesGrid();
}

function setRecipeSort(sortBy) {
  currentRecipeSort = ['fastest', 'cheapest'].includes(sortBy) ? sortBy : 'match';
  renderRecipesGrid();
}

function clearRecipeFilters() {
  currentFilter = 'all';
  currentDietFilter = 'all';
  currentBudgetFilter = null;
  currentRecipeSort = 'match';
  assumePantryBasics = true;
  try { localStorage.setItem('resep-assume-pantry-basics', 'true'); } catch (_) { /* Keep the reset for this page view. */ }
  const search = document.getElementById('recipeSearch');
  const pantry = document.getElementById('assumePantryBasics');
  const sort = document.getElementById('recipeSort');
  if (search) search.value = '';
  if (pantry) pantry.checked = true;
  if (sort) sort.value = 'match';
  document.querySelectorAll('#basicRecipeFilters .filter-chip, [aria-label="Filter kebutuhan makan"] .filter-chip, [aria-label="Filter perkiraan biaya per porsi"] .filter-chip').forEach(button => {
    button.classList.remove('active');
    button.setAttribute('aria-pressed', 'false');
  });
  const allButton = document.querySelector('#basicRecipeFilters .filter-chip');
  allButton?.classList.add('active');
  allButton?.setAttribute('aria-pressed', 'true');
  const url = new URL(window.location.href);
  url.searchParams.delete('bahan');
  window.history.replaceState(window.history.state, '', url);
  renderRecipesGrid();
}

function renderRecipesGrid() {
  const grid = document.getElementById('recipesGrid');
  if (!grid) return;
  const query = document.getElementById('recipeSearch')?.value?.trim() || '';
  const searchTerms = query.split(/[,;\n]+/).map(term => term.trim()).filter(Boolean);
  const ingredientQuery = currentIngredientNames();
  let filtered = RECIPES_DB;

  // Query parameters from the hero match any selected ingredient in the recipe data.
  if (ingredientQuery.length) {
    filtered = filtered.filter(recipe => window.ResepinRecipeUtils?.matchesAnyIngredient(recipe, ingredientQuery));
  } else if (searchTerms.length) {
    // Comma-separated ingredient queries match any term; ordinary text remains a single term.
    filtered = filtered.filter(recipe => searchTerms.some(term =>
      recipeIngredientMatches(recipe.title, term) ||
      recipe.tags.some(tag => recipeIngredientMatches(tag, term)) ||
      recipe.ingredients.some(ingredient => recipeIngredientMatches(ingredient, term))
    ));
  }

  if (currentDietFilter !== 'all') {
    filtered = filtered.filter(recipe => {
      if (currentDietFilter === 'vegetarian') return recipe.dietary.vegetarian;
      if (currentDietFilter === 'no-egg') return !recipe.dietary.contains.includes('telur');
      if (currentDietFilter === 'no-seafood') return !recipe.dietary.contains.some(item => ['ikan', 'udang'].includes(item));
      if (currentDietFilter === 'no-peanut') return !recipe.dietary.contains.includes('kacang');
      return true;
    });
  }
  if (currentBudgetFilter) filtered = filtered.filter(recipe => recipe.estimatedCostPerServingIDR <= currentBudgetFilter);
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

  filtered = window.ResepinRecipeUtils?.sortRecipes(filtered, currentRecipeSort, ingredientQuery, assumedStapleNames()) || filtered;

  const status = document.getElementById('recipeResultsStatus');
  const sortDescriptions = { match: 'kecocokan tertinggi', fastest: 'waktu tercepat', cheapest: 'biaya terendah' };
  if (status) status.textContent = `${filtered.length} resep ditemukan, diurutkan berdasarkan ${sortDescriptions[currentRecipeSort] || sortDescriptions.match}${ingredientQuery.length ? ' dengan bahan yang tersedia' : ''}.`;
  const clearButton = document.getElementById('clearRecipeFilters');
  const activeQuery = Boolean(document.getElementById('recipeSearch')?.value?.trim());
  const hasIngredientParams = new URLSearchParams(window.location.search).has('bahan');
  if (clearButton) clearButton.hidden = !(activeQuery || hasIngredientParams || currentFilter !== 'all' || currentDietFilter !== 'all' || currentBudgetFilter !== null || currentRecipeSort !== 'match' || !assumePantryBasics);
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

function ingredientDisplayName(value) {
  return window.ResepinRecipeUtils?.getIngredientName(value)?.replace(/^\p{Extended_Pictographic}+(?:\uFE0F)?\s*/u, '').trim() || String(value || '').trim();
}

function ingredientIconHTML(name) {
  const normalized = window.ResepinRecipeUtils?.normalizeIngredient(name) || String(name).toLocaleLowerCase('id');
  const icon = /tempe/.test(normalized) ? 'tempe'
    : /telur/.test(normalized) ? 'egg'
      : /tahu/.test(normalized) ? 'tofu'
        : /ayam|daging|sapi|babi/.test(normalized) ? 'chicken'
          : /nasi|beras/.test(normalized) ? 'rice'
            : /mi |mie|soun|spaghetti|pasta/.test(`${normalized} `) ? 'noodles'
              : /jagung/.test(normalized) ? 'corn'
                : /wortel/.test(normalized) ? 'carrot'
                  : /bawang/.test(normalized) ? 'onion'
                    : /cabai|cabe|lombok/.test(normalized) ? 'chili'
                      : /ikan|udang|teri|terasi/.test(normalized) ? 'fish'
                        : /kacang|buncis/.test(normalized) ? 'bean'
                          : /sayur|daun|bayam|kangkung|kol|sawi|selada|brokoli|tauge|paprika/.test(normalized) ? 'leaf' : 'food';
  return `<svg class="ui-icon ingredient-icon" aria-hidden="true"><use href="#ui-icon-${icon}"/></svg>`;
}

function recipeIconHTML(recipe) {
  return ingredientIconHTML(ingredientDisplayName(recipe?.ingredients?.[0] || recipe?.title || ''));
}

// Use one calm illustration when a food photograph is unavailable or fails.
function recipeImageHTML(recipe, className, altText) {
  const src = getRecipeImage(recipe);
  const alt = altText || (recipe ? `Foto hidangan ${recipe.title}` : 'Foto hidangan');
  if (!src) return `<span class="${className} recipe-img-fallback" role="img" aria-label="${escapeHtml(alt)}"><svg class="ui-icon" aria-hidden="true"><use href="#ui-icon-food"/></svg></span>`;
  const objectPosition = recipe?.imagePosition || 'center';
  const image = `<img class="${className}" src="${src}" alt="${escapeHtml(alt)}" width="800" height="600" style="object-position:${objectPosition}" loading="lazy" decoding="async" data-fallback="dish" />`;
  if (recipe && RECIPE_WEBP_IDS.has(recipe.id)) {
    return `<picture class="recipe-picture ${className}-picture"><source srcset="${src.replace(/\.jpe?g$/i, '.webp')}" type="image/webp" />${image}</picture>`;
  }
  return image;
}

// Pasang fallback emoji untuk foto yang gagal dimuat (dipasang sekali per render)
function bindRecipeImageFallbacks(root = document) {
  root.querySelectorAll('img[data-fallback]').forEach(img => {
    const markLoaded = () => img.closest('.recipe-img')?.classList.add('image-loaded');
    img.addEventListener('load', markLoaded, { once: true });
    if (img.complete && img.naturalWidth > 0) markLoaded();
    img.addEventListener('error', function handleError() {
      const span = document.createElement('span');
      span.className = `${img.className} recipe-img-fallback`;
      span.setAttribute('role', 'img');
      span.setAttribute('aria-label', img.alt || 'Foto hidangan tidak tersedia');
      span.innerHTML = '<svg class="ui-icon" aria-hidden="true"><use href="#ui-icon-food"/></svg>';
      img.replaceWith(span);
      span.closest('.recipe-img')?.classList.add('image-loaded');
    }, { once: true });
  });
}

function createRecipeCardHTML(r, { keepCurrentPage = false } = {}) {
  const recipeIndex = RECIPES_DB.indexOf(r);
  const ingredientCount = Array.isArray(r.ingredients) ? r.ingredients.length : null;
  const available = currentIngredientNames();
  const match = recipeMatch(r, available);
  const missing = match.missing.slice(0, 3).join(', ');
  const cost = window.ResepinRecipeUtils?.formatIDR(r.estimatedCostPerServingIDR) || '';
  return `
    <a class="recipe-card" href="#/resep/${recipeSlug(r)}" aria-label="Lihat resep ${escapeHtml(r.title)}. Kamu punya ${match.matched} dari ${match.total} bahan." onclick="event.preventDefault();${keepCurrentPage ? 'openFeaturedRecipeByIndex' : 'openRecipeByIndex'}(${recipeIndex})">
      <div class="recipe-img" style="background:${r.gradient}">
        ${recipeImageHTML(r, 'recipe-img-photo')}
        <span class="recipe-card-action" aria-hidden="true"><span class="recipe-card-action-label">Intip resep</span><span class="recipe-card-action-arrow">↗</span></span>
      </div>
      <div class="recipe-badge-diff ${r.difficulty === 'Mudah' ? 'easy' : 'medium'}">${r.difficulty}</div>
      <div class="recipe-info">
        <h3>${escapeHtml(r.title)}</h3>
        <p class="recipe-meta"><span><svg class="ui-icon" aria-hidden="true"><use href="#ui-icon-clock"/></svg>${escapeHtml(r.time)}</span><span class="recipe-cost-estimate">Est. ${cost}/porsi</span></p>
        <div class="recipe-match" aria-label="Kecocokan bahan: ${match.matched} dari ${match.total}">
          <div class="recipe-match-label"><strong>Kamu punya ${match.matched}/${match.total} bahan</strong><span>${Math.round(match.percentage * 100)}%</span></div>
          <div class="recipe-match-track" role="progressbar" aria-valuemin="0" aria-valuemax="${match.total}" aria-valuenow="${match.matched}" aria-label="Kecocokan bahan"><span style="width:${Math.round(match.percentage * 100)}%"></span></div>
          ${available.length && missing ? `<p>Kurang: ${escapeHtml(missing)}${match.missing.length > 3 ? ' +' + (match.missing.length - 3) : ''}</p>` : ''}
          ${!available.length ? '<p>Tambahkan bahan untuk melihat kecocokan.</p>' : ''}
        </div>
      </div>
    </a>
  `;
}

function renderFeaturedRecipes() {
  const list = document.querySelector('.featured-recipes .recipes-scroll');
  if (!list) return;
  list.innerHTML = RECIPES_DB.slice(0, 6).map(recipe => createRecipeCardHTML(recipe, { keepCurrentPage: true })).join('');
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
  document.querySelectorAll('#basicRecipeFilters .filter-chip').forEach(c => {
    const active = c === el;
    c.classList.toggle('active', active);
    c.setAttribute('aria-pressed', String(active));
  });
  renderRecipesGrid();
}

function setDietFilter(filter, el) {
  currentDietFilter = currentDietFilter === filter ? 'all' : filter;
  document.querySelectorAll('[aria-label="Filter kebutuhan makan"] .filter-chip').forEach(button => {
    const active = button === el && currentDietFilter !== 'all';
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  renderRecipesGrid();
}

function setBudgetFilter(amount, el) {
  currentBudgetFilter = currentBudgetFilter === amount ? null : amount;
  document.querySelectorAll('[aria-label="Filter perkiraan biaya per porsi"] .filter-chip').forEach(button => {
    const active = button === el && currentBudgetFilter !== null;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
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
function openRecipeModal(title, time, servings, ingredients, steps, { updateRoute = true } = {}) {
  const modal = document.getElementById('recipeModal');
  if (!modal.classList.contains('open')) previousRecipeFocus = document.activeElement;
  const recipe = RECIPES_DB.find(r => r.title === title);
  if (updateRoute && recipe) {
    if (!document.getElementById('page-resep')?.classList.contains('active')) {
      if (window.resepinApp) window.resepinApp.activePage = 'resep';
      showPage('resep');
    }
    const nextHash = `#/resep/${recipeSlug(recipe)}`;
    if (window.location.hash !== nextHash) {
      window.history.pushState({ recipeModal: true }, '', `${window.location.pathname}${window.location.search}${nextHash}`);
    }
    updateRouteMetadata('resep', recipe);
  }
  document.getElementById('modalTitle').textContent = title;
  activeModalRecipe = recipe;
  activeModalServings = recipe?.servingsCount || Number.parseInt(servings, 10) || 1;
  document.getElementById('modalMeta').innerHTML = `
    <span><svg class="ui-icon" aria-hidden="true"><use href="#ui-icon-clock"/></svg>${time}</span>
    <span><svg class="ui-icon" aria-hidden="true"><use href="#ui-icon-users"/></svg>${servings}</span>
    ${recipe?.difficulty ? `<span>${escapeHtml(recipe.difficulty)}</span>` : ''}
    ${recipe ? `<span class="recipe-cost-estimate">Est. ${window.ResepinRecipeUtils?.formatIDR(recipe.estimatedCostPerServingIDR) || ''}/porsi</span>` : ''}
  `;

  if (recipe) {
    const match = recipeMatch(recipe);
    const summary = document.getElementById('modalMatchSummary');
    if (summary) summary.innerHTML = `<strong>Kamu punya ${match.matched}/${match.total} bahan</strong><div class="recipe-match-track" role="progressbar" aria-valuemin="0" aria-valuemax="${match.total}" aria-valuenow="${match.matched}"><span style="width:${Math.round(match.percentage * 100)}%"></span></div>${match.missing.length ? `<p>Kurang: ${escapeHtml(match.missing.join(', '))}</p>` : '<p>Semua bahan cocok dengan daftar yang tersedia.</p>'}`;
    const servingControl = document.getElementById('modalServingsControl');
    const hasQuantities = recipe.ingredientDetails?.some(item => Number.isFinite(item.amount));
    if (servingControl) servingControl.hidden = !hasQuantities;
    if (hasQuantities) document.getElementById('modalServingsValue').textContent = activeModalServings;
  }

  if (recipe) updatePersonalStats({ recipesOpened: 1 });
  const hero = document.getElementById('modalHero');
  const heroMedia = document.getElementById('modalHeroMedia');
  const photoSrc = getRecipeImage(recipe);
  if (photoSrc) {
    heroMedia.innerHTML = `<img class="modal-hero-photo" src="${photoSrc}" alt="${title}" onerror="this.style.display='none';document.getElementById('modalHeroEmoji').style.display='flex'" />`;
    document.getElementById('modalHeroEmoji').style.display = 'none';
  } else {
    heroMedia.innerHTML = '';
    const heroEmoji = document.getElementById('modalHeroEmoji');
    heroEmoji.style.display = 'flex';
  }
  const heroEmoji = document.getElementById('modalHeroEmoji');
  heroEmoji.innerHTML = recipeIconHTML(recipe || { ingredients });
  hero.style.background = recipe?.gradient || 'linear-gradient(135deg, var(--bg-surface), var(--bg-card))';

  document.getElementById('modalIngredients').innerHTML = ingredients.map((ing, index) => {
    const detected = currentIngredientNames().some(value => recipeIngredientMatches(ing, value)) || assumedStapleNames().some(value => recipeIngredientMatches(ing, value));
    const details = recipe?.ingredientDetails?.[index];
    const amount = details && Number.isFinite(details.amount) ? `${window.ResepinRecipeUtils.scaleQuantity(details.amount, recipe.servingsCount, activeModalServings)} ${details.unit} ` : '';
    const displayName = details?.name || ingredientDisplayName(ing);
    return `<li class="checklist-item${detected ? ' is-available' : ''}"><label><input type="checkbox" aria-label="Tandai ${escapeHtml(displayName)} sudah disiapkan" onchange="updateIngredientChecklist()" /><span>${ingredientIconHTML(displayName)}${amount}${escapeHtml(displayName)}${detected ? ' <small>(tersedia)</small>' : ''}</span></label></li>`;
  }).join('');
  updateIngredientChecklist();

  document.getElementById('modalSteps').innerHTML = steps.map(s => `<li>${escapeHtml(typeof s === 'string' ? s : s.text || '')}</li>`).join('');

  const ingredientName = ingredientDisplayName(ingredients[0]).toLowerCase();
  const tip = findAITip(ingredientName);
  document.getElementById('modalTip').textContent = tip;
  const favoriteButton = document.getElementById('saveRecipeButton');
  if (favoriteButton) favoriteButton.textContent = recipe && readFavoriteRecipeIds().includes(recipe.id) ? 'Hapus dari Favorit' : 'Simpan Resep';

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  modal.querySelector('.modal-close')?.focus();
}

function restoreRecipeFocus() {
  if (!previousRecipeFocus?.isConnected) return;
  const activePage = previousRecipeFocus.closest('.page');
  if (activePage && !activePage.classList.contains('active')) return;
  previousRecipeFocus.focus();
  previousRecipeFocus = null;
}

function updateIngredientChecklist() {
  const items = [...document.querySelectorAll('#modalIngredients input[type="checkbox"]')];
  const checked = items.filter(item => item.checked).length;
  const progress = document.getElementById('checklistProgress');
  if (progress) progress.textContent = `${checked}/${items.length} disiapkan`;
}

function changeRecipeServings(delta) {
  if (!activeModalRecipe?.ingredientDetails?.some(item => Number.isFinite(item.amount))) return;
  activeModalServings = Math.max(1, Math.min(12, activeModalServings + delta));
  document.getElementById('modalServingsValue').textContent = activeModalServings;
  const list = document.getElementById('modalIngredients');
  list.innerHTML = activeModalRecipe.ingredients.map((ingredient, index) => {
    const detail = activeModalRecipe.ingredientDetails[index];
    const scaled = Number.isFinite(detail?.amount) ? window.ResepinRecipeUtils.scaleQuantity(detail.amount, activeModalRecipe.servingsCount, activeModalServings) : null;
    const quantity = scaled === null ? '' : `${scaled} ${detail.unit} `;
    return `<li class="checklist-item"><label><input type="checkbox" aria-label="Tandai ${escapeHtml(detail?.name || ingredient)} sudah disiapkan" onchange="updateIngredientChecklist()" /><span>${quantity}${escapeHtml(ingredient)}</span></label></li>`;
  }).join('');
  updateIngredientChecklist();
}

async function startCookingMode() {
  if (!activeModalRecipe?.steps?.length) return;
  activeCookingStep = 0;
  const mode = document.getElementById('cookingMode');
  mode.hidden = false;
  document.body.style.overflow = 'hidden';
  renderCookingStep();
  document.querySelector('.cooking-close')?.focus();
  if ('wakeLock' in navigator) {
    try { cookingWakeLock = await navigator.wakeLock.request('screen'); }
    catch (_) { document.getElementById('cookingTimerNote').textContent = 'Layar bisa terkunci otomatis; ketuk layar untuk tetap melihat langkah.'; }
  }
}

function renderCookingStep() {
  const steps = activeModalRecipe?.steps || [];
  const step = steps[activeCookingStep];
  if (!step) return;
  const text = typeof step === 'string' ? step : step.text || '';
  const seconds = typeof step === 'object' ? Number(step.timerSeconds) : 0;
  document.getElementById('cookingModeTitle').textContent = `Langkah ${activeCookingStep + 1} dari ${steps.length}`;
  document.getElementById('cookingStepText').textContent = text;
  document.getElementById('cookingPrevious').disabled = activeCookingStep === 0;
  document.getElementById('cookingNext').textContent = activeCookingStep === steps.length - 1 ? 'Selesai' : 'Langkah berikutnya';
  const timer = document.getElementById('cookingTimerButton');
  timer.hidden = !(seconds > 0);
  timer.dataset.seconds = seconds > 0 ? seconds : '';
  document.getElementById('cookingTimerNote').textContent = seconds > 0 ? `Timer langkah: ${Math.ceil(seconds / 60)} menit.` : 'Belum ada timer untuk langkah ini.';
  clearInterval(cookingTimerInterval);
}

function startCookingTimer() {
  const button = document.getElementById('cookingTimerButton');
  let remaining = Number(button.dataset.seconds);
  if (!remaining) return;
  button.disabled = true;
  clearInterval(cookingTimerInterval);
  const update = () => {
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    button.textContent = `${minutes}:${String(seconds).padStart(2, '0')}`;
    if (remaining <= 0) {
      clearInterval(cookingTimerInterval);
      button.textContent = 'Timer selesai';
      button.disabled = false;
      showToast('Timer langkah memasak selesai.', 'success');
      return;
    }
    remaining -= 1;
  };
  update();
  cookingTimerInterval = setInterval(update, 1000);
}

function moveCookingStep(delta) {
  const next = activeCookingStep + delta;
  if (next < 0) return;
  if (next >= activeModalRecipe.steps.length) { closeCookingMode(); return; }
  activeCookingStep = next;
  renderCookingStep();
}

function closeCookingMode() {
  document.getElementById('cookingMode').hidden = true;
  clearInterval(cookingTimerInterval);
  cookingWakeLock?.release?.().catch?.(() => {});
  cookingWakeLock = null;
  document.body.style.overflow = document.getElementById('recipeModal').classList.contains('open') ? 'hidden' : '';
  document.querySelector('#recipeModal .modal-close')?.focus();
}

function openRecipeByIndex(index) {
  const recipe = RECIPES_DB[index];
  if (!recipe) return;
  openRecipeModal(recipe.title, recipe.time, recipe.servings, recipe.ingredients, recipe.steps);
}

function openFeaturedRecipeByIndex(index) {
  const recipe = RECIPES_DB[index];
  if (!recipe) return;
  openRecipeModal(recipe.title, recipe.time, recipe.servings, recipe.ingredients, recipe.steps, { updateRoute: false });
}

function findAITip(ingredientName) {
  for (const [key, val] of Object.entries(AI_RESPONSES.keywords)) {
    if (ingredientName.includes(key)) return val.tip;
  }
  return AI_RESPONSES.keywords.default.tip;
}

function closeRecipeModal({ preserveRoute = false } = {}) {
  if (!document.getElementById('cookingMode')?.hidden) closeCookingMode();
  document.getElementById('recipeModal').classList.remove('open');
  document.body.style.overflow = '';
  if (!preserveRoute && /^#\/resep\//.test(window.location.hash)) {
    if (window.history.state?.recipeModal) window.history.back();
    else {
      window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}#/resep`);
      updateRouteMetadata('resep', null);
      restoreRecipeFocus();
    }
  } else if (!preserveRoute) restoreRecipeFocus();
}

function trapRecipeModalFocus(event) {
  const cooking = document.getElementById('cookingMode');
  const scope = cooking && !cooking.hidden ? cooking : document.querySelector('#recipeModal .modal-content');
  if (!scope || event.key !== 'Tab') return;
  const focusable = [...scope.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')];
  if (!focusable.length) { event.preventDefault(); scope.focus(); return; }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  else if (!scope.contains(document.activeElement)) { event.preventDefault(); first.focus(); }
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
  const button = document.getElementById('saveRecipeButton');
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
    if (!document.getElementById('cookingMode')?.hidden) { closeCookingMode(); return; }
    closeRecipeModal();
    if (window.resepinApp) window.resepinApp.menuOpen = false;
    toggleMenu(false);
    return;
  }
  if (document.getElementById('recipeModal')?.classList.contains('open')) trapRecipeModalFocus(e);
});

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  bindScanUploadInteractions();
  window.addEventListener('pagehide', () => {
    beginScanRequest();
    cameraStream?.getTracks().forEach(track => track.stop());
    cameraStream = null;
    releaseScanPreview();
  }, { once: true });
  window.addEventListener('popstate', renderLocationRoute);
  window.addEventListener('hashchange', renderLocationRoute);
  initTheme();
  try { assumePantryBasics = localStorage.getItem('resep-assume-pantry-basics') !== 'false'; } catch (_) { /* Keep the default pantry assumption for this session. */ }
  const pantryToggle = document.getElementById('assumePantryBasics');
  if (pantryToggle) pantryToggle.checked = assumePantryBasics;
  initQuickPromptDragging();
  initParticles();
  initScrollEffects();
  initNavHint();
  const initialScanCheckSequence = scanRequestSequence;
  checkScanBackendAvailability().catch(() => {
    if (initialScanCheckSequence !== scanRequestSequence || document.getElementById('detectionStatus')?.dataset.state === 'active') return;
    scanBackendAvailable = false;
    const description = document.getElementById('scanAvailabilityNote');
    if (description) description.textContent = 'Kamera dan unggah gambar tetap tersedia. Jika server pemindai belum siap, bahan bisa ditambahkan secara manual.';
    updateDetectionStatus('unavailable', 'Server pemindai belum merespons. Kamu tetap bisa unggah gambar atau tambah bahan manual.');
  });
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
  // Featured cards are created after the first reveal scan above. Register them
  // once they are in the DOM so refresh/reload gets the same scroll animation.
  requestAnimationFrame(() => window.refreshMotionReveals?.());
  setTimeout(() => {
    renderJelajahiGrid();
    requestAnimationFrame(() => window.refreshMotionReveals?.());
  }, 100);

  let swipeStartX = null;
  const cookingMode = document.getElementById('cookingMode');
  cookingMode?.addEventListener('touchstart', event => { swipeStartX = event.changedTouches[0]?.clientX ?? null; }, { passive: true });
  cookingMode?.addEventListener('touchend', event => {
    const endX = event.changedTouches[0]?.clientX;
    if (swipeStartX === null || endX === undefined) return;
    const distance = endX - swipeStartX;
    if (Math.abs(distance) > 70) moveCookingStep(distance < 0 ? 1 : -1);
    swipeStartX = null;
  }, { passive: true });
});
