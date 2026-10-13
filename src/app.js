/* Vue 3 owns the application shell and interactive hero. */
const { createApp } = Vue;

createApp({
  data() {
    return {
      videoDrag: null,
      videoProgress: 0,
      videoDuration: 0,
      heroPlaying: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      heroRecipe: { title: 'Tumis Sayur', time: '15 menit', difficulty: 'Mudah' },
      activePage: 'home',
      menuOpen: false
    };
  },
  methods: {
    go(page) {
      this.activePage = page;
      this.menuOpen = false;
      window.showPage(page);
      this.$nextTick(this.syncHeroVideo);
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
    startVideoScrub(event) {
      if (event.button !== undefined && event.button !== 0) return;
      const video = this.$refs.heroVideo;
      if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      this.videoDrag = {
        startX: event.clientX,
        width: bounds.width,
        startTime: video.currentTime,
        wasPlaying: !video.paused
      };
      video.pause();
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    moveVideoScrub(event) {
      if (!this.videoDrag) return;
      const video = this.$refs.heroVideo;
      const deltaX = event.clientX - this.videoDrag.startX;
      const seekOffset = deltaX / this.videoDrag.width * video.duration;
      video.currentTime = (this.videoDrag.startTime + seekOffset + video.duration) % video.duration;
    },
    endVideoScrub() {
      if (!this.videoDrag) return;
      const { wasPlaying } = this.videoDrag;
      this.videoDrag = null;
      if (wasPlaying && this.heroPlaying && this.activePage === 'home') this.$refs.heroVideo.play().catch(() => {});
    },
    cancelVideoScrub() {
      this.endVideoScrub();
    },
    seekHeroVideo(seconds) {
      const video = this.$refs.heroVideo;
      if (!video || !Number.isFinite(video.duration)) return;
      video.currentTime = (video.currentTime + seconds + video.duration) % video.duration;
    },
    toggleHeroMotion() {
      this.heroPlaying = !this.heroPlaying;
      this.syncHeroVideo();
    },
    syncHeroVideo() {
      const video = this.$refs.heroVideo;
      if (!video) return;
      if (this.heroPlaying && this.activePage === 'home' && document.visibilityState === 'visible') {
        video.play().catch(() => { this.heroPlaying = false; });
      } else {
        video.pause();
      }
    },
    onHeroVideoLoaded() {
      this.videoDuration = this.$refs.heroVideo?.duration || 0;
      this.syncHeroVideo();
    },
    onHeroVideoTimeUpdate() {
      const video = this.$refs.heroVideo;
      if (video && video.duration) this.videoProgress = video.currentTime / video.duration;
    }
  },
  mounted() {
    this.syncHeroVideo();
  },
  beforeUnmount() { this.$refs.heroVideo?.pause(); }
}).mount('#app');
