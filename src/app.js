/* Vue 3 owns the application shell and interactive photo hero. */
const { createApp } = Vue;

createApp({
  data() {
    return {
      photoIndex: 0,
      photoDrag: null,
      heroPhotos: [
        { title: 'Teriyaki Ayam', time: '25 menit', difficulty: 'Mudah', image: '/assets/img/teriyaki.jpg', alt: 'Ayam teriyaki dengan taburan biji wijen' },
        { title: 'Pecel Sayur', time: '20 menit', difficulty: 'Mudah', image: '/assets/img/pecel.jpg', alt: 'Pecel sayur dengan saus kacang' },
        { title: 'Ayam Bakar Bali', time: '45 menit', difficulty: 'Sedang', image: '/assets/img/ayam-bakar-bali.jpg', alt: 'Ayam bakar berbumbu khas Bali' },
        { title: 'Rendang', time: '2 jam', difficulty: 'Sedang', image: '/assets/img/rendang.jpg', alt: 'Rendang sapi berbumbu rempah' }
      ],
      activePage: 'home',
      menuOpen: false
    };
  },
  computed: {
    heroRecipe() { return this.heroPhotos[this.photoIndex]; }
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
    setHeroPhoto(index) {
      this.photoIndex = (index + this.heroPhotos.length) % this.heroPhotos.length;
    },
    changeHeroPhoto(direction) {
      this.setHeroPhoto(this.photoIndex + direction);
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
