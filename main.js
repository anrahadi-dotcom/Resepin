/* ============================
   RESEPIN — app.js
   Complete SPA JavaScript
   ============================ */

// ============================================================
// DATA: Recipe Database
// ============================================================
const RECIPES_DB = [
  {
    id: 1,
    title: "Sup Jagung Wortel",
    emoji: "🌽🥕",
    gradient: "linear-gradient(135deg,#e67e22,#f39c12)",
    time: "20 mnt",
    servings: "2 Porsi",
    calories: "180 kal",
    difficulty: "Mudah",
    tags: ["Zero Waste", "Sehat", "Berkuah"],
    ingredients: ["🌽 Jagung", "🥕 Wortel", "🧅 Bawang Merah", "🧄 Bawang Putih", "🧂 Garam"],
    steps: ["Potong jagung dan wortel ukuran sedang", "Tumis bawang merah dan bawang putih hingga harum", "Masukkan wortel dan jagung, aduk rata", "Tuang air 500ml, masak hingga mendidih", "Beri garam dan merica secukupnya, sajikan hangat"]
  },
  {
    id: 2,
    title: "Nasi Goreng Sederhana",
    emoji: "🍚🥚",
    gradient: "linear-gradient(135deg,#8e44ad,#9b59b6)",
    time: "15 mnt",
    servings: "1 Porsi",
    calories: "320 kal",
    difficulty: "Mudah",
    tags: ["Sarapan", "Cepat"],
    ingredients: ["🍚 Nasi", "🥚 Telur", "🧅 Bawang", "🌶️ Cabai", "🫙 Kecap Manis"],
    steps: ["Siapkan nasi yang sudah dingin (lebih baik dari kemarin)", "Goreng telur orak-arik setengah matang", "Masukkan bawang dan cabai, tumis hingga harum", "Masukkan nasi, aduk rata dengan api besar", "Tambahkan kecap manis, garam, dan lada secukupnya"]
  },
  {
    id: 3,
    title: "Tumis Kangkung Terasi",
    emoji: "🥬🌶️",
    gradient: "linear-gradient(135deg,#27ae60,#2ecc71)",
    time: "10 mnt",
    servings: "2 Porsi",
    calories: "95 kal",
    difficulty: "Mudah",
    tags: ["Sayur", "Cepat", "Sehat"],
    ingredients: ["🥬 Kangkung", "🧄 Bawang Putih", "🌶️ Cabai", "🦐 Terasi", "🧂 Garam"],
    steps: ["Cuci bersih kangkung, petik daunnya saja", "Geprek bawang putih, iris cabai serong", "Tumis bawang dan cabai dengan sedikit minyak", "Masukkan terasi, hancurkan sambil ditumis", "Masukkan kangkung, masak 2 menit, sajikan segera"]
  },
  {
    id: 4,
    title: "Tempe Orek Pedas",
    emoji: "🧱🌶️",
    gradient: "linear-gradient(135deg,#e74c3c,#c0392b)",
    time: "25 mnt",
    servings: "3 Porsi",
    calories: "240 kal",
    difficulty: "Sedang",
    tags: ["Lauk", "Pedas"],
    ingredients: ["🧱 Tempe", "🌶️ Cabai Merah", "🧅 Bawang Merah", "🫙 Kecap Manis", "🧂 Gula Merah"],
    steps: ["Potong tempe dadu kecil, goreng hingga kering dan kekuningan", "Haluskan cabai, bawang merah, dan bawang putih", "Tumis bumbu halus dengan sedikit minyak hingga harum", "Masukkan kecap manis, gula merah, dan sedikit air", "Masukkan tempe goreng, aduk hingga bumbu meresap dan kering"]
  },
  {
    id: 5,
    title: "Capcay Kuah Segar",
    emoji: "🥦🥕",
    gradient: "linear-gradient(135deg,#1abc9c,#16a085)",
    time: "20 mnt",
    servings: "4 Porsi",
    calories: "150 kal",
    difficulty: "Mudah",
    tags: ["Sehat", "Sayur", "Berkuah"],
    ingredients: ["🥦 Brokoli", "🥕 Wortel", "🫑 Paprika", "🍄 Jamur Tiram", "🧄 Bawang Putih"],
    steps: ["Potong semua sayuran sesuai selera (jangan terlalu kecil)", "Tumis bawang putih hingga harum dengan api sedang", "Masukkan wortel dan jamur dahulu (butuh waktu lebih)", "Tuang kaldu ayam 400ml, masak 8 menit", "Masukkan brokoli dan paprika, tambah maizena untuk kuah kental"]
  },
  {
    id: 6,
    title: "Soto Ayam Bening",
    emoji: "🍗🌿",
    gradient: "linear-gradient(135deg,#f39c12,#d68910)",
    time: "45 mnt",
    servings: "4 Porsi",
    calories: "280 kal",
    difficulty: "Sedang",
    tags: ["Berkuah", "Soto"],
    ingredients: ["🍗 Ayam", "🥬 Sawi", "🥕 Wortel", "🧅 Bawang", "🌿 Daun Salam"],
    steps: ["Rebus ayam dengan air 1.5L hingga empuk sekitar 30 menit", "Angkat ayam, suwir-suwir dagingnya", "Tumis bumbu halus (bawang, kunyit, jahe) hingga matang", "Masukkan tumisan bumbu ke kaldu, tambah daun salam", "Masukkan sawi dan wortel, masak 5 menit. Sajikan dengan suwiran ayam"]
  },
  {
    id: 7,
    title: "Tahu Bacem Manis",
    emoji: "🟨🌿",
    gradient: "linear-gradient(135deg,#f1c40f,#d4a017)",
    time: "30 mnt",
    servings: "4 Porsi",
    calories: "200 kal",
    difficulty: "Mudah",
    tags: ["Lauk", "Manis"],
    ingredients: ["🥚 Tahu Putih", "🌿 Daun Salam", "🫙 Kecap Manis", "🧂 Gula Merah", "🧄 Bawang Putih"],
    steps: ["Potong tahu menjadi segitiga atau persegi", "Masukkan semua bumbu ke dalam panci", "Tambahkan air hingga tahu terendam setengah", "Rebus dengan api kecil hingga bumbu meresap (25 mnt)", "Goreng sebentar hingga kecoklatan, sajikan"]
  },
  {
    id: 8,
    title: "Mie Goreng Jawa",
    emoji: "🍜🥚",
    gradient: "linear-gradient(135deg,#d35400,#e67e22)",
    time: "20 mnt",
    servings: "2 Porsi",
    calories: "410 kal",
    difficulty: "Mudah",
    tags: ["Sarapan", "Cepat", "Pedas"],
    ingredients: ["🍜 Mie Kuning", "🥚 Telur", "🥬 Sawi", "🧅 Bawang", "🌶️ Cabai"],
    steps: ["Rebus mie hingga matang, tiriskan dan sisihkan", "Goreng telur orak-arik, angkat dan sisihkan", "Tumis bawang merah, bawang putih, dan cabai", "Masukkan mie dan telur, aduk dengan kecap dan kecap ikan", "Masukkan sawi, masak hingga layu. Sajikan panas"]
  },
  {
    id: 9,
    title: "Pecel Sayur Komplit",
    emoji: "🥜🥬",
    gradient: "linear-gradient(135deg,#8B4513,#A0522D)",
    time: "30 mnt",
    servings: "2 Porsi",
    calories: "220 kal",
    difficulty: "Sedang",
    tags: ["Sehat", "Sayur", "Tradisional"],
    ingredients: ["🥜 Kacang Tanah", "🥬 Bayam", "🫘 Kacang Panjang", "🌶️ Cabai", "🍋 Jeruk Nipis"],
    steps: ["Rebus kacang tanah, haluskan bersama cabai dan gula", "Tambahkan air jeruk nipis dan garam ke sambal kacang", "Rebus bayam dan kacang panjang sebentar saja", "Tata sayuran di piring", "Siram dengan saus kacang, sajikan dengan lontong"]
  },
  {
    id: 10,
    title: "Balado Telur Puyuh",
    emoji: "🥚🌶️",
    gradient: "linear-gradient(135deg,#c0392b,#e74c3c)",
    time: "25 mnt",
    servings: "3 Porsi",
    calories: "190 kal",
    difficulty: "Mudah",
    tags: ["Lauk", "Pedas", "Telur"],
    ingredients: ["🥚 Telur Puyuh", "🌶️ Cabai Merah", "🧅 Bawang Merah", "🍅 Tomat", "🧂 Garam"],
    steps: ["Rebus telur puyuh hingga matang, kupas kulitnya", "Goreng telur sebentar hingga kekuningan", "Haluskan cabai, bawang merah, dan tomat", "Tumis bumbu halus hingga matang dan minyak keluar", "Masukkan telur, aduk rata dengan bumbu. Sajikan"]
  },
  {
    id: 11,
    title: "Sayur Lodeh Nangka",
    emoji: "🫘🥥",
    gradient: "linear-gradient(135deg,#27ae60,#1e8449)",
    time: "50 mnt",
    servings: "4 Porsi",
    calories: "310 kal",
    difficulty: "Sedang",
    tags: ["Berkuah", "Tradisional", "Sayur"],
    ingredients: ["🫘 Nangka Muda", "🥥 Santan", "🌿 Daun Salam", "🧅 Bawang", "🌶️ Cabai"],
    steps: ["Potong nangka muda, buang bijinya", "Haluskan bumbu: bawang, cabai, kunyit, dan kemiri", "Tumis bumbu halus bersama daun salam", "Masukkan nangka, aduk rata dengan bumbu", "Tuang santan, masak hingga nangka empuk sambil diaduk"]
  },
  {
    id: 12,
    title: "Rendang Singkat",
    emoji: "🥩🌶️",
    gradient: "linear-gradient(135deg,#6D4C41,#4E342E)",
    time: "60 mnt",
    servings: "4 Porsi",
    calories: "420 kal",
    difficulty: "Sulit",
    tags: ["Lauk", "Tradisional", "Pedas"],
    ingredients: ["🥩 Daging Sapi", "🌶️ Cabai Merah", "🥥 Santan", "🌿 Daun Jeruk", "🧄 Bawang Putih"],
    steps: ["Potong daging sapi kotak, lumuri garam dan merica", "Haluskan semua bumbu rendang (cabai, bawang, jahe)", "Masak santan bersama bumbu hingga mendidih", "Masukkan daging, masak dengan api sedang", "Aduk terus hingga santan menyusut dan daging kecoklatan"]
  }
];

