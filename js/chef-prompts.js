/* Chef Resepin's reusable Indonesian response copy. */
const CHEF_PROMPTS = {
  greeting: 'Hai! 👋 Aku Chef Resepin. Kamu lagi punya bahan apa, atau mau tanya soal resep dan substitusi?',
  thanks: 'Sama-sama! 😊 Kalau ada bahan lain atau ingin mengubah resepnya, bilang saja ya.',
  help: 'Aku Chef Resepin. Aku bisa bantu mencari ide resep dari bahan yang tersedia, memberi tips memasak, dan menyarankan pengganti bahan. Coba sebutkan bahan atau pertanyaanmu.',
  noIngredients: 'Nggak apa-apa 😊 Kita mulai dari yang paling sederhana. Coba cek apakah ada nasi, telur, mi, atau roti? Sebutkan satu saja yang ada—aku carikan ide paling simpel. Kalau benar-benar belum ada bahan, aku bisa bantu susun daftar belanja minimal untuk masakan yang kamu inginkan.',
  substitutionFollowup: 'Siap 😊 Sebutkan bahan yang mau diganti, nanti aku carikan pilihan yang paling cocok.',
  askMissingIngredient: 'Bisa banget! Bahan apa yang lagi kosong? Sebutkan namanya, nanti aku kasih pengganti yang paling masuk akal.',
  okay: 'Oke 😊 Mau cari resep, tanya pengganti bahan, atau ceritakan bahan yang ada di dapur?',
  fallback: message => `Aku menangkap pesanmu: “${escapeHtml(message)}”. Aku khusus membantu soal resep dan memasak. Ceritakan bahan yang tersedia atau tanyakan resep, cara memasak, maupun pengganti bahan supaya aku bisa memberi saran yang tepat.`
};
