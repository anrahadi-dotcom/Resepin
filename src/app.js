/* Vue 3 owns the application shell and interactive photo hero. */
const { createApp } = Vue;

createApp({
  data() {
    return {
      photoIndex: 0,
      photoDrag: null,
      heroPaused: false,
      heroHovering: false,
      heroFocusWithin: false,
      heroRotationTimer: null,
      heroProgressFrame: null,
      heroProgress: 0,
      heroSlideDuration: 6500,
      heroRemainingMs: 6500,
      heroDeadline: 0,
      heroReducedMotion: false,
      heroVisibilityHandler: null,
      heroMotionQuery: null,
      heroMotionChangeHandler: null,
      heroIngredientText: '',
      heroSelectedIngredients: [],
      heroSearchMessage: '',
      popularIngredients: ['Telur', 'Ayam', 'Tahu', 'Nasi', 'Tempe'],
      heroPhotos: [
        { title: 'Teriyaki Ayam', time: '25 menit', difficulty: 'Mudah', recipeId: 28, image: '/assets/img/teriyaki.jpg', alt: 'Ayam teriyaki dengan taburan biji wijen' },
        { title: 'Pecel Sayur', time: '20 menit', difficulty: 'Mudah', recipeId: 9, image: '/assets/img/pecel.jpg', alt: 'Pecel sayur dengan saus kacang' },
        { title: 'Ayam Bakar Bali', time: '45 menit', difficulty: 'Sedang', recipeId: 17, image: '/assets/img/ayam-bakar-bali.jpg', alt: 'Ayam bakar berbumbu khas Bali' },
        { title: 'Rendang', time: '2 jam', difficulty: 'Sedang', recipeId: 12, image: '/assets/img/rendang.jpg', alt: 'Rendang sapi berbumbu rempah' }
      ],
      activePage: 'home',
      menuOpen: false
    };
  },
  computed: {
    heroRecipe() { return this.heroPhotos[this.photoIndex]; },
    heroRecipeData() { return RECIPES_DB.find(recipe => recipe.id === this.heroRecipe.recipeId) || null; },
    heroIngredientCount() { return Array.isArray(this.heroRecipeData?.ingredients) ? this.heroRecipeData.ingredients.length : null; },
    heroSearchIngredients() {
      const typed = this.heroIngredientText.split(/[,;\n]+/).map(value => value.trim()).filter(Boolean);
      const unique = new Map();
      [...this.heroSelectedIngredients, ...typed].forEach(value => {
        const key = value.toLocaleLowerCase('id');
        if (!unique.has(key)) unique.set(key, value);
      });
      return [...unique.values()];
    }
  },
  mounted() {
    this.heroMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.heroReducedMotion = this.heroMotionQuery.matches;
    this.heroVisibilityHandler = () => {
      if (document.hidden) this.freezeHeroRotation();
      else this.startHeroRotation();
    };
    this.heroMotionChangeHandler = event => {
      this.heroReducedMotion = event.matches;
      if (event.matches) {
        this.freezeHeroRotation();
        this.heroProgress = 0;
        this.heroRemainingMs = this.heroSlideDuration;
      } else this.startHeroRotation();
    };
    document.addEventListener('visibilitychange', this.heroVisibilityHandler);
    this.heroMotionQuery.addEventListener?.('change', this.heroMotionChangeHandler);
    this.startHeroRotation();
    const initialIngredients = new URLSearchParams(window.location.search).getAll('bahan').map(value => value.trim()).filter(Boolean);
    if (initialIngredients.length) {
      this.heroIngredientText = initialIngredients.join(', ');
      this.activePage = 'resep';
      window.showPage('resep');
      const recipeSearch = document.getElementById('recipeSearch');
      if (recipeSearch) recipeSearch.value = initialIngredients.join(', ');
      const restoreRecipeRoute = () => {
        this.activePage = 'resep';
        window.showPage('resep');
        this.$nextTick(() => window.refreshMotionReveals?.());
      };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', restoreRecipeRoute, { once: true });
    }
    this.$nextTick(() => window.refreshMotionReveals?.());
  },
  beforeUnmount() {
    this.freezeHeroRotation();
    document.removeEventListener('visibilitychange', this.heroVisibilityHandler);
    this.heroMotionQuery?.removeEventListener?.('change', this.heroMotionChangeHandler);
  },
  methods: {
    go(page) {
      this.activePage = page;
      this.menuOpen = false;
      if (page === 'home') this.startHeroRotation();
      else this.freezeHeroRotation();
      window.showPage(page);
      this.$nextTick(() => window.refreshMotionReveals?.());
    },
    toggleMenu() {
      this.menuOpen = !this.menuOpen;
      window.toggleMenu();
    },
    toggleTheme() {
      window.toggleTheme();
    },
    closeModalAndGo(page) {
      window.closeRecipeModal();
      this.go(page);
    },
    setHeroPhoto(index) {
      this.photoIndex = (index + this.heroPhotos.length) % this.heroPhotos.length;
      this.heroProgress = 0;
      this.heroRemainingMs = this.heroSlideDuration;
      this.freezeHeroRotation();
      this.startHeroRotation();
    },
    changeHeroPhoto(direction) {
      this.setHeroPhoto(this.photoIndex + direction);
    },
    startHeroRotation() {
      if (this.heroRotationTimer || this.heroReducedMotion || document.hidden || this.heroPaused || this.activePage !== 'home') return;
      const duration = Math.max(0, this.heroRemainingMs);
      this.heroDeadline = performance.now() + duration;
      this.heroRotationTimer = window.setTimeout(() => {
        this.heroRotationTimer = null;
        this.changeHeroPhoto(1);
      }, duration);
      const updateProgress = () => {
        if (!this.heroRotationTimer) return;
        this.heroProgress = Math.min(1, 1 - Math.max(0, this.heroDeadline - performance.now()) / this.heroSlideDuration);
        this.heroProgressFrame = window.requestAnimationFrame(updateProgress);
      };
      this.heroProgressFrame = window.requestAnimationFrame(updateProgress);
    },
    freezeHeroRotation() {
      if (this.heroRotationTimer) {
        this.heroRemainingMs = Math.max(0, this.heroDeadline - performance.now());
        window.clearTimeout(this.heroRotationTimer);
        this.heroRotationTimer = null;
      }
      if (this.heroProgressFrame) {
        window.cancelAnimationFrame(this.heroProgressFrame);
        this.heroProgressFrame = null;
      }
    },
    syncHeroPause() {
      const paused = this.heroHovering || this.heroFocusWithin;
      if (paused === this.heroPaused) return;
      this.heroPaused = paused;
      if (paused) this.freezeHeroRotation();
      else this.startHeroRotation();
    },
    pauseHeroRotation(reason) {
      if (reason === 'focus') this.heroFocusWithin = true;
      else this.heroHovering = true;
      this.syncHeroPause();
    },
    resumeHeroRotation(reason) {
      if (reason === 'focus') this.heroFocusWithin = false;
      else this.heroHovering = false;
      this.syncHeroPause();
    },
    handleHeroFocusOut(event) {
      if (!event.currentTarget.contains(event.relatedTarget)) this.resumeHeroRotation('focus');
    },
    toggleHeroIngredient(ingredient) {
      this.heroSelectedIngredients = this.heroSelectedIngredients.includes(ingredient)
        ? this.heroSelectedIngredients.filter(item => item !== ingredient)
        : [...this.heroSelectedIngredients, ingredient];
      this.heroSearchMessage = '';
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
    openHeroRecipe() {
      const recipeIndex = RECIPES_DB.findIndex(recipe => recipe.id === this.heroRecipe.recipeId);
      if (recipeIndex >= 0) window.openRecipeByIndex(recipeIndex);
    },
    startPhotoDrag(event) {
      if (event.button !== undefined && event.button !== 0) return;
      this.photoDrag = { startX: event.clientX, moved: false };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    movePhotoDrag(event) {
      if (!this.photoDrag) return;
      if (Math.abs(event.clientX - this.photoDrag.startX) > 12) this.photoDrag.moved = true;
    },
    endPhotoDrag(event) {
      if (!this.photoDrag) return;
      const delta = event.clientX - this.photoDrag.startX;
      const moved = this.photoDrag.moved;
      this.photoDrag = null;
      if (moved && Math.abs(delta) > 48) this.changeHeroPhoto(delta < 0 ? 1 : -1);
    },
    cancelPhotoDrag() {
      this.photoDrag = null;
    }
  }
}).mount('#app');
