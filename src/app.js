/* Vue 3 owns the application shell and interactive hero. */
const { createApp } = Vue;

createApp({
  data() {
    return {
      photoDrag: null,
      photoOffsetX: 0,
      photoIndex: 0,
      slideDirection: '',
      heroPlaying: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      heroHovered: false,
      heroMotionTimer: null,
      heroPhotos: [
        { image: '/assets/img/teriyaki.jpg', alt: 'Hidangan ayam teriyaki dengan wijen dan nasi', title: 'Ayam Teriyaki', time: '30 menit', difficulty: 'Mudah' },
        { image: '/assets/img/pecel.jpg', alt: 'Pecel sayur dengan sambal kacang', title: 'Pecel Sayur Komplit', time: '30 menit', difficulty: 'Sedang' },
        { image: '/assets/img/ayam-bakar-bali.jpg', alt: 'Ayam bakar Bali berbumbu rempah', title: 'Ayam Bakar Bumbu Bali', time: '55 menit', difficulty: 'Sedang' }
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
        this.advancePhoto(deltaX < 0 ? 1 : -1);
      }
      this.photoDrag = null;
      this.photoOffsetX = 0;
    },
    cancelPhotoDrag() {
      this.photoDrag = null;
      this.photoOffsetX = 0;
    },
    advancePhoto(direction = 1) {
      this.slideDirection = direction < 0 ? 'slide-previous' : 'slide-next';
      this.photoIndex = (this.photoIndex + direction + this.heroPhotos.length) % this.heroPhotos.length;
    },
    toggleHeroMotion() {
      this.heroPlaying = !this.heroPlaying;
    },
    onHeroMotionTick() {
      if (this.heroPlaying && !this.heroHovered && !this.photoDrag && this.activePage === 'home' && document.visibilityState === 'visible') {
        this.advancePhoto(1);
      }
    }
  },
  mounted() {
    this.heroMotionTimer = window.setInterval(() => this.onHeroMotionTick(), 8000);
  },
  beforeUnmount() {
    window.clearInterval(this.heroMotionTimer);
  }
}).mount('#app');
