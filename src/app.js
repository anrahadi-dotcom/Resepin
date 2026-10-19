/* Client-side interactions for the Next.js rendered Resepin shell. */
(() => {
  const popularIngredients = ['Telur', 'Ayam', 'Tahu', 'Nasi', 'Tempe'];
  const heroIngredientOptions = ['Nasi', 'Telur', 'Cabai', 'Tahu', 'Ayam', 'Tempe', 'Jagung', 'Wortel'];
  const whyChoices = [
    { label: 'Mulai dari bahanmu', kicker: 'Dari isi dapurmu', title: 'Nggak perlu mulai dari nol.', copy: 'Sebutkan bahan yang masih ada. Resepin bantu menyusun ide masakan dari isi dapurmu, jadi kamu tahu apa yang bisa dimasak hari ini.', image: '/assets/img/workflow-ingredients.webp', imageLabel: 'Bahan segar yang sudah tersedia', alt: 'Tomat, wortel, bayam, bawang, dan ayam di atas meja dapur.' },
    { label: 'Resep yang fleksibel', kicker: 'Kamu yang pegang kendali', title: 'Sesuaikan sebelum mulai.', copy: 'Cek daftar bahan dan ubah kalau ada yang kurang pas. Resep terasa lebih masuk akal untuk bahan dan kebutuhanmu.', image: '/assets/img/workflow-checklist.webp', imageLabel: 'Rencana masak yang bisa disesuaikan', alt: 'Catatan daftar bahan dengan wortel, bayam, dan persiapan memasak.' },
    { label: 'Ada teman masak', kicker: 'Teman di dapur', title: 'Kalau bingung, tinggal tanya.', copy: 'Tanya Chef Resepin soal variasi, pengganti bahan, atau tips saat memasak. Biar langkah berikutnya terasa lebih jelas.', image: '/assets/img/chef-hero.jpg', imageLabel: 'Teman untuk bertanya di dapur', alt: 'Koki menyiapkan hidangan di dapur.' },
    { label: 'Langkah yang jelas', kicker: 'Dari rencana ke meja makan', title: 'Ikuti satu langkah tiap waktu.', copy: 'Lihat urutan memasak dengan jelas, dari persiapan sampai sajian siap. Kamu bisa fokus memasak tanpa menebak langkah berikutnya.', image: '/assets/img/workflow-checklist.webp', imageLabel: 'Daftar persiapan sebelum memasak', alt: 'Daftar bahan dan sayuran yang sudah disiapkan untuk memasak.' },
    { label: 'Kurangi bahan terbuang', kicker: 'Pakai yang sudah ada', title: 'Bahan tersisa tetap berarti.', copy: 'Mulai dari bahan yang hampir terlupa di kulkas. Resepin bantu mengubahnya jadi menu rumahan yang layak dinikmati.', image: '/assets/img/workflow-cooking.webp', imageLabel: 'Bahan sederhana jadi hidangan', alt: 'Hidangan nasi hangat yang disiapkan dari bahan dapur.' }
  ];

  const app = {
    heroIngredientText: '', heroSelectedIngredients: [], heroSearchMessage: '',
    heroIngredientOptions, popularIngredients, activePage: 'home', menuOpen: false,
    navSearchOpen: false, whyChoiceIndex: 0, floatingChefChatOpen: false,
    heroFavoriteOrder: [19, 23], heroFavoriteTimer: null, heroVisibilityObserver: null,
    heroCardDrag: null, whyChoices,
    get heroSearchIngredients() {
      const typed = this.heroIngredientText.split(/[,;\n]+/).map(value => value.trim()).filter(Boolean);
      const unique = new Map();
      [...this.heroSelectedIngredients, ...typed].forEach(value => {
        const key = value.toLocaleLowerCase('id');
        if (!unique.has(key)) unique.set(key, value);
      });
      return [...unique.values()];
    },
    get activeWhyChoice() { return this.whyChoices[this.whyChoiceIndex] || this.whyChoices[0]; },
    get heroFavoriteRecipes() { return this.heroFavoriteOrder.map(id => RECIPES_DB.find(recipe => recipe.id === id)).filter(Boolean); },
    get heroFeaturedRecipe() { return this.heroFavoriteRecipes[0] || RECIPES_DB[0]; },
    get heroRecipeSuggestion() {
      const selected = this.heroSearchIngredients;
      if (!selected.length) return null;
      const normalize = value => String(value).toLocaleLowerCase('id').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return RECIPES_DB.map(recipe => ({ recipe, matches: selected.filter(item => recipe.ingredients.some(ingredient => normalize(ingredient).includes(normalize(item)))).length }))
        .filter(item => item.matches)
        .sort((a, b) => b.matches - a.matches || (parseInt(a.recipe.time, 10) || 999) - (parseInt(b.recipe.time, 10) || 999))
        .map(item => ({ ...item.recipe, matchedCount: item.matches }))[0] || null;
    },
    get heroRecipeImage() {
      const recipe = this.heroRecipeSuggestion;
      if (!recipe) return '/assets/img/chef-hero.jpg';
      const slug = RECIPE_IMAGES[recipe.id];
      return slug ? `/assets/img/${slug}.jpg` : '/assets/img/chef-hero.jpg';
    },
    go(page) {
      this.floatingChefChatOpen = false; this.menuOpen = false; this.navSearchOpen = false;
      if (page === 'home') { this.heroIngredientText = ''; this.heroSelectedIngredients = []; this.heroSearchMessage = ''; }
      window.navigateToPage(page);
      this.sync();
      requestAnimationFrame(() => { window.refreshMotionReveals?.(); if (page === 'chef') window.restoreChefChatHistory?.('chatMessages'); });
    },
    toggleMenu() {
      this.menuOpen = !this.menuOpen; this.navSearchOpen = false; window.toggleMenu?.(this.menuOpen); this.sync();
      if (this.menuOpen) requestAnimationFrame(() => document.querySelector('#navLinks .nav-link')?.focus());
    },
    toggleNavSearch() {
      this.navSearchOpen = !this.navSearchOpen; this.sync();
      if (this.navSearchOpen) requestAnimationFrame(() => document.getElementById('heroIngredientSearch')?.focus());
    },
    toggleFloatingChefChat() {
      this.floatingChefChatOpen = !this.floatingChefChatOpen; this.sync();
      if (this.floatingChefChatOpen) requestAnimationFrame(() => { window.restoreChefChatHistory?.('miniChatMessages'); document.getElementById('miniChatInput')?.focus(); });
      else requestAnimationFrame(() => document.querySelector('.floating-chef-button')?.focus());
    },
    selectWhyChoice(index) { if (index >= 0 && index < this.whyChoices.length) { this.whyChoiceIndex = index; this.syncWhy(); } },
    toggleHeroIngredient(ingredient) {
      this.heroSelectedIngredients = this.heroSelectedIngredients.includes(ingredient) ? this.heroSelectedIngredients.filter(item => item !== ingredient) : [...this.heroSelectedIngredients, ingredient];
      this.heroSearchMessage = ''; this.syncSearch();
    },
    removeHeroIngredient(ingredient) { this.heroSelectedIngredients = this.heroSelectedIngredients.filter(item => item !== ingredient); this.syncSearch(); },
    submitHeroSearch() {
      const ingredients = this.heroSearchIngredients;
      if (!ingredients.length) { this.heroSearchMessage = 'Masukkan atau pilih minimal satu bahan.'; this.syncSearch(); return; }
      const url = new URL(window.location.href); url.searchParams.delete('bahan'); ingredients.forEach(item => url.searchParams.append('bahan', item));
      window.history.replaceState(window.history.state, '', url);
      const input = document.getElementById('recipeSearch'); if (input) input.value = ingredients.join(', ');
      this.go('resep');
    },
    findRecipesFromScan() {
      window.recordScanIngredientUsage?.();
      window.prepareScanRecipeSearch?.();
      this.go('resep');
    },
    searchHeroDemo() { this.heroIngredientText = ''; this.heroSearchMessage = ''; this.submitHeroSearch(); },
    scrollToHomeSection(id) {
      const target = document.getElementById(id); if (!target) return;
      target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    },
    closeModalAndGo(page) { closeRecipeModal(); this.go(page); },
    openHeroFavorite(id) { const index = RECIPES_DB.findIndex(recipe => recipe.id === id); if (index >= 0) openRecipeByIndex(index); },
    shuffleHeroFavorites() { const [first, ...rest] = this.heroFavoriteOrder; this.heroFavoriteOrder = [...rest, first]; this.renderHero(); },
    heroFavoriteImage(recipe) { const slug = RECIPE_IMAGES[recipe.id]; return slug ? `/assets/img/${slug}.jpg` : '/assets/img/chef-hero.jpg'; },
    sync() { this.syncNav(); this.syncSearch(); this.syncFloating(); this.syncHero(); },
    syncNav() {
      const wrap = document.querySelector('.nav-search-wrap'); wrap?.classList.toggle('is-open', this.navSearchOpen);
      const search = document.getElementById('navIngredientSearch');
      if (search) { search.setAttribute('aria-hidden', String(!this.navSearchOpen)); if (this.navSearchOpen) search.removeAttribute('inert'); else search.setAttribute('inert', ''); }
      const searchButton = document.querySelector('.nav-search-toggle');
      if (searchButton) { searchButton.setAttribute('aria-expanded', String(this.navSearchOpen)); searchButton.setAttribute('aria-label', this.navSearchOpen ? 'Tutup pencarian resep' : 'Buka pencarian resep'); }
      const hamburger = document.getElementById('hamburgerBtn');
      if (hamburger) { hamburger.setAttribute('aria-expanded', String(this.menuOpen)); hamburger.setAttribute('aria-label', this.menuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'); }
      document.querySelector('.nav-container')?.classList.toggle('menu-open', this.menuOpen);
    },
    syncSearch() {
      const input = document.getElementById('heroIngredientSearch'); if (input && input.value !== this.heroIngredientText) input.value = this.heroIngredientText;
      const selected = this.heroSearchIngredients;
      const count = document.querySelector('.nav-search-count b'); if (count) count.textContent = String(selected.length);
      document.querySelectorAll('.hero-ingredient-chip').forEach(button => {
        const ingredient = button.dataset.ingredient; const active = this.heroSelectedIngredients.includes(ingredient);
        button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
        const mark = button.querySelector('.nav-chip-mark'); if (mark) mark.textContent = active ? '✓' : '+';
      });
      const submit = document.querySelector('.nav-search-submit'); if (submit) submit.disabled = selected.length === 0;
      const message = document.querySelector('.nav-search-message');
      if (message) { message.textContent = this.heroSearchMessage; message.hidden = !this.heroSearchMessage; }
      this.renderSuggestion();
    },
    renderSuggestion() {
      const layout = document.querySelector('.nav-search-layout');
      if (!layout) return;
      let button = layout.querySelector('button.nav-search-preview');
      let empty = layout.querySelector('.nav-search-preview-empty');
      const recipe = this.heroRecipeSuggestion;
      if (!recipe) {
        button?.remove();
        if (!empty) { empty = document.createElement('div'); empty.className = 'nav-search-preview nav-search-preview-empty'; empty.innerHTML = '<span class="nav-preview-doodle" aria-hidden="true">✳</span><small>IDE MASAK MENUNGGU</small><strong>Pilih bahan<br>di dapurmu.</strong><span>Rekomendasi akan muncul di sini.</span>'; layout.append(empty); }
        return;
      }
      empty?.remove();
      if (!button) { button = document.createElement('button'); layout.append(button); }
      button.className = 'nav-search-preview'; button.type = 'button'; button.setAttribute('aria-label', `Lihat resep ${recipe.title}, cocok dengan ${recipe.matchedCount} bahan`);
      button.innerHTML = `<img src="${this.heroRecipeImage}" alt="${escapeHtml(recipe.title)}"><span class="nav-search-preview-shade"></span><span class="nav-search-preview-top"><i></i> IDE PALING COCOK</span><span class="nav-search-preview-copy"><small>${recipe.matchedCount} bahanmu cocok</small><strong>${escapeHtml(recipe.title)}</strong><span>${escapeHtml(recipe.time)} <b>·</b> ${escapeHtml(recipe.difficulty)}</span></span><span class="nav-search-preview-arrow" aria-hidden="true">↗</span>`;
      if (empty) empty.replaceWith(button);
      button.onclick = () => this.openHeroFavorite(recipe.id);
    },
    syncFloating() {
      const chat = document.getElementById('floatingChefChat');
      if (chat) { chat.hidden = this.activePage === 'chef' || !this.floatingChefChatOpen; chat.setAttribute('aria-hidden', String(chat.hidden)); }
      const button = document.querySelector('.floating-chef-button');
      if (button) { button.hidden = this.activePage === 'chef'; button.setAttribute('aria-expanded', String(this.floatingChefChatOpen)); button.setAttribute('aria-label', this.floatingChefChatOpen ? 'Tutup chat Chef Resepin' : 'Buka chat Chef Resepin'); }
      document.querySelector('.floating-chef-tooltip')?.toggleAttribute('hidden', this.floatingChefChatOpen);
    },
    syncWhy() {
      const choice = this.activeWhyChoice;
      const options = [...document.querySelectorAll('.why-resepin-option')];
      options.forEach((button, index) => { const active = index === this.whyChoiceIndex; button.classList.toggle('is-active', active); button.setAttribute('aria-pressed', String(active)); });
      const visual = document.querySelector('.why-resepin-visual');
      if (visual) {
        const image = visual.querySelector('img'); if (image) { image.src = choice.image; image.alt = choice.alt; }
        const caption = visual.querySelector('.why-resepin-visual-caption'); if (caption) caption.innerHTML = `<i></i>${escapeHtml(choice.imageLabel)}`;
      }
      const copy = document.querySelector('.why-resepin-copy');
      if (copy) { const kicker = copy.querySelector('.why-resepin-copy-kicker'); if (kicker) kicker.innerHTML = `<i></i>${escapeHtml(choice.kicker)}`; const title = copy.querySelector('h3'); if (title) title.textContent = choice.title; const body = copy.querySelector('p'); if (body) body.textContent = choice.copy; }
    },
    syncHero() { this.renderHero(); },
    renderHero() {
      const recipe = this.heroFeaturedRecipe; const card = document.querySelector('.hero-favorite-card'); if (!recipe || !card) return;
      card.setAttribute('aria-label', `Buka resep ${recipe.title}, ${recipe.time}, ${recipe.difficulty}`);
      const image = card.querySelector('img'); if (image) image.src = this.heroFavoriteImage(recipe);
      const title = card.querySelector('.hero-favorite-copy strong'); if (title) title.textContent = recipe.title;
      const meta = card.querySelector('.hero-favorite-copy small'); if (meta) meta.innerHTML = `${escapeHtml(recipe.time)} <i aria-hidden="true">·</i> ${escapeHtml(recipe.servings)}`;
      const chips = card.querySelector('.hero-favorite-ingredients'); if (chips) chips.innerHTML = recipe.ingredients.slice(0, 2).map(item => `<i>${escapeHtml(item)}</i>`).join('');
    },
    bind() {
      document.addEventListener('click', event => {
        const element = event.target.closest('[data-app-event-click]'); if (!element) return;
        if (element.hasAttribute('data-app-prevent')) event.preventDefault();
        if (element.hasAttribute('data-app-stop')) event.stopPropagation();
        const expression = element.getAttribute('data-app-event-click');
        const locals = { $event: event, ingredient: element.dataset.ingredient, index: Number(element.dataset.index || 0), heroFeaturedRecipe: this.heroFeaturedRecipe, heroRecipeSuggestion: this.heroRecipeSuggestion };
        try { Function('app', 'locals', `with (app) { with (locals) { ${/^[\w$]+$/.test(expression) ? `${expression}($event)` : expression}; } }`)(this, locals); this.sync(); }
        catch (error) { console.error('[Resepin] Aksi gagal:', expression, error); }
      });
      ['pointermove', 'pointerleave', 'pointerup', 'pointercancel', 'keydown'].forEach(type => document.addEventListener(type, event => {
        const element = event.target.closest(`[data-app-event-${type}]`); if (!element) return;
        if (element.hasAttribute('data-app-key-esc') && event.key !== 'Escape') return;
        const expression = element.getAttribute(`data-app-event-${type}`);
        const locals = { $event: event, ingredient: element.dataset.ingredient, index: Number(element.dataset.index || 0), heroFeaturedRecipe: this.heroFeaturedRecipe };
        try { Function('app', 'locals', `with (app) { with (locals) { ${/^[\w$]+$/.test(expression) ? `${expression}($event)` : expression}; } }`)(this, locals); }
        catch (error) { console.error('[Resepin] Aksi gagal:', expression, error); }
      }, true));
      document.addEventListener('submit', event => {
        if (event.target.matches('#navIngredientSearch')) { event.preventDefault(); this.submitHeroSearch(); }
      });
      document.addEventListener('input', event => {
        if (event.target.id === 'heroIngredientSearch') { this.heroIngredientText = event.target.value; this.heroSearchMessage = ''; this.syncSearch(); }
        if (event.target.id === 'impactYearSlider') this.updateImpact(event.target.value);
      });
      document.addEventListener('click', event => {
        if (!event.target.closest('#navbar')) { this.navSearchOpen = false; if (this.menuOpen) { this.menuOpen = false; window.toggleMenu(false); } this.syncNav(); }
      });
      document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        if (this.navSearchOpen) { this.navSearchOpen = false; this.syncNav(); document.querySelector('.nav-search-toggle')?.focus(); }
        if (this.menuOpen) { this.menuOpen = false; window.toggleMenu(false); this.syncNav(); document.getElementById('hamburgerBtn')?.focus(); }
        if (this.floatingChefChatOpen) { this.floatingChefChatOpen = false; this.syncFloating(); document.querySelector('.floating-chef-button')?.focus(); }
      });
      window.addEventListener('resepin:route', event => { this.activePage = event.detail?.page || this.activePage; this.floatingChefChatOpen = false; this.menuOpen = false; this.sync(); });
      const field = document.getElementById('heroIngredientSearch'); if (field) field.value = this.heroIngredientText;
    },
    renderRepeats() {
      const popular = document.querySelector('.hero-popular-ingredients');
      if (popular) {
        const label = popular.querySelector('.hero-popular-label');
        popular.replaceChildren(label);
        this.popularIngredients.forEach(ingredient => {
          const button = document.createElement('button'); button.type = 'button'; button.className = 'hero-ingredient-chip [flex:0_0_auto] [padding:6px_11px] [color:#fff] [background:rgba(0,0,0,.34)] [border:1px_solid_rgba(238,234,215,.42)] [border-radius:999px] [font:500_.78rem_var(--font-body)] [cursor:pointer]';
          button.dataset.ingredient = ingredient; button.dataset.appEventClick = 'toggleHeroIngredient(ingredient)'; button.setAttribute('aria-pressed', 'false'); button.innerHTML = `<span class="nav-chip-mark" aria-hidden="true">+</span>${escapeHtml(ingredient)}`; popular.append(button);
        });
      }
      const options = document.querySelector('.why-resepin-options');
      if (options) {
        const template = options.querySelector('.why-resepin-option'); const hint = options.querySelector('.why-resepin-hint');
        options.replaceChildren();
        this.whyChoices.forEach((choice, index) => {
          const button = template.cloneNode(true); button.dataset.index = String(index); button.dataset.appEventClick = 'selectWhyChoice(index)';
          button.classList.toggle('is-active', index === 0); button.setAttribute('aria-pressed', String(index === 0));
          const number = button.querySelector('.why-resepin-option-number'); if (number) number.textContent = `0${index + 1}`;
          const label = button.querySelectorAll('span')[1]; if (label) label.textContent = choice.label;
          options.append(button);
        });
        if (hint) options.append(hint);
      }
    },
    updateImpact(year) {
      const value = Number(year); const output = document.querySelector('.impact-number');
      if (output) output.textContent = `≈ ${value >= 2019 ? 46 : Math.round(23 + ((value - 2000) / 18) * 25)}`;
      const slider = document.getElementById('impactYearSlider');
      if (slider) { const tonnage = value >= 2019 ? 46 : Math.round(23 + ((value - 2000) / 18) * 25); slider.setAttribute('aria-valuetext', `${value}, ≈ ${tonnage} juta ton per tahun`); slider.style.setProperty('--slider-progress', `${((value - 2000) / 19) * 100}%`); }
      const yearLabel = document.querySelector('.impact-figure-top span span'); if (yearLabel) yearLabel.textContent = String(value);
    },
    start() {
      this.activePage = document.querySelector('.page.active[role="main"]')?.id?.replace('page-', '') || 'home';
      this.renderRepeats(); this.bind(); this.sync(); this.syncWhy(); this.updateImpact(document.getElementById('impactYearSlider')?.value || 2000);
      this.whyChoices.forEach(choice => { const image = new Image(); image.decoding = 'async'; image.src = choice.image; });
      const hero = document.querySelector('#page-home .hero');
      if (hero && 'IntersectionObserver' in window) {
        this.heroVisibilityObserver = new IntersectionObserver(([entry]) => { this.heroInView = entry.isIntersecting; }, { threshold: .05 }); this.heroVisibilityObserver.observe(hero);
      }
      this.heroFavoriteTimer = window.setInterval(() => {
        if (this.activePage !== 'home' || !this.heroInView || document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        this.shuffleHeroFavorites();
      }, 5200);
    }
  };

  window.resepinApp = app;
  app.start();
})();
