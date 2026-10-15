/* Vue 3 owns the application shell and ingredient search in the hero. */
const { createApp } = Vue;

createApp({
  data() {
    return {
      heroIngredientText: '',
      heroSelectedIngredients: [],
      heroSearchMessage: '',
      popularIngredients: ['Telur', 'Ayam', 'Tahu', 'Nasi', 'Tempe'],
      activePage: 'home',
      menuOpen: false,
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
    }
  },
  watch: {
    floatingChefChatOpen(isOpen, wasOpen) {
      if (!isOpen && wasOpen) this.$nextTick(() => document.querySelector('.floating-chef-button')?.focus());
    }
  },
  mounted() {
    window.resepinApp = this;
    this.$nextTick(() => window.refreshMotionReveals?.());
  },
  methods: {
    go(page) {
      this.floatingChefChatOpen = false;
      this.menuOpen = false;
      window.navigateToPage(page);
      this.$nextTick(() => window.refreshMotionReveals?.());
    },
    toggleMenu() {
      this.menuOpen = !this.menuOpen;
      window.toggleMenu();
    },
    toggleFloatingChefChat() {
      this.floatingChefChatOpen = !this.floatingChefChatOpen;
      if (this.floatingChefChatOpen) {
        this.$nextTick(() => document.getElementById('miniChatInput')?.focus());
      }
    },
    trapFloatingChatFocus(event) {
      if (event.key !== 'Tab') return;
      const panel = event.currentTarget;
      const focusable = [...panel.querySelectorAll('button:not([disabled]), textarea:not([disabled]), input:not([disabled]), a[href]')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
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