// ============================================================
// STATE
// ============================================================
let detectedIngredients = [];
let currentFilter = 'all';
let cameraStream = null;
let foodDetectionModel = null;
let demoRunning = false;

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
    btn.textContent = '📷 Aktifkan Kamera';
    btn.disabled = false;
    updateDetectionStatus('idle', 'Akses kamera ditolak. Gunakan Mode Demo.');
    showToast('Tidak bisa mengakses kamera. Coba Mode Demo!', 'error');
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

  updateDetectionStatus('active', 'Mode Demo — AI sedang mendeteksi bahan...');

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
          updateDetectionStatus('detected', `✅ ${demoItems.length} bahan terdeteksi! Cari resep atau tanya Chef AI.`);
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
  updateDetectionStatus('active', 'AI sedang memeriksa foto…');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  boxes.innerHTML = '';

  try {
    if (!foodDetectionModel) {
      if (!window.cocoSsd) throw new Error('Model deteksi belum tersedia. Periksa koneksi internet.');
      foodDetectionModel = await cocoSsd.load();
    }
    const predictions = await foodDetectionModel.detect(canvas);
    const foodLabels = {
      apple: ['🍎', 'Apel'], banana: ['🍌', 'Pisang'], orange: ['🍊', 'Jeruk'],
      broccoli: ['🥦', 'Brokoli'], carrot: ['🥕', 'Wortel'],
      'hot dog': ['🌭', 'Hot dog'], pizza: ['🍕', 'Pizza'],
      sandwich: ['🥪', 'Sandwich'], cake: ['🍰', 'Kue'], donut: ['🍩', 'Donat']
    };
    const matches = predictions.filter(item => foodLabels[item.class] && item.score >= 0.35);
    matches.forEach(({ class: label, score, bbox }) => {
      const [emoji, name] = foodLabels[label];
      const [x, y, width, height] = bbox;
      const box = document.createElement('div');
      box.className = 'det-box';
      box.style.cssText = `left:${x / canvas.width * 100}%;top:${y / canvas.height * 100}%;width:${width / canvas.width * 100}%;height:${height / canvas.height * 100}%`;
      const caption = document.createElement('div');
      caption.className = 'det-box-label';
      caption.textContent = `${emoji} ${name} ${Math.round(score * 100)}%`;
      box.appendChild(caption);
      boxes.appendChild(box);
      addIngredientItem(emoji, name, Math.round(score * 100));
    });
    if (matches.length) {
      const confidence = Math.round(matches.reduce((sum, item) => sum + item.score, 0) / matches.length * 100);
      updateDetectionStatus('detected', `${matches.length} bahan terdeteksi. Periksa hasilnya sebelum mencari resep.`);
      showConfidenceBar(confidence);
      showToast('Foto berhasil dipindai.', 'success');
    } else {
      updateDetectionStatus('idle', 'Belum menemukan bahan yang didukung. Coba dekatkan objek atau tambah bahan secara manual.');
    }
  } catch (error) {
    updateDetectionStatus('idle', error.message || 'Pemindaian gagal. Coba Mode Demo atau tambah bahan secara manual.');
    showToast('Model deteksi tidak dapat dimuat.', 'error');
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
}

