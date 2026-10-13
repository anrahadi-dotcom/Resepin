/* Vue 3 owns the application shell and interactive hero. */
const { createApp } = Vue;

createApp({
  data() {
    return {
      photoDrag: null,
      photoOffset: { x: 0, y: 0 },
      activePage: 'home',
      menuOpen: false
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
    startPhotoDrag(event) {
      if (event.button !== undefined && event.button !== 0) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      this.photoDrag = {
        pointerX: event.clientX,
        pointerY: event.clientY,
        startX: this.photoOffset.x,
        startY: this.photoOffset.y,
        maxX: bounds.width * 0.055,
        maxY: bounds.height * 0.055
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    movePhoto(event) {
      if (!this.photoDrag) return;
      const { pointerX, pointerY, startX, startY, maxX, maxY } = this.photoDrag;
      this.photoOffset.x = Math.max(-maxX, Math.min(maxX, startX + event.clientX - pointerX));
      this.photoOffset.y = Math.max(-maxY, Math.min(maxY, startY + event.clientY - pointerY));
    },
    endPhotoDrag() {
      this.photoDrag = null;
    }
  }
}).mount('#app');
