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
      menuOpen: false
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
  mounted() {
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
  methods: {
    go(page) {
      this.activePage = page;
      this.menuOpen = false;
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
      this.go('resep');
    },
  }
}).mount('#app');
