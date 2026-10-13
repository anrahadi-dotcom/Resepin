/* Vue 3 owns the application shell and interactive hero. */
const { createApp } = Vue;

createApp({
  data() {
    return {
      photoDrag: null,
      photoOffsetX: 0,
      photoIndex: 0,
      slideDirection: '',
      heroPhotos: [
        { image: '/assets/img/sup-jagung.jpg', alt: 'Sup jagung dan wortel', title: 'Sup Jagung Wortel', time: '20 menit', difficulty: 'Mudah' },
        { image: '/assets/img/nasi-goreng.jpg', alt: 'Nasi goreng sederhana', title: 'Nasi Goreng Sederhana', time: '15 menit', difficulty: 'Mudah' },
        { image: '/assets/img/ayam-betutu.jpg', alt: 'Ayam betutu', title: 'Ayam Betutu Bali', time: '120 menit', difficulty: 'Sedang' }
      ],
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
        startX: event.clientX,
        width: bounds.width
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    movePhoto(event) {
      if (!this.photoDrag) return;
      const deltaX = event.clientX - this.photoDrag.startX;
      const maxOffset = this.photoDrag.width * 0.12;
      this.photoOffsetX = Math.max(-maxOffset, Math.min(maxOffset, deltaX));
    },
    endPhotoDrag(event) {
      if (!this.photoDrag) return;
      const { startX, width } = this.photoDrag;
      const deltaX = event.clientX - startX;
      const threshold = Math.max(55, Math.min(110, width * 0.1));
      if (Math.abs(deltaX) >= threshold) {
        this.slideDirection = deltaX < 0 ? 'slide-next' : 'slide-previous';
        const direction = deltaX < 0 ? 1 : -1;
        this.photoIndex = (this.photoIndex + direction + this.heroPhotos.length) % this.heroPhotos.length;
      }
      this.photoDrag = null;
      this.photoOffsetX = 0;
    },
    cancelPhotoDrag() {
      this.photoDrag = null;
      this.photoOffsetX = 0;
    }
  }
}).mount('#app');
