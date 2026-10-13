/* Vue 3 owns the application shell and interactive hero. */
const { createApp } = Vue;

createApp({
  data() {
    return {
      dragging: null,
      activePage: 'home',
      menuOpen: false,
      ingredients: [
        { name: 'Jagung', emoji: '🌽', x: 24, y: 28 },
        { name: 'Wortel', emoji: '🥕', x: 75, y: 34 },
        { name: 'Bawang', emoji: '🧅', x: 56, y: 70 }
      ]
    };
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
