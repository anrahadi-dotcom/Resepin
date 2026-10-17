/* Chef Resepin's reusable Indonesian response copy. */
const CHEF_PROMPTS = {
  greeting: 'Hai! Aku Chef Resepin. Aku bisa bantu cari ide masakan dari bahanmu, bahas teknik dapur, atau jawab pertanyaan umum. Mau ngobrolin apa?',
  thanks: 'Sama-sama! 😊 Kalau ada bahan lain atau ingin mengubah resepnya, bilang saja ya.',
  help: 'Aku bisa bantu cari ide dari bahan yang tersedia, memilih resep di katalog, menyesuaikan rasa atau porsi, mencari pengganti bahan, memberi tips dapur, dan menjawab pertanyaan umum. Untuk hal yang perlu dicek, aku bisa mencari referensi web juga.',
  noIngredients: 'Nggak apa-apa 😊 Kita mulai dari yang paling sederhana. Coba cek apakah ada nasi, telur, mi, atau roti? Sebutkan satu saja yang ada—aku carikan ide paling simpel. Kalau benar-benar belum ada bahan, aku bisa bantu susun daftar belanja minimal untuk masakan yang kamu inginkan.',
  substitutionFollowup: 'Siap 😊 Sebutkan bahan yang mau diganti, nanti aku carikan pilihan yang paling cocok.',
  askMissingIngredient: 'Bisa banget! Bahan apa yang lagi kosong? Sebutkan namanya, nanti aku kasih pengganti yang paling masuk akal.',
  okay: 'Oke 😊 Mau cari ide menu, atur bahan pengganti, tanya teknik masak, atau bahas cara menyimpan makanan?',
  fallback: message => `Aku belum menangkap maksudnya dengan tepat: “${escapeHtml(message)}”. Aku bisa bantu soal resep dan urusan dapur, juga pertanyaan umum. Coba jelaskan sedikit konteksnya atau tulis ulang yang ingin kamu tahu.`
};
