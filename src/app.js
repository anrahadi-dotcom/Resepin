/* Vue 3 owns the application shell and ingredient search in the hero. */
const { createApp } = Vue;

createApp({
  data() {
    return {
      heroIngredientText: '',
      heroSelectedIngredients: [],
      heroSearchMessage: '',
      heroHeadlineIndex: 0,
      heroHeadlineTimer: null,
      heroHeadlines: [
        { highlight: 'jadi menu', ending: 'istimewa.', label: 'Dari isi dapur, jadi menu istimewa.' },
        { highlight: 'jadi sajian', ending: 'spesial.', label: 'Dari isi dapur, jadi sajian spesial.' },
        { highlight: 'jadi kreasi', ending: 'favorit.', label: 'Dari isi dapur, jadi kreasi favorit.' }
      ],
      heroInView: true,
      heroVisibilityObserver: null,
      heroIngredientOptions: ['Nasi', 'Telur', 'Cabai', 'Tahu', 'Ayam', 'Tempe', 'Jagung', 'Wortel'],
      heroDropActive: false,
      heroCardDrag: null,
      heroFavoriteOrder: [19, 23],
      heroFavoriteTimer: null,
      popularIngredients: ['Telur', 'Ayam', 'Tahu', 'Nasi', 'Tempe'],
      activePage: 'home',
      menuOpen: false,
      navSearchOpen: false,
      impactYear: 2000,
      floatingChefChatOpen: false
    };
  },
  computed: {
    heroSearchIngredients() {
      const typed = this.heroIngredientText.split(/[,;\n]+/).map(value => value.trim()).filter(Boolean);
      const unique = new Map();
      [...this.heroSelectedIngredients, ...typed].forEach(value => {
        const key = value.toLocaleLowerCase('id');
        if (!unique.has(key)) unique.set(key, value);
      });
      return [...unique.values()];
    },
    heroRecipeSuggestion() {
      const ingredients = this.heroSearchIngredients;
      if (!ingredients.length || typeof RECIPES_DB === 'undefined') return null;
      const normalize = value => value.toLocaleLowerCase('id').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return RECIPES_DB.map(recipe => {
        const matchedIngredients = ingredients.filter(selected =>
          recipe.ingredients.some(ingredient => normalize(ingredient).includes(normalize(selected)))
        );
        return { recipe, matchedCount: matchedIngredients.length };
      }).filter(result => result.matchedCount > 0)
        .sort((a, b) => b.matchedCount - a.matchedCount || (Number.parseInt(a.recipe.time, 10) || 999) - (Number.parseInt(b.recipe.time, 10) || 999))
        .map(result => ({ ...result.recipe, matchedCount: result.matchedCount }))[0] || null;
    },
    heroRecipeMatchCount() {
      return this.heroRecipeSuggestion?.matchedCount || 0;
    },
    impactTonnage() {
      // The Bappenas study publishes an annual chart, not a year-by-year data table.
      // Use rounded visual estimates between the chart's 2000 and 2018 endpoints.
      if (this.impactYear >= 2019) return '≈ 46';
      const progress = (this.impactYear - 2000) / 18;
      return `≈ ${Math.round(23 + progress * 25)}`;
    },
    heroRecipeImage() {
      if (!this.heroRecipeSuggestion || typeof RECIPE_IMAGES === 'undefined') return '/assets/img/chef-hero.jpg';
      const imageSlug = RECIPE_IMAGES[this.heroRecipeSuggestion.id];
      return imageSlug ? `/assets/img/${imageSlug}.jpg` : '/assets/img/chef-hero.jpg';
    },
    heroFavoriteRecipes() {
      return this.heroFavoriteOrder.map(id => RECIPES_DB.find(recipe => recipe.id === id)).filter(Boolean);
    }
  },
  watch: {
    floatingChefChatOpen(isOpen, wasOpen) {
      if (!isOpen && wasOpen) this.$nextTick(() => document.querySelector('.floating-chef-button')?.focus());
    }
  },
  mounted() {
    window.resepinApp = this;
    document.addEventListener('click', this.closeMenuOnOutside);
    document.addEventListener('keydown', this.closeMenuOnEscape);
    this.$nextTick(() => {
      window.refreshMotionReveals?.();
      const hero = document.querySelector('#page-home .hero');
      if (hero && 'IntersectionObserver' in window) {
        this.heroVisibilityObserver = new IntersectionObserver(([entry]) => {
          this.heroInView = entry.isIntersecting;
        }, { threshold: 0.05 });
        this.heroVisibilityObserver.observe(hero);
      }
      this.heroHeadlineTimer = window.setInterval(() => {
        if (this.activePage !== 'home' || !this.heroInView || document.hidden
          || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
        this.heroHeadlineIndex = (this.heroHeadlineIndex + 1) % this.heroHeadlines.length;
      }, 4800);
      this.heroFavoriteTimer = window.setInterval(() => {
        if (this.activePage !== 'home' || !this.heroInView || document.hidden || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
        this.shuffleHeroFavorites();
      }, 5200);
    });
  },
  beforeUnmount() {
    if (this.heroHeadlineTimer) window.clearInterval(this.heroHeadlineTimer);
    if (this.heroFavoriteTimer) window.clearInterval(this.heroFavoriteTimer);
    this.heroVisibilityObserver?.disconnect();
    document.removeEventListener('click', this.closeMenuOnOutside);
    document.removeEventListener('keydown', this.closeMenuOnEscape);
  },
  methods: {
    searchHeroDemo() {
      this.heroIngredientText = '';
      this.heroSearchMessage = '';
      this.$nextTick(() => this.submitHeroSearch());
    },
    scrollToHomeSection(sectionId) {
      const section = document.getElementById(sectionId);
      if (!section) return;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    },
    go(page) {
      this.floatingChefChatOpen = false;
      this.menuOpen = false;
      this.navSearchOpen = false;
      if (page === 'home') {
        this.heroIngredientText = '';
        this.heroSelectedIngredients = [];
        this.heroSearchMessage = '';
      }
      window.navigateToPage(page);
      this.$nextTick(() => {
        if (page === 'chef') window.restoreChefChatHistory?.('chatMessages');
        window.refreshMotionReveals?.();
      });
    },
    toggleMenu() {
      this.menuOpen = !this.menuOpen;
      this.navSearchOpen = false;
      window.toggleMenu(this.menuOpen);
      if (this.menuOpen) this.$nextTick(() => document.querySelector('#navLinks .nav-link')?.focus());
    },
    toggleNavSearch() {
      this.navSearchOpen = !this.navSearchOpen;
      if (this.navSearchOpen) this.$nextTick(() => document.getElementById('heroIngredientSearch')?.focus());
    },
    closeMenuOnOutside(event) {
      if (event.target.closest?.('#navbar')) return;
      if (this.navSearchOpen) this.navSearchOpen = false;
      if (this.menuOpen) {
        this.menuOpen = false;
        window.toggleMenu(false);
      }
    },
    closeMenuOnEscape(event) {
      if (event.key !== 'Escape') return;
      if (this.navSearchOpen) {
        this.navSearchOpen = false;
        this.$nextTick(() => document.querySelector('.nav-search-toggle')?.focus());
        return;
      }
      if (!this.menuOpen) return;
      this.menuOpen = false;
      window.toggleMenu(false);
      this.$nextTick(() => document.getElementById('hamburgerBtn')?.focus());
    },
    toggleFloatingChefChat() {
      this.floatingChefChatOpen = !this.floatingChefChatOpen;
      if (this.floatingChefChatOpen) {
        this.$nextTick(() => {
          window.restoreChefChatHistory?.('miniChatMessages');
          document.getElementById('miniChatInput')?.focus();
        });
      }
    },
    toggleTheme() {
      window.toggleTheme();
    },
    closeModalAndGo(page) {
      window.closeRecipeModal();
      this.go(page);
    },
    toggleHeroIngredient(ingredient) {
      this.heroSelectedIngredients = this.heroSelectedIngredients.includes(ingredient)
        ? this.heroSelectedIngredients.filter(item => item !== ingredient)
        : [...this.heroSelectedIngredients, ingredient];
      this.heroSearchMessage = '';
    },
    removeHeroIngredient(ingredient) {
      this.heroSelectedIngredients = this.heroSelectedIngredients.filter(item => item !== ingredient);
    },
    startHeroIngredientDrag(event, ingredient) {
      this.heroDropActive = true;
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('text/plain', ingredient);
    },
    endHeroIngredientDrag() {
      this.heroDropActive = false;
    },
    heroFavoriteImage(recipe) {
      const imageSlug = typeof RECIPE_IMAGES === 'undefined' ? null : RECIPE_IMAGES[recipe.id];
      return imageSlug ? `/assets/img/${imageSlug}.jpg` : '/assets/img/chef-hero.jpg';
    },
    shuffleHeroFavorites() {
      const [first, ...rest] = this.heroFavoriteOrder;
      this.heroFavoriteOrder = [...rest, first];
    },
    openHeroFavorite(recipeId) {
      const recipeIndex = RECIPES_DB.findIndex(recipe => recipe.id === recipeId);
      if (recipeIndex >= 0) window.openRecipeByIndex(recipeIndex);
    },
    openCollageRecipe(recipeId, event) {
      if (event.currentTarget.dataset.dragged === 'true') {
        delete event.currentTarget.dataset.dragged;
        return;
      }
      this.openHeroFavorite(recipeId);
    },
    dropHeroIngredient(event) {
      const ingredient = event.dataTransfer.getData('text/plain');
      if (this.heroIngredientOptions.includes(ingredient) && !this.heroSelectedIngredients.includes(ingredient)) {
        this.heroSelectedIngredients = [...this.heroSelectedIngredients, ingredient];
      }
      this.heroDropActive = false;
    },
    startHeroCardDrag(event) {
      if (event.button !== 0 || event.target.closest('a')) return;
      const element = event.currentTarget;
      const stage = element.closest('.hero-collage-stage');
      if (!stage) return;
      const rect = element.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();
      const originX = Number.parseFloat(element.style.getPropertyValue('--drag-x')) || 0;
      const originY = Number.parseFloat(element.style.getPropertyValue('--drag-y')) || 0;
      this.heroCardDrag = {
        element, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
        originX, originY,
        minX: stageRect.left - (rect.left - originX),
        maxX: stageRect.right - (rect.right - originX),
        minY: stageRect.top - (rect.top - originY),
        maxY: stageRect.bottom - (rect.bottom - originY)
      };
      stage.classList.add('has-active-drag');
      element.classList.add('is-dragging');
      element.setPointerCapture(event.pointerId);
    },
    moveHeroCardDrag(event) {
      const drag = this.heroCardDrag;
      if (!drag || drag.element !== event.currentTarget || drag.pointerId !== event.pointerId) {
        if (event.pointerType === 'mouse' && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
          const rect = event.currentTarget.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width - 0.5;
          const y = (event.clientY - rect.top) / rect.height - 0.5;
          event.currentTarget.style.setProperty('--tilt-x', `${(x * 7).toFixed(2)}deg`);
          event.currentTarget.style.setProperty('--tilt-y', `${(y * -7).toFixed(2)}deg`);
          event.currentTarget.style.setProperty('--shine-x', `${((x + 0.5) * 100).toFixed(1)}%`);
          event.currentTarget.style.setProperty('--shine-y', `${((y + 0.5) * 100).toFixed(1)}%`);
          event.currentTarget.classList.add('is-pointer-tracking');
        }
        return;
      }
      event.preventDefault();
      const x = Math.max(drag.minX, Math.min(drag.maxX, drag.originX + event.clientX - drag.startX));
      const y = Math.max(drag.minY, Math.min(drag.maxY, drag.originY + event.clientY - drag.startY));
      if (Math.abs(x - drag.originX) > 4 || Math.abs(y - drag.originY) > 4) drag.element.dataset.dragged = 'true';
      drag.element.style.setProperty('--drag-x', `${x}px`);
      drag.element.style.setProperty('--drag-y', `${y}px`);
    },
    resetHeroCardTilt(event) {
      if (this.heroCardDrag?.element === event.currentTarget) return;
      event.currentTarget.style.setProperty('--tilt-x', '0deg');
      event.currentTarget.style.setProperty('--tilt-y', '0deg');
      event.currentTarget.classList.remove('is-pointer-tracking');
    },
    endHeroCardDrag(event) {
      const drag = this.heroCardDrag;
      if (!drag || drag.element !== event.currentTarget || drag.pointerId !== event.pointerId) return;
      drag.element.classList.remove('is-dragging');
      drag.element.closest('.hero-collage-stage')?.classList.remove('has-active-drag');
      if (drag.element.hasPointerCapture(event.pointerId)) drag.element.releasePointerCapture(event.pointerId);
      this.heroCardDrag = null;
    },
    nudgeHeroCard(event) {
      const keys = { ArrowUp: [0, -22], ArrowDown: [0, 22], ArrowLeft: [-22, 0], ArrowRight: [22, 0] };
      if (event.key === 'Home') {
        event.currentTarget.style.setProperty('--drag-x', '0px');
        event.currentTarget.style.setProperty('--drag-y', '0px');
        return;
      }
      const delta = keys[event.key];
      if (!delta) return;
      event.preventDefault();
      const element = event.currentTarget;
      const x = Number.parseFloat(element.style.getPropertyValue('--drag-x')) || 0;
      const y = Number.parseFloat(element.style.getPropertyValue('--drag-y')) || 0;
      element.style.setProperty('--drag-x', `${x + delta[0]}px`);
      element.style.setProperty('--drag-y', `${y + delta[1]}px`);
    },
    resetHeroGallery() {
      document.querySelectorAll('.hero-collage-stage').forEach(stage => stage.classList.remove('has-active-drag'));
      document.querySelectorAll('.hero-collage-stage .collage-card').forEach(card => {
        card.style.setProperty('--drag-x', '0px');
        card.style.setProperty('--drag-y', '0px');
        card.classList.remove('is-dragging');
      });
      this.heroCardDrag = null;
    },
    submitHeroSearch() {
      const ingredients = this.heroSearchIngredients;
      if (!ingredients.length) {
        this.heroSearchMessage = 'Masukkan atau pilih minimal satu bahan.';
        return;
      }
      const url = new URL(window.location.href);
      url.searchParams.delete('bahan');
      ingredients.forEach(ingredient => url.searchParams.append('bahan', ingredient));
      window.history.replaceState(window.history.state, '', url);
      const recipeSearch = document.getElementById('recipeSearch');
      if (recipeSearch) recipeSearch.value = ingredients.join(', ');
      this.go('resep');
    },
    findRecipesFromScan() {
      window.recordScanIngredientUsage?.();
      window.prepareScanRecipeSearch?.();
      this.go('resep');
    },
  }
}).mount('#app');