function createRecipeCardHTML(r) {
  return `
    <div class="recipe-card" onclick="openRecipeModal('${r.title}','${r.time}','${r.servings}','${r.calories}',${JSON.stringify(r.ingredients)},${JSON.stringify(r.steps)})">
      <div class="recipe-img" style="background:${r.gradient}">
        <span class="recipe-img-emoji">${r.emoji}</span>
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

function filterByCategory(cat) {
  showPage('resep');
  setTimeout(() => {
    const searchEl = document.getElementById('recipeSearch');
    if (searchEl) {
      searchEl.value = cat;
      filterRecipes();
    }
  }, 100);
}

// ============================================================
// JELAJAHI GRID
// ============================================================
function renderJelajahiGrid() {
  const grid = document.getElementById('fiveBahanGrid');
  if (!grid) return;
  const fiveBahan = RECIPES_DB.filter(r => r.ingredients.length <= 5);
  grid.innerHTML = fiveBahan.map(r => createRecipeCardHTML(r)).join('');
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

  const firstEmoji = ingredients[0]?.split(' ')[0] || '🍳';
  document.getElementById('modalHeroEmoji').textContent = firstEmoji + (ingredients[1]?.split(' ')[0] || '');
  const gradient = EMOJI_GRADIENTS[firstEmoji] || 'linear-gradient(135deg,rgba(255,107,53,0.2),rgba(46,196,182,0.15))';
  document.getElementById('modalHero').style.background = gradient;

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

  // Check for substitusi
  for (const [ingredient, substitusi] of Object.entries(AI_RESPONSES.substitusi)) {
    if (lowerMsg.includes(ingredient) || lowerMsg.includes('ganti') || lowerMsg.includes('substitusi')) {
      return {
        type: 'substitusi',
        text: `Tentu! Untuk **${ingredient}**, ${substitusi}`,
        tip: `💡 Substitusi bahan adalah seni memasak yang kreatif!`
      };
    }
  }

  // Check for ingredients mentioned
  for (const [key, data] of Object.entries(AI_RESPONSES.keywords)) {
    if (key !== 'default' && lowerMsg.includes(key)) {
      return {
        type: 'recipe',
        text: `Wah, kamu punya **${key}**! Aku rekomendasikan:\n\n**${data.recipe}** (⏱ ${data.time})\n\n${data.tip}`,
        recipe: {
          title: data.recipe,
          time: data.time,
          idx: Math.floor(Math.random() * RECIPES_DB.length)
        }
      };
    }
  }

  // Check for bahan sisa context
  if (detectedIngredients.length > 0) {
    const names = detectedIngredients.map(i => i.name).join(', ');
    const randRecipe = RECIPES_DB[Math.floor(Math.random() * RECIPES_DB.length)];
    return {
      type: 'recipe',
      text: `Dengan bahan yang kamu punya (${names}), aku sarankan membuat:\n\n**${randRecipe.title}** (⏱ ${randRecipe.time})\n\nResep ini cocok banget untuk bahan sisa dan tidak memerlukan banyak bahan tambahan!`,
      recipe: {
        title: randRecipe.title,
        time: randRecipe.time,
        idx: RECIPES_DB.indexOf(randRecipe)
      }
    };
  }

  // Default responses
  const defaults = [
    { text: "Coba ceritakan bahan apa yang kamu punya di dapur! Aku akan bantu carikan resep yang cocok 🍳", type: 'text' },
    { text: "Untuk masakan sehat dan cepat, aku rekomendasikan tumis-tumisan dengan bahan segar. Bahan apa yang tersedia?", type: 'text' },
    { text: "Prinsip zero waste cooking: gunakan semua bagian bahan! Misalnya batang brokoli bisa dijadikan sup.", type: 'text' },
  ];
  return defaults[Math.floor(Math.random() * defaults.length)];
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
      <div class="bubble-avatar">🤖</div>
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
    recipeCardHTML = `
      <div class="chat-recipe-card" onclick="openRecipeModal('${r.title}','${r.time}','${r.servings}','${r.calories}',${JSON.stringify(r.ingredients)},${JSON.stringify(r.steps)})">
        <div class="crc-title">${r.emoji} ${r.title}</div>
        <div class="crc-meta">⏱ ${r.time} • 👥 ${r.servings} • 🔥 ${r.calories}</div>
        <span class="crc-link">Lihat Resep Lengkap →</span>
      </div>
    `;
  }

  div.innerHTML = `
    <div class="bubble-avatar">🤖</div>
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
    <div class="bubble-avatar">🤖</div>
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

function formatBotText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function autoResizeTextarea(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
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
  initParticles();
  initScrollEffects();
  animateFooterCounter();
  showPage('home');

  // Initial recipe grid render
  setTimeout(() => {
    renderJelajahiGrid();
  }, 100);
});
