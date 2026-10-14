/* Chef Resepin's reusable Indonesian response copy. */
const CHEF_PROMPTS = {
  greeting: 'Hai! Aku Chef Resepin. Kamu bisa ceritakan bahan yang tersedia, minta ide menu, atau tanya soal teknik memasak dan penyimpanan. Kalau pertanyaanmu belum ada di aturan lokal, aku coba jawab lewat AI.',
  thanks: 'Sama-sama! 😊 Kalau ada bahan lain atau ingin mengubah resepnya, bilang saja ya.',
  help: 'Aku bisa bantu cari ide dari bahan yang tersedia, memilih resep di katalog, menyesuaikan rasa atau porsi, mencari pengganti bahan, memberi tips teknik dasar, dan menyimpan makanan dengan lebih aman. Pertanyaan yang belum tercakup akan dicoba lewat AI. Untuk saran yang pas, sebutkan bahan/masakan dan tujuanmu.',
  noIngredients: 'Nggak apa-apa 😊 Kita mulai dari yang paling sederhana. Coba cek apakah ada nasi, telur, mi, atau roti? Sebutkan satu saja yang ada—aku carikan ide paling simpel. Kalau benar-benar belum ada bahan, aku bisa bantu susun daftar belanja minimal untuk masakan yang kamu inginkan.',
  substitutionFollowup: 'Siap 😊 Sebutkan bahan yang mau diganti, nanti aku carikan pilihan yang paling cocok.',
  askMissingIngredient: 'Bisa banget! Bahan apa yang lagi kosong? Sebutkan namanya, nanti aku kasih pengganti yang paling masuk akal.',
  okay: 'Oke 😊 Mau cari ide menu, atur bahan pengganti, tanya teknik masak, atau bahas cara menyimpan makanan?',
  fallback: message => `Aku belum menangkap maksudnya dengan tepat: “${escapeHtml(message)}”. Aku bisa bantu soal ide resep, bahan pengganti, teknik memasak dasar, penyesuaian rasa/porsi, serta penyimpanan makanan. Coba sebutkan bahan atau masakan yang dimaksud dan apa yang ingin kamu ketahui.`
};
