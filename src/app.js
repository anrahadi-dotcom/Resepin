/* Vue 3 owns the application shell and ingredient search in the hero. */
const { createApp } = Vue;

createApp({
  data() {
    return {
      heroIngredientText: '',
      heroSelectedIngredients: [],
      heroSearchMessage: '',
      heroVideoPlaying: false,
      heroVideoUserChoice: null,
      heroIngredientOptions: ['Nasi', 'Telur', 'Cabai', 'Tahu', 'Ayam', 'Tempe', 'Jagung', 'Wortel'],
      heroDropActive: false,
      heroFavoriteOrder: [19, 23, 28],
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
    },
    activePage() {
      this.$nextTick(() => this.syncHeroVideo());
    }
  },
  mounted() {
    window.resepinApp = this;
    document.addEventListener('click', this.closeMenuOnOutside);
    document.addEventListener('keydown', this.closeMenuOnEscape);
    document.addEventListener('visibilitychange', this.syncHeroVideo);
    this.$nextTick(() => {
      window.refreshMotionReveals?.();
      this.syncHeroVideo();
      this.heroFavoriteTimer = window.setInterval(() => {
        if (this.activePage !== 'home' || document.hidden || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
        this.shuffleHeroFavorites();
      }, 5200);
    });
  },
  beforeUnmount() {
    if (this.heroFavoriteTimer) window.clearInterval(this.heroFavoriteTimer);
    document.removeEventListener('click', this.closeMenuOnOutside);
    document.removeEventListener('keydown', this.closeMenuOnEscape);
    document.removeEventListener('visibilitychange', this.syncHeroVideo);
  },
  methods: {
    syncHeroVideo() {
      const video = document.querySelector('.hero-scene-video');
      if (!video) return;
      const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const optedInToMotion = this.heroVideoUserChoice === 'playing';
      const shouldPlay = this.activePage === 'home'
        && !document.hidden
        && this.heroVideoUserChoice !== 'paused'
        && (!reducedMotion || optedInToMotion);
      if (!shouldPlay) {
        video.pause();
        this.heroVideoPlaying = false;
        return;
      }
      video.muted = true;
      video.play().then(() => {
        this.heroVideoPlaying = true;
      }).catch(() => {
        this.heroVideoPlaying = false;
      });
    },
    toggleHeroVideo() {
      this.heroVideoUserChoice = this.heroVideoPlaying ? 'paused' : 'playing';
      this.syncHeroVideo();
    },
    searchHeroDemo() {
      this.heroIngredientText = '';
      this.heroSearchMessage = '';
      this.$nextTick(() => this.submitHeroSearch());
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
      this.$nextTick(() => window.refreshMotionReveals?.());
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
        this.$nextTick(() => document.getElementById('miniChatInput')?.focus());
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
    dropHeroIngredient(event) {
      const ingredient = event.dataTransfer.getData('text/plain');
      if (this.heroIngredientOptions.includes(ingredient) && !this.heroSelectedIngredients.includes(ingredient)) {
        this.heroSelectedIngredients = [...this.heroSelectedIngredients, ingredient];
      }
      this.heroDropActive = false;
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
