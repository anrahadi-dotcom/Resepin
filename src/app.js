/* Vue 3 owns the application shell and interactive hero. */
const { createApp } = Vue;

createApp({
  data() {
    return {
      dragging: null,
      activePage: 'home',
      menuOpen: false,
      heroRecipeIndex: 0,
      heroRecipes: [
        { title: 'Sup Jagung & Wortel', label: 'Sup hangat', time: '20 menit', image: '/assets/img/sup-jagung.jpg', ingredients: [
          { name: 'Jagung', emoji: '🌽', x: 24, y: 28 }, { name: 'Wortel', emoji: '🥕', x: 75, y: 34 }, { name: 'Bawang', emoji: '🧅', x: 56, y: 70 }
        ] },
        { title: 'Nasi Goreng Sederhana', label: 'Nasi goreng', time: '15 menit', image: '/assets/img/nasi-goreng.jpg', ingredients: [
          { name: 'Nasi', emoji: '🍚', x: 27, y: 58 }, { name: 'Telur', emoji: '🥚', x: 72, y: 34 }, { name: 'Cabai', emoji: '🌶️', x: 58, y: 73 }
        ] },
        { title: 'Ayam Betutu', label: 'Ayam betutu', time: '60 menit', image: '/assets/img/ayam-betutu.jpg', ingredients: [
          { name: 'Ayam', emoji: '🍗', x: 45, y: 56 }, { name: 'Cabai', emoji: '🌶️', x: 73, y: 31 }, { name: 'Bawang', emoji: '🧅', x: 23, y: 69 }
        ] }
      ],
      ingredients: []
    };
  },
  computed: {
    activeHeroRecipe() {
      return this.heroRecipes[this.heroRecipeIndex];
    }
  },
  mounted() {
    this.setHeroRecipe(0);
  },
  methods: {
    go(page) {
      this.activePage = page;
      this.menuOpen = false;
      window.showPage(page);
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
    setHeroRecipe(index) {
      this.heroRecipeIndex = index;
      this.ingredients = this.activeHeroRecipe.ingredients.map(item => ({ ...item }));
    },
    startDrag(event, item) {
      this.dragging = item.name;
      event.currentTarget.setPointerCapture(event.pointerId);
      this.moveIngredient(event);
    },
    moveIngredient(event) {
      if (!this.dragging) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      const item = this.ingredients.find(entry => entry.name === this.dragging);
      item.x = Math.max(8, Math.min(92, ((event.clientX - bounds.left) / bounds.width) * 100));
      item.y = Math.max(12, Math.min(88, ((event.clientY - bounds.top) / bounds.height) * 100));
    },
    endDrag() {
      this.dragging = null;
    }
  }
}).mount('#app');
