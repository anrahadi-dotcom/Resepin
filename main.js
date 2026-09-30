/* ============================
   RESEPIN — app.js
   Complete SPA JavaScript
   ============================ */

// ============================================================
// DATA: Recipe Database
// ============================================================
// Foto: hidangan sudah matang / hasil akhir (/assets/img/<slug>.jpg)
const RECIPE_IMAGES = {
  1: "sup-jagung", 2: "nasi-goreng", 3: "tumis-kangkung", 4: "tempe-orek",
  5: "capcay", 6: "soto-ayam", 7: "tahu-bacem", 8: "mie-goreng",
  9: "pecel", 10: "balado-telur", 11: "sayur-lodeh", 12: "rendang",
  13: "coto-makassar", 14: "babi-guling", 15: "ayam-betutu", 16: "ayam-sere-lemo",
  17: "ayam-bakar-bali", 18: "lawar", 19: "ayam-bakar-kecap", 20: "fried-chicken",
  21: "pizza-teflon", 22: "burger", 23: "spaghetti", 24: "ramen",
  25: "sushi", 26: "taco", 27: "pancake", 28: "teriyaki", 29: "sate-lilit"
};

const RECIPES_DB = [
  {
    id: 1,
    title: "Sup Jagung Wortel",
    emoji: "🌽🥕",
    gradient: "linear-gradient(135deg,#e67e22,#f39c12)",
    time: "20 mnt",
    servings: "2 Porsi",
    calories: "180 kal",
    difficulty: "Mudah",
    tags: ["Zero Waste", "Sehat", "Berkuah"],
    ingredients: ["🌽 Jagung", "🥕 Wortel", "🧅 Bawang Merah", "🧄 Bawang Putih", "🧂 Garam"],
    steps: ["Potong jagung dan wortel ukuran sedang", "Tumis bawang merah dan bawang putih hingga harum", "Masukkan wortel dan jagung, aduk rata", "Tuang air 500ml, masak hingga mendidih", "Beri garam dan merica secukupnya, sajikan hangat"]
  },
  {
    id: 2,
    title: "Nasi Goreng Sederhana",
    emoji: "🍚🥚",
    gradient: "linear-gradient(135deg,#8e44ad,#9b59b6)",
    time: "15 mnt",
    servings: "1 Porsi",
    calories: "320 kal",
    difficulty: "Mudah",
    tags: ["Sarapan", "Cepat"],
    ingredients: ["🍚 Nasi", "🥚 Telur", "🧅 Bawang", "🌶️ Cabai", "🫙 Kecap Manis"],
    steps: ["Siapkan nasi yang sudah dingin (lebih baik dari kemarin)", "Goreng telur orak-arik setengah matang", "Masukkan bawang dan cabai, tumis hingga harum", "Masukkan nasi, aduk rata dengan api besar", "Tambahkan kecap manis, garam, dan lada secukupnya"]
  },
  {
    id: 3,
    title: "Tumis Kangkung Terasi",
    emoji: "🥬🌶️",
    gradient: "linear-gradient(135deg,#27ae60,#2ecc71)",
    time: "10 mnt",
    servings: "2 Porsi",
    calories: "95 kal",
    difficulty: "Mudah",
    tags: ["Sayur", "Cepat", "Sehat"],
    ingredients: ["🥬 Kangkung", "🧄 Bawang Putih", "🌶️ Cabai", "🦐 Terasi", "🧂 Garam"],
    steps: ["Cuci bersih kangkung, petik daunnya saja", "Geprek bawang putih, iris cabai serong", "Tumis bawang dan cabai dengan sedikit minyak", "Masukkan terasi, hancurkan sambil ditumis", "Masukkan kangkung, masak 2 menit, sajikan segera"]
  },
  {
    id: 4,
    title: "Tempe Orek Pedas",
    emoji: "🧱🌶️",
    gradient: "linear-gradient(135deg,#e74c3c,#c0392b)",
    time: "25 mnt",
    servings: "3 Porsi",
    calories: "240 kal",
    difficulty: "Sedang",
    tags: ["Lauk", "Pedas"],
    ingredients: ["🧱 Tempe", "🌶️ Cabai Merah", "🧅 Bawang Merah", "🫙 Kecap Manis", "🧂 Gula Merah"],
    steps: ["Potong tempe dadu kecil, goreng hingga kering dan kekuningan", "Haluskan cabai, bawang merah, dan bawang putih", "Tumis bumbu halus dengan sedikit minyak hingga harum", "Masukkan kecap manis, gula merah, dan sedikit air", "Masukkan tempe goreng, aduk hingga bumbu meresap dan kering"]
  },
  {
    id: 5,
    title: "Capcay Kuah Segar",
    emoji: "🥦🥕",
    gradient: "linear-gradient(135deg,#1abc9c,#16a085)",
    time: "20 mnt",
    servings: "4 Porsi",
    calories: "150 kal",
    difficulty: "Mudah",
    tags: ["Sehat", "Sayur", "Berkuah"],
    ingredients: ["🥦 Brokoli", "🥕 Wortel", "🫑 Paprika", "🍄 Jamur Tiram", "🧄 Bawang Putih"],
    steps: ["Potong semua sayuran sesuai selera (jangan terlalu kecil)", "Tumis bawang putih hingga harum dengan api sedang", "Masukkan wortel dan jamur dahulu (butuh waktu lebih)", "Tuang kaldu ayam 400ml, masak 8 menit", "Masukkan brokoli dan paprika, tambah maizena untuk kuah kental"]
  },
  {
    id: 6,
    title: "Soto Ayam Bening",
    emoji: "🍗🌿",
    gradient: "linear-gradient(135deg,#f39c12,#d68910)",
    time: "45 mnt",
    servings: "4 Porsi",
    calories: "280 kal",
    difficulty: "Sedang",
    tags: ["Berkuah", "Soto"],
    ingredients: ["🍗 Ayam", "🥬 Sawi", "🥕 Wortel", "🧅 Bawang", "🌿 Daun Salam"],
    steps: ["Rebus ayam dengan air 1.5L hingga empuk sekitar 30 menit", "Angkat ayam, suwir-suwir dagingnya", "Tumis bumbu halus (bawang, kunyit, jahe) hingga matang", "Masukkan tumisan bumbu ke kaldu, tambah daun salam", "Masukkan sawi dan wortel, masak 5 menit. Sajikan dengan suwiran ayam"]
  },
  {
    id: 7,
    title: "Tahu Bacem Manis",
    emoji: "🟨🌿",
    gradient: "linear-gradient(135deg,#f1c40f,#d4a017)",
    time: "30 mnt",
    servings: "4 Porsi",
    calories: "200 kal",
    difficulty: "Mudah",
    tags: ["Lauk", "Manis"],
    ingredients: ["🥚 Tahu Putih", "🌿 Daun Salam", "🫙 Kecap Manis", "🧂 Gula Merah", "🧄 Bawang Putih"],
    steps: ["Potong tahu menjadi segitiga atau persegi", "Masukkan semua bumbu ke dalam panci", "Tambahkan air hingga tahu terendam setengah", "Rebus dengan api kecil hingga bumbu meresap (25 mnt)", "Goreng sebentar hingga kecoklatan, sajikan"]
  },
  {
    id: 8,
    title: "Mie Goreng Jawa",
    emoji: "🍜🥚",
    gradient: "linear-gradient(135deg,#d35400,#e67e22)",
    time: "20 mnt",
    servings: "2 Porsi",
    calories: "410 kal",
    difficulty: "Mudah",
    tags: ["Sarapan", "Cepat", "Pedas"],
    ingredients: ["🍜 Mie Kuning", "🥚 Telur", "🥬 Sawi", "🧅 Bawang", "🌶️ Cabai"],
    steps: ["Rebus mie hingga matang, tiriskan dan sisihkan", "Goreng telur orak-arik, angkat dan sisihkan", "Tumis bawang merah, bawang putih, dan cabai", "Masukkan mie dan telur, aduk dengan kecap dan kecap ikan", "Masukkan sawi, masak hingga layu. Sajikan panas"]
  },
  {
    id: 9,
    title: "Pecel Sayur Komplit",
    emoji: "🥜🥬",
    gradient: "linear-gradient(135deg,#8B4513,#A0522D)",
    time: "30 mnt",
    servings: "2 Porsi",
    calories: "220 kal",
    difficulty: "Sedang",
    tags: ["Sehat", "Sayur", "Tradisional"],
    ingredients: ["🥜 Kacang Tanah", "🥬 Bayam", "🫘 Kacang Panjang", "🌶️ Cabai", "🍋 Jeruk Nipis"],
    steps: ["Rebus kacang tanah, haluskan bersama cabai dan gula", "Tambahkan air jeruk nipis dan garam ke sambal kacang", "Rebus bayam dan kacang panjang sebentar saja", "Tata sayuran di piring", "Siram dengan saus kacang, sajikan dengan lontong"]
  },
  {
    id: 10,
    title: "Balado Telur Puyuh",
    emoji: "🥚🌶️",
    gradient: "linear-gradient(135deg,#c0392b,#e74c3c)",
    time: "25 mnt",
    servings: "3 Porsi",
    calories: "190 kal",
    difficulty: "Mudah",
    tags: ["Lauk", "Pedas", "Telur"],
    ingredients: ["🥚 Telur Puyuh", "🌶️ Cabai Merah", "🧅 Bawang Merah", "🍅 Tomat", "🧂 Garam"],
    steps: ["Rebus telur puyuh hingga matang, kupas kulitnya", "Goreng telur sebentar hingga kekuningan", "Haluskan cabai, bawang merah, dan tomat", "Tumis bumbu halus hingga matang dan minyak keluar", "Masukkan telur, aduk rata dengan bumbu. Sajikan"]
  },
  {
    id: 11,
    title: "Sayur Lodeh Nangka",
    emoji: "🫘🥥",
    gradient: "linear-gradient(135deg,#27ae60,#1e8449)",
    time: "50 mnt",
    servings: "4 Porsi",
    calories: "310 kal",
    difficulty: "Sedang",
    tags: ["Berkuah", "Tradisional", "Sayur"],
    ingredients: ["🫘 Nangka Muda", "🥥 Santan", "🌿 Daun Salam", "🧅 Bawang", "🌶️ Cabai"],
    steps: ["Potong nangka muda, buang bijinya", "Haluskan bumbu: bawang, cabai, kunyit, dan kemiri", "Tumis bumbu halus bersama daun salam", "Masukkan nangka, aduk rata dengan bumbu", "Tuang santan, masak hingga nangka empuk sambil diaduk"]
  },
  {
    id: 12,
    title: "Rendang Singkat",
    emoji: "🥩🌶️",
    gradient: "linear-gradient(135deg,#6D4C41,#4E342E)",
    time: "60 mnt",
    servings: "4 Porsi",
    calories: "420 kal",
    difficulty: "Sulit",
    tags: ["Lauk", "Tradisional", "Pedas"],
    ingredients: ["🥩 Daging Sapi", "🌶️ Cabai Merah", "🥥 Santan", "🌿 Daun Jeruk", "🧄 Bawang Putih"],
    steps: ["Potong daging sapi kotak, lumuri garam dan merica", "Haluskan semua bumbu rendang (cabai, bawang, jahe)", "Masak santan bersama bumbu hingga mendidih", "Masukkan daging, masak dengan api sedang", "Aduk terus hingga santan menyusut dan daging kecoklatan"]
  },
  {
    id: 13,
    title: "Coto Makassar",
    emoji: "🍲🥜",
    gradient: "linear-gradient(135deg,#795548,#4e342e)",
    time: "90 mnt",
    servings: "4 Porsi",
    calories: "350 kal",
    difficulty: "Sedang",
    tags: ["Tradisional", "Berkuah", "Sulawesi"],
    ingredients: ["🥩 Daging sapi", "🥜 Kacang tanah sangrai", "🧅 Bawang merah", "🧄 Bawang putih", "🌿 Serai dan lengkuas", "🌾 Ketumbar, jintan, dan merica", "🧂 Garam", "🍚 Air cucian beras (opsional)"],
    steps: ["Rebus daging sapi sampai empuk; sisihkan kaldunya dan potong daging", "Sangrai kacang tanah, lalu haluskan", "Haluskan bawang merah, bawang putih, ketumbar, jintan, merica, dan lengkuas", "Tumis bumbu bersama serai hingga harum, lalu masukkan ke dalam kaldu", "Masukkan kacang halus dan daging; masak perlahan sampai kuah menyatu, bumbui garam", "Sajikan hangat dengan buras atau ketupat, jeruk nipis, dan sambal"]
  },
  {
    id: 14, title: "Babi Guling Bali (Versi Rumahan)", emoji: "🐖🔥", gradient: "linear-gradient(135deg,#a8432e,#66352b)", time: "150 mnt", servings: "6 Porsi", calories: "480 kal", difficulty: "Sulit", tags: ["Bali", "Tradisional", "Lauk"],
    ingredients: ["🐖 Daging babi dengan kulit", "🧄 Bawang putih", "🧅 Bawang merah", "🌶️ Cabai", "🫚 Kunyit dan jahe", "🌿 Serai dan daun jeruk", "🧂 Garam", "🍋 Jeruk limau"],
    steps: ["Haluskan bawang, cabai, kunyit, jahe, dan garam sebagai bumbu genep sederhana", "Sayat bagian daging agar bumbu meresap, lalu lumuri daging dan bagian dalamnya", "Diamkan di kulkas minimal 2 jam agar bumbu meresap", "Panggang potongan daging berbumbu dalam oven 180°C sampai matang; sesekali olesi minyak", "Naikkan panas sebentar di akhir untuk membantu kulit garing, awasi agar tidak gosong", "Istirahatkan daging 10 menit sebelum dipotong; sajikan dengan nasi, lawar, dan sambal" ]
  },
  {
    id: 15, title: "Ayam Betutu Bali", emoji: "🍗🌶️", gradient: "linear-gradient(135deg,#b55a31,#6f3b2d)", time: "120 mnt", servings: "4 Porsi", calories: "390 kal", difficulty: "Sedang", tags: ["Bali", "Tradisional", "Pedas"],
    ingredients: ["🍗 Ayam utuh atau potongan", "🧅 Bawang merah", "🧄 Bawang putih", "🌶️ Cabai", "🫚 Jahe dan kunyit", "🌿 Serai dan daun jeruk", "🥥 Minyak atau sedikit santan", "🧂 Garam"],
    steps: ["Haluskan bawang, cabai, jahe, kunyit, dan garam; tumis hingga harum", "Lumuri ayam dengan bumbu sampai merata, termasuk bagian bawah kulit", "Bungkus rapat dengan daun pisang atau tutup loyang", "Panggang pada 170°C sekitar 90 menit, atau kukus lalu panggang sampai ayam matang dan empuk", "Buka bungkus dengan hati-hati, siram ayam dengan sari bumbunya", "Sajikan dengan nasi hangat dan sayur urap" ]
  },
  {
    id: 16, title: "Ayam Sere Lemo (Ayam Sisit Bali)", emoji: "🍗🍋", gradient: "linear-gradient(135deg,#df7044,#9b3f30)", time: "40 mnt", servings: "3 Porsi", calories: "290 kal", difficulty: "Mudah", tags: ["Bali", "Pedas", "Cepat"],
    ingredients: ["🍗 Ayam rebus suwir", "🌶️ Cabai merah dan rawit", "🦐 Terasi bakar (sere)", "🍋 Jeruk lemo/limau", "🧄 Bawang putih", "🧅 Bawang merah", "🌿 Serai", "🧂 Garam"],
    steps: ["Rebus ayam dengan garam sampai matang, dinginkan lalu suwir-suwir", "Ulek cabai, bawang, dan terasi bakar; tumis bersama serai sampai matang", "Masukkan ayam suwir dan aduk sampai bumbu melapisi ayam", "Koreksi garam dan matikan api", "Peras jeruk lemo setelah api mati agar aromanya tetap segar", "Nikmati dengan nasi hangat dan sayur" ]
  },
  {
    id: 17, title: "Ayam Bakar Bumbu Bali", emoji: "🍗🔥", gradient: "linear-gradient(135deg,#d6652f,#8c3a27)", time: "55 mnt", servings: "4 Porsi", calories: "330 kal", difficulty: "Sedang", tags: ["Bali", "Bakar", "Lauk"],
    ingredients: ["🍗 Paha ayam", "🧅 Bawang merah", "🧄 Bawang putih", "🌶️ Cabai", "🫚 Kunyit dan jahe", "🌿 Serai dan daun jeruk", "🫙 Kecap manis", "🧂 Garam"],
    steps: ["Haluskan bawang, cabai, kunyit, jahe, dan garam", "Tumis bumbu bersama serai dan daun jeruk sampai harum", "Masukkan ayam dan sedikit air; ungkep tertutup sampai empuk", "Tambahkan kecap, masak sampai bumbu mengental", "Bakar ayam sambil dioles sisa bumbu sampai ada bagian kecokelatan", "Sajikan dengan sambal matah atau lalapan" ]
  },
  {
    id: 18, title: "Lawar Sayur Bali", emoji: "🥬🥥", gradient: "linear-gradient(135deg,#558b48,#315a3a)", time: "35 mnt", servings: "4 Porsi", calories: "210 kal", difficulty: "Sedang", tags: ["Bali", "Sayur", "Tradisional", "Vegetarian"],
    ingredients: ["🥬 Kacang panjang", "🥬 Nangka muda atau tauge", "🥥 Kelapa parut", "🧄 Bawang putih", "🧅 Bawang merah", "🌶️ Cabai", "🌿 Kencur dan daun jeruk", "🧂 Garam dan jeruk limau"],
    steps: ["Rebus kacang panjang dan nangka sampai empuk, tiriskan lalu cincang kasar", "Sangrai kelapa parut sebentar sampai harum", "Tumis bumbu halus bawang, cabai, dan kencur sampai matang", "Campur sayur, kelapa, bumbu, garam, dan sedikit perasan jeruk limau", "Cicipi dan sesuaikan rasa; sajikan segera sebagai lawar sayur tanpa daging" ]
  },
  {
    id: 19, title: "Ayam Bakar Kecap", emoji: "🍗🍯", gradient: "linear-gradient(135deg,#b65b2b,#713b28)", time: "50 mnt", servings: "4 Porsi", calories: "340 kal", difficulty: "Mudah", tags: ["Favorit", "Bakar", "Lauk"],
    ingredients: ["🍗 Paha ayam", "🫙 Kecap manis", "🧄 Bawang putih", "🧅 Bawang merah", "🫚 Jahe", "🍋 Jeruk nipis", "🧂 Garam dan merica"],
    steps: ["Lumuri ayam dengan jeruk nipis, garam, dan merica selama 10 menit", "Tumis bawang dan jahe halus, tambahkan kecap dan sedikit air", "Ungkep ayam dalam bumbu sampai matang dan bumbu menyusut", "Bakar sambil dioles bumbu hingga harum dan sedikit karamel", "Pastikan bagian dalam ayam matang; sajikan dengan nasi dan lalapan" ]
  },
  {
    id: 20, title: "Fried Chicken Rumahan", emoji: "🍗🍟", gradient: "linear-gradient(135deg,#e2a138,#bd622c)", time: "55 mnt", servings: "4 Porsi", calories: "420 kal", difficulty: "Sedang", tags: ["Favorit", "Goreng", "Ayam"],
    ingredients: ["🍗 Potongan ayam", "🌾 Tepung terigu", "🌽 Tepung maizena", "🥚 Telur", "🥛 Susu cair", "🧄 Bawang putih", "🧂 Garam, lada, paprika"],
    steps: ["Bumbui ayam dengan bawang putih, garam, dan lada; diamkan 30 menit di kulkas", "Campur terigu, maizena, lada, dan paprika", "Celup ayam ke telur yang dicampur susu, lalu balur tepung sambil diremas ringan", "Goreng dalam minyak cukup banyak dengan api sedang sampai keemasan dan matang sampai tulang", "Tiriskan di rak agar kulit tetap renyah; jangan menumpuk ayam panas" ]
  },
  {
    id: 21, title: "Pizza Teflon Keju", emoji: "🍕🧀", gradient: "linear-gradient(135deg,#c64b37,#a52e37)", time: "40 mnt", servings: "2 Porsi", calories: "390 kal", difficulty: "Mudah", tags: ["Favorit", "Camilan"],
    ingredients: ["🌾 Tepung terigu", "🧀 Keju mozzarella", "🍅 Saus tomat", "🫒 Minyak", "🧂 Garam", "🍄 Jamur atau topping sisa", "🥄 Ragi instan (opsional)"],
    steps: ["Campur tepung, sedikit garam, minyak, dan air hangat; uleni sampai kalis", "Diamkan adonan 20 menit bila memakai ragi", "Pipihkan adonan di teflon yang dioles tipis minyak", "Oles saus, beri keju dan topping", "Tutup teflon; masak dengan api sangat kecil 15–20 menit sampai bagian bawah matang dan keju meleleh" ]
  },
  {
    id: 22, title: "Burger Ayam Rumahan", emoji: "🍔🍗", gradient: "linear-gradient(135deg,#bd543a,#82442f)", time: "30 mnt", servings: "2 Porsi", calories: "430 kal", difficulty: "Mudah", tags: ["Favorit", "Cepat"],
    ingredients: ["🍞 Bun atau roti burger", "🍗 Patty ayam atau sapi", "🥬 Selada (opsional)", "🍅 Tomat (opsional)", "🧀 Keju (opsional)", "🫙 Mayones atau saus (opsional)", "🧂 Garam dan lada"],
    steps: ["Jika membuat patty sendiri, bumbui daging cincang dengan garam dan lada lalu bentuk pipih", "Masak patty di wajan dengan sedikit minyak sampai matang sepenuhnya", "Belah bun lalu panggang sisi dalamnya sebentar", "Oleskan saus bila ada, lalu tumpuk patty dan topping yang tersedia", "Tutup burger dan nikmati selagi hangat; bun dan patty saja juga cukup untuk versi simpel" ]
  },
  {
    id: 23, title: "Spaghetti Bolognese", emoji: "🍝🍅", gradient: "linear-gradient(135deg,#bd4938,#762f32)", time: "35 mnt", servings: "3 Porsi", calories: "410 kal", difficulty: "Mudah", tags: ["Favorit", "Pasta"],
    ingredients: ["🍝 Spaghetti", "🥩 Daging sapi cincang", "🍅 Tomat atau saus tomat", "🧅 Bawang bombai", "🧄 Bawang putih", "🫒 Minyak", "🧀 Keju parut"],
    steps: ["Rebus spaghetti dalam air bergaram sampai al dente, sisihkan sedikit air rebusannya", "Tumis bawang bombai dan bawang putih sampai harum", "Masukkan daging cincang, masak sampai berubah warna", "Tambahkan tomat atau saus tomat dan sedikit air pasta; didihkan 15 menit", "Aduk saus dengan spaghetti dan sajikan dengan keju parut" ]
  },
  {
    id: 24, title: "Ramen Ayam Praktis", emoji: "🍜🥚", gradient: "linear-gradient(135deg,#d49a42,#9d5434)", time: "35 mnt", servings: "2 Porsi", calories: "430 kal", difficulty: "Mudah", tags: ["Favorit", "Mi", "Berkuah"],
    ingredients: ["🍜 Mi ramen atau mi telur", "🍗 Ayam", "🥚 Telur", "🧄 Bawang putih", "🧅 Daun bawang", "🥬 Sawi", "🫙 Kecap asin", "🍲 Kaldu"],
    steps: ["Rebus telur 7–8 menit, kupas, dan sisihkan", "Tumis bawang putih, masukkan ayam potong dan masak sampai matang", "Tuang kaldu, bumbui kecap asin dan lada, didihkan 10 menit", "Masak mi terpisah sesuai petunjuk kemasan", "Susun mi, kuah, ayam, telur, sawi, dan daun bawang dalam mangkuk" ]
  },
  {
    id: 25, title: "Sushi Roll Isi Matang", emoji: "🍣🥑", gradient: "linear-gradient(135deg,#399b82,#236f70)", time: "45 mnt", servings: "2 Porsi", calories: "360 kal", difficulty: "Sedang", tags: ["Favorit", "Nasi"],
    ingredients: ["🍚 Nasi pulen", "🌊 Nori", "🥒 Timun", "🥑 Alpukat", "🦀 Crab stick atau ayam matang", "🍶 Cuka beras atau air jeruk", "🫙 Kecap asin"],
    steps: ["Bumbui nasi hangat dengan sedikit cuka beras dan garam, lalu dinginkan", "Letakkan nori di atas alas gulung dan ratakan nasi tipis", "Susun timun, alpukat, dan isian yang sudah matang di satu sisi", "Gulung rapat sambil menahan isi, lalu potong dengan pisau basah", "Sajikan dengan kecap asin; resep ini memakai isian matang, bukan ikan mentah" ]
  },
  {
    id: 26, title: "Taco Daging Sapi", emoji: "🌮🥩", gradient: "linear-gradient(135deg,#d7833a,#a64d37)", time: "30 mnt", servings: "3 Porsi", calories: "390 kal", difficulty: "Mudah", tags: ["Favorit", "Cepat"],
    ingredients: ["🌮 Tortilla", "🥩 Daging sapi cincang", "🧅 Bawang bombai", "🍅 Tomat", "🥬 Selada", "🧀 Keju", "🍋 Jeruk nipis", "🌶️ Paprika bubuk"],
    steps: ["Tumis bawang bombai, masukkan daging dan paprika bubuk", "Masak sambil diaduk sampai daging matang merata; bumbui garam", "Hangatkan tortilla di wajan kering", "Isi tortilla dengan daging, selada, tomat, dan keju", "Tambahkan perasan jeruk nipis dan sajikan selagi hangat" ]
  },
  {
    id: 27, title: "Pancake Lembut", emoji: "🥞🍯", gradient: "linear-gradient(135deg,#e4ad55,#b77939)", time: "20 mnt", servings: "2 Porsi", calories: "280 kal", difficulty: "Mudah", tags: ["Sarapan", "Camilan"],
    ingredients: ["🌾 Tepung terigu", "🥚 Telur", "🥛 Susu", "🧈 Mentega", "🍬 Gula", "🥄 Baking powder", "🍯 Madu atau pisang (opsional)"],
    steps: ["Campur tepung, gula, baking powder, telur, dan susu; aduk seperlunya", "Lelehkan sedikit mentega di wajan antilengket", "Tuang adonan satu sendok sayur; masak sampai muncul gelembung", "Balik dan masak sisi lainnya sampai keemasan", "Sajikan dengan madu atau potongan buah yang tersedia" ]
  },
  {
    id: 28, title: "Ayam Teriyaki", emoji: "🍗🍱", gradient: "linear-gradient(135deg,#ad6235,#6b4430)", time: "30 mnt", servings: "3 Porsi", calories: "320 kal", difficulty: "Mudah", tags: ["Favorit", "Cepat"],
    ingredients: ["🍗 Ayam tanpa tulang", "🫙 Kecap asin", "🍯 Madu atau gula", "🧄 Bawang putih", "🫚 Jahe", "🧅 Bawang bombai", "🌽 Maizena (opsional)"],
    steps: ["Campur kecap asin, madu, bawang putih, dan jahe parut", "Potong ayam, lalu tumis sampai matang dan kecokelatan", "Masukkan bawang bombai dan saus, aduk sampai mendidih", "Tambahkan sedikit larutan maizena jika ingin saus kental", "Sajikan dengan nasi hangat dan sayuran" ]
  },
  {
    id: 29, title: "Sate Lilit Bali", emoji: "🍢🥥", gradient: "linear-gradient(135deg,#c56d38,#7b4835)", time: "40 mnt", servings: "3 Porsi", calories: "300 kal", difficulty: "Sedang", tags: ["Bali", "Tradisional", "Bakar"],
    ingredients: ["🐟 Ikan cincang atau ayam cincang", "🥥 Kelapa parut", "🧅 Bawang merah", "🧄 Bawang putih", "🌶️ Cabai", "🌿 Serai atau tusuk sate", "🫚 Kencur", "🧂 Garam"],
    steps: ["Haluskan bawang, cabai, kencur, dan garam", "Campur bumbu dengan ikan atau ayam cincang dan kelapa parut", "Lilitkan adonan pada batang serai atau tusuk sate pipih", "Panggang sambil diputar sampai matang merata dan harum", "Sajikan dengan nasi, sambal matah, atau jeruk limau" ]
  }
];

// ============================================================
// STATE
// ============================================================
let detectedIngredients = [];
let currentFilter = 'all';
let cameraStream = null;
let demoRunning = false;
let currentChatRecipeIdx = null;
let awaitingSubstitutionIngredient = false;
let selectedExploreCategory = 'all';

const EXPLORE_CATEGORIES = [
  { id: 'all', label: 'Semua resep', color: '#B65C3A', matches: () => true },
  { id: 'bali', label: 'Masakan Bali', color: '#788466', matches: recipe => recipe.tags.includes('Bali') },
  { id: 'quick', label: '30 menit atau kurang', color: '#D3A64F', matches: recipe => parseInt(recipe.time, 10) <= 30 },
  { id: 'soups', label: 'Sup dan berkuah', color: '#A96F4C', matches: recipe => recipe.tags.includes('Berkuah') },
  { id: 'chicken', label: 'Menu ayam', color: '#8B7653', matches: recipe => recipe.title.toLowerCase().includes('ayam') || recipe.ingredients.some(item => /\bayam\b/i.test(item)) },
  { id: 'snacks', label: 'Camilan', color: '#B97859', matches: recipe => recipe.tags.includes('Camilan') },
  { id: 'noodles', label: 'Mi dan pasta', color: '#6F8061', matches: recipe => recipe.tags.includes('Mi') || recipe.tags.includes('Pasta') || /\b(mie|mi|ramen|spaghetti|pasta)\b/i.test(recipe.title) },
  { id: 'vegetarian', label: 'Tanpa daging', color: '#87906C', matches: recipe => recipe.tags.includes('Vegetarian') },
  { id: 'favorites', label: 'Favorit', color: '#C28B45', matches: recipe => recipe.tags.includes('Favorit') }
];

// AI Response database
const AI_RESPONSES = {
  keywords: {
    "wortel": { recipe: "Sup Wortel Jahe", time: "20 mnt", tip: "Jahe membuat sup wortel lebih hangat dan menyehatkan!" },
    "jagung": { recipe: "Sup Jagung Susu Creamy", time: "25 mnt", tip: "Tambahkan susu evaporasi untuk sup jagung yang lebih creamy!" },
    "telur": { recipe: "Telur Balado Pedas", time: "15 mnt", tip: "Goreng dulu telurnya agar kulit kering sebelum dimasukkan ke sambal." },
    "nasi": { recipe: "Nasi Goreng Spesial", time: "12 mnt", tip: "Nasi kemarin lebih baik untuk nasi goreng karena lebih kering!" },
    "ayam": { recipe: "Ayam Saus Tiram", time: "25 mnt", tip: "Lumuri ayam dengan tepung maizena sebelum digoreng agar lebih crispy!" },
    "tempe": { recipe: "Tempe Mendoan Crispy", time: "20 mnt", tip: "Adonan mendoan yang tipis dan berbumbu adalah kunci kecrispy-an!" },
    "tahu": { recipe: "Tahu Crispy Pedas Manis", time: "20 mnt", tip: "Keringkan tahu sebelum digoreng agar tidak meletup-letup!" },
    "kangkung": { recipe: "Tumis Kangkung Bawang Putih", time: "8 mnt", tip: "Jangan masak kangkung terlalu lama, cukup 2-3 menit saja!" },
    "brokoli": { recipe: "Tumis Brokoli Saus Tiram", time: "15 mnt", tip: "Blanching brokoli sebentar sebelum ditumis agar warnanya tetap hijau cerah!" },
    "mie": { recipe: "Mie Goreng Lezat", time: "12 mnt", tip: "Gunakan api besar saat menggoreng mie agar teksturnya lebih kenyal!" },
    "default": { recipe: "Oseng Bumbu Sederhana", time: "15 mnt", tip: "Pastikan bumbu dasar (bawang merah, bawang putih) selalu tersedia di dapur!" }
  },
  substitusi: {
    "santan": "Bisa diganti dengan susu full cream, atau blender kelapa parut dengan air panas!",
    "kecap": "Ganti dengan campuran gula merah + sedikit air + kecap ikan untuk umami yang mirip.",
    "terasi": "Bisa diganti dengan udang kering yang dihaluskan atau tambahkan lebih banyak garam.",
    "daun salam": "Ganti dengan bay leaf (daun laurel) atau daun jeruk untuk aroma yang serupa.",
    "kemiri": "Bisa diganti dengan kacang macadamia atau skip saja untuk tekstur yang sedikit berbeda."
  }
};

// ============================================================
// NAVIGATION
// ============================================================
function showPage(pageId) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // Show target page
  const target = document.getElementById(`page-${pageId}`);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  // Update nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.dataset.page === pageId) link.classList.add('active');
  });
  // Close mobile menu
  document.getElementById('navLinks').classList.remove('open');

  // Page-specific init
  if (pageId === 'resep') renderRecipesGrid();
  if (pageId === 'jelajahi') renderJelajahiGrid();
  if (pageId === 'chef') updateChefBahanBadge();
}

function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('open');
}

function applyTheme(theme) {
  const selected = theme === 'dark' ? 'dark' : 'light';
  document.body.dataset.theme = selected;
  const button = document.getElementById('themeToggle');
  const label = document.getElementById('themeLabel');
  const icon = document.getElementById('themeIcon');
  const nextTheme = selected === 'dark' ? 'light' : 'dark';
  if (label) label.textContent = nextTheme === 'dark' ? 'Gelap' : 'Terang';
  if (icon) {
    icon.innerHTML = nextTheme === 'dark'
      ? '<path d="M20.9 13A8.5 8.5 0 0 1 11 3.1 8.5 8.5 0 1 0 20.9 13Z"/>'
      : '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>';
  }
  if (button) {
    button.setAttribute('aria-label', `Aktifkan mode ${nextTheme === 'dark' ? 'gelap' : 'terang'}`);
    button.setAttribute('aria-pressed', String(selected === 'dark'));
  }
  try { localStorage.setItem('resep-theme', selected); } catch (_) { /* Theme still works for this page view. */ }
}

function toggleTheme() {
  applyTheme(document.body.dataset.theme === 'dark' ? 'light' : 'dark');
}

function initTheme() {
  let savedTheme = 'light';
  try { savedTheme = localStorage.getItem('resep-theme') || 'light'; } catch (_) { /* Use the warm light theme by default. */ }
  applyTheme(savedTheme);
}

// ============================================================
// PARTICLES (Hero Section)
// ============================================================
function initParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      animation-duration: ${8 + Math.random() * 12}s;
      animation-delay: ${-Math.random() * 15}s;
      width: ${2 + Math.random() * 4}px;
      height: ${2 + Math.random() * 4}px;
      opacity: ${0.1 + Math.random() * 0.3};
    `;
    container.appendChild(p);
  }
}

// ============================================================
// SCROLL EFFECTS
// ============================================================
function initScrollEffects() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

  // Counter animation for waste stats
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const nums = entry.target.querySelectorAll('.ws-num');
        nums.forEach(num => {
          const target = parseInt(num.dataset.target);
          animateCounter(num, 0, target, 2000);
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  const statsSection = document.querySelector('.waste-stats');
  if (statsSection) observer.observe(statsSection);
}

function animateCounter(el, start, end, duration) {
  const startTime = performance.now();
  const update = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.floor(start + (end - start) * eased);
    el.textContent = value.toLocaleString('id-ID');
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

// Footer live counter
function animateFooterCounter() {
  let count = 12450;
  setInterval(() => {
    count += Math.floor(Math.random() * 3);
    const el = document.getElementById('footerWasteCount');
    if (el) el.textContent = count.toLocaleString('id-ID');
  }, 3000);
}

// ============================================================
// CAMERA / SCAN FUNCTIONALITY
// ============================================================
async function startCamera() {
  const btn = document.getElementById('startCamBtn');
  const placeholder = document.getElementById('cameraPlaceholder');
  const feed = document.getElementById('cameraFeed');
  const overlay = document.getElementById('scanOverlay');

  try {
    btn.textContent = 'Meminta izin...';
    btn.disabled = true;

    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    });

    feed.srcObject = cameraStream;
    feed.style.display = 'block';
    placeholder.style.display = 'none';
    overlay.style.display = 'block';

    const captureBtn = document.getElementById('captureBtn');
    captureBtn.disabled = false;

    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>
      Kamera Aktif
    `;
    btn.style.background = 'linear-gradient(135deg, #27AE60, #1E8449)';
    btn.disabled = false;

    updateDetectionStatus('active', 'Kamera aktif — arahkan ke bahan makanan');

  } catch (err) {
    btn.textContent = 'Buka kamera';
    btn.disabled = false;
    updateDetectionStatus('idle', 'Kamera tidak tersedia. Kamu bisa menambahkan bahan sendiri.');
    showToast('Kamera tidak tersedia di perangkat ini.', 'error');
  }
}

function runDemo() {
  if (demoRunning) return;
  demoRunning = true;

  const placeholder = document.getElementById('cameraPlaceholder');
  const overlay = document.getElementById('scanOverlay');
  const detBoxes = document.getElementById('detectionBoxes');

  // Show scan UI
  placeholder.style.display = 'none';
  overlay.style.display = 'block';
  detBoxes.innerHTML = '';

  updateDetectionStatus('active', 'Menyiapkan contoh bahan...');

  const demoItems = [
    { emoji: '🌽', name: 'Jagung', conf: 97, box: { top: '15%', left: '8%', width: '38%', height: '38%' } },
    { emoji: '🥕', name: 'Wortel', conf: 94, box: { top: '45%', left: '25%', width: '35%', height: '32%' } },
    { emoji: '🧅', name: 'Bawang Merah', conf: 89, box: { top: '20%', left: '55%', width: '30%', height: '28%' } },
    { emoji: '🧄', name: 'Bawang Putih', conf: 86, box: { top: '55%', left: '60%', width: '25%', height: '25%' } },
  ];

  // Animate detection box appearance + ingredient adding
  demoItems.forEach((item, idx) => {
    setTimeout(() => {
      // Create bounding box
      const box = document.createElement('div');
      box.className = 'det-box';
      box.style.cssText = `top:${item.box.top};left:${item.box.left};width:${item.box.width};height:${item.box.height}`;
      box.innerHTML = `<div class="det-box-label">${item.emoji} ${item.name} ${item.conf}%</div>`;
      detBoxes.appendChild(box);
      box.style.animation = 'slideIn 0.3s ease';

      // Add to ingredient list
      setTimeout(() => addIngredientItem(item.emoji, item.name, item.conf), 300);

      // Final state
      if (idx === demoItems.length - 1) {
        setTimeout(() => {
          updateDetectionStatus('detected', `✅ ${demoItems.length} bahan terdeteksi! Cari resep atau tanya Chef Resepin.`);
          showConfidenceBar(91);
          demoRunning = false;
          document.getElementById('captureBtn').disabled = false;
        }, 500);
      }
    }, 800 + idx * 1000);
  });
}

async function captureAndDetect() {
  const video = document.getElementById('cameraFeed');
  const canvas = document.getElementById('cameraCanvas');
  const boxes = document.getElementById('detectionBoxes');
  if (!cameraStream || !video.videoWidth) {
    showToast('Aktifkan kamera sebelum mengambil foto.', 'error');
    return;
  }

  const button = document.getElementById('captureBtn');
  button.disabled = true;
  updateDetectionStatus('active', 'Memeriksa foto dengan model bahan...');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  boxes.innerHTML = '';

  try {
    const imageBlob = await new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Foto tidak bisa disiapkan.')), 'image/jpeg', 0.9);
    });
    const formData = new FormData();
    formData.append('file', imageBlob, 'bahan.jpg');
    const response = await fetch('/api/detect', { method: 'POST', body: formData });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.detail || 'Deteksi gagal. Pastikan server Resepin sedang berjalan.');

    const foodEmojis = {
      'Ayam': '🍗', 'Bawang Bombai': '🧅', 'Bawang Merah': '🧅', 'Bawang Putih': '🧄',
      'Bayam': '🥬', 'Biji Kemiri': '🌰', 'Cabai Hijau': '🫑', 'Cabai Merah': '🌶️',
      'Daging Sapi': '🥩', 'Daun Bawang': '🌿', 'Ikan': '🐟', 'Jagung': '🌽', 'Jahe': '🫚',
      'Kacang Panjang': '🫘', 'Kangkung': '🥬', 'Kencur': '🌿', 'Kentang': '🥔',
      'Ketumbar': '🌿', 'Kol': '🥬', 'Kunyit': '🫚', 'Lada': '⚫', 'Lengkuas': '🌿',
      'Selada': '🥬', 'Tahu': '🟨', 'Telur': '🥚', 'Tempe': '🧱', 'Terong': '🍆',
      'Tomat': '🍅', 'Udang': '🦐', 'Wortel': '🥕'
    };
    const matches = result.detections || [];
    matches.forEach(({ label, confidence, bbox }) => {
      const emoji = foodEmojis[label] || '🥗';
      const name = label;
      const [x1, y1, x2, y2] = bbox;
      const box = document.createElement('div');
      box.className = 'det-box';
      box.style.cssText = `left:${x1 / canvas.width * 100}%;top:${y1 / canvas.height * 100}%;width:${(x2 - x1) / canvas.width * 100}%;height:${(y2 - y1) / canvas.height * 100}%`;
      const caption = document.createElement('div');
      caption.className = 'det-box-label';
      caption.textContent = `${emoji} ${name} ${Math.round(confidence * 100)}%`;
      box.appendChild(caption);
      boxes.appendChild(box);
      addIngredientItem(emoji, name, Math.round(confidence * 100));
    });
    if (matches.length) {
      const confidence = Math.round(matches.reduce((sum, item) => sum + item.confidence, 0) / matches.length * 100);
      updateDetectionStatus('detected', `${matches.length} bahan terdeteksi. Periksa hasilnya sebelum mencari resep.`);
      showConfidenceBar(confidence);
      showToast('Foto berhasil dipindai.', 'success');
    } else {
      updateDetectionStatus('idle', 'Belum menemukan bahan yang didukung. Coba dekatkan objek atau tambah bahan secara manual.');
    }
  } catch (error) {
    updateDetectionStatus('idle', error.message || 'Deteksi gagal. Pastikan server Resepin dan model PyTorch siap.');
    showToast(error.message || 'Deteksi bahan gagal.', 'error');
  } finally {
    button.disabled = false;
  }
}

function updateDetectionStatus(type, message) {
  const el = document.getElementById('detectionStatus');
  const dotClass = type === 'active' ? 'active' : type === 'detected' ? 'detected' : 'idle';
  el.innerHTML = `
    <div class="status-idle">
      <div class="status-dot ${dotClass}"></div>
      <span>${message}</span>
    </div>
  `;
}

function showConfidenceBar(pct) {
  const bar = document.getElementById('confidenceBar');
  const fill = document.getElementById('confFill');
  const pctEl = document.getElementById('confPct');
  bar.style.display = 'flex';
  setTimeout(() => {
    fill.style.width = pct + '%';
    pctEl.textContent = pct + '%';
  }, 100);
}

// ============================================================
// INGREDIENT MANAGEMENT
// ============================================================
function addIngredientItem(emoji, name, conf) {
  // Check duplicate
  if (detectedIngredients.find(i => i.name.toLowerCase() === name.toLowerCase())) return;

  const ingredient = { emoji, name, conf };
  detectedIngredients.push(ingredient);

  renderIngredientList();
  updateIngredientCount();
}

function addIngredient(label) {
  const parts = label.split(' ');
  const emoji = parts[0];
  const name = parts.slice(1).join(' ');
  addIngredientItem(emoji, name, null);
  showToast(`${emoji} ${name} ditambahkan!`, 'success');
}

function addManualIngredient() {
  const input = document.getElementById('manualIngredientInput');
  const val = input.value.trim();
  if (!val) return;

  addIngredientItem('🥘', val, null);
  input.value = '';
  showToast(`🥘 ${val} ditambahkan!`, 'success');
}

function removeIngredient(name) {
  detectedIngredients = detectedIngredients.filter(i => i.name !== name);
  renderIngredientList();
  updateIngredientCount();
}

function renderIngredientList() {
  const list = document.getElementById('ingredientList');
  const empty = document.getElementById('ipEmpty');

  if (detectedIngredients.length === 0) {
    list.innerHTML = '';
    list.appendChild(createEmptyEl());
    return;
  }

  list.innerHTML = detectedIngredients.map(item => `
    <div class="ingredient-item">
      <span class="ing-icon">${item.emoji}</span>
      <div class="ing-info">
        <span class="ing-name">${item.name}</span>
        ${item.conf ? `<span class="ing-conf">Kepercayaan: ${item.conf}%</span>` : '<span class="ing-conf">Diinput manual</span>'}
      </div>
      <button class="ing-remove" onclick="removeIngredient('${item.name}')" title="Hapus">✕</button>
    </div>
  `).join('');
}

function createEmptyEl() {
  const div = document.createElement('div');
  div.id = 'ipEmpty';
  div.className = 'ip-empty';
  div.innerHTML = `
    <div class="ip-empty-icon">🔍</div>
    <p>Belum ada bahan terdeteksi.<br/>Aktifkan kamera atau coba Mode Demo</p>
  `;
  return div;
}

function updateIngredientCount() {
  const count = detectedIngredients.length;
  document.getElementById('ingredientCount').textContent = `${count} bahan`;
  document.getElementById('ingredientCountBtn').textContent = count;

  const findBtn = document.getElementById('findRecipesBtn');
  findBtn.disabled = count === 0;
  if (count > 0) {
    findBtn.innerHTML = `🍳 Cari Resep (<span id="ingredientCountBtn">${count}</span> bahan)`;
  }
}

// ============================================================
// RECIPES GRID
// ============================================================
function renderRecipesGrid() {
  const grid = document.getElementById('recipesGrid');
  if (!grid) return;
  const query = document.getElementById('recipeSearch')?.value?.toLowerCase() || '';
  let filtered = RECIPES_DB;

  // Apply text search
  if (query) {
    filtered = filtered.filter(r =>
      r.title.toLowerCase().includes(query) ||
      r.tags.some(t => t.toLowerCase().includes(query)) ||
      r.ingredients.some(i => i.toLowerCase().includes(query))
    );
  }

  // Apply filter chip
  if (currentFilter !== 'all') {
    filtered = filtered.filter(r => {
      switch (currentFilter) {
        case 'mudah': return r.difficulty === 'Mudah';
        case 'cepat': return parseInt(r.time) <= 15;
        case 'sehat': return r.tags.includes('Sehat');
        case 'sayur': return r.tags.some(t => ['Sayur', 'Sehat'].includes(t));
        case 'berkuah': return r.tags.includes('Berkuah');
        case '5bahan': return r.ingredients.length <= 5;
        default: return true;
      }
    });
  }

  grid.innerHTML = filtered.length === 0
    ? `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted)"><div style="font-size:3rem;margin-bottom:16px">🍳</div><p>Tidak ada resep yang cocok.<br/>Coba kata kunci lain!</p></div>`
    : filtered.map(r => createRecipeCardHTML(r)).join('');
  bindRecipeImageFallbacks(grid);
}

// URL foto hidangan sudah matang untuk sebuah resep
function getRecipeImage(recipe) {
  if (!recipe) return '';
  if (recipe.image) return recipe.image;
  const slug = RECIPE_IMAGES[recipe.id];
  return slug ? `assets/img/${slug}.jpg` : '';
}

// Elemen foto hidangan yang sudah matang, dengan fallback ke emoji bila foto gagal dimuat
function recipeImageHTML(recipe, className, altText) {
  const src = getRecipeImage(recipe);
  const alt = altText || (recipe ? recipe.title : 'Halaman Resepin');
  if (!src) return `<span class="${className}">${recipe ? recipe.emoji : '\uD83C\uDF7F'}</span>`;
  return `<img class="${className}" src="${src}" alt="${alt}" loading="lazy" data-fallback="${(recipe ? recipe.emoji : '\uD83C\uDF7F').replace(/"/g, '&quot;')}" />`;
}

// Pasang fallback emoji untuk foto yang gagal dimuat (dipasang sekali per render)
function bindRecipeImageFallbacks(root = document) {
  root.querySelectorAll('img[data-fallback]').forEach(img => {
    img.addEventListener('error', function handleError() {
      const span = document.createElement('span');
      span.className = img.className;
      span.textContent = img.dataset.fallback || '\uD83C\uDF7F';
      img.replaceWith(span);
    }, { once: true });
  });
}

function createRecipeCardHTML(r) {
  const recipeIndex = RECIPES_DB.indexOf(r);
  return `
    <div class="recipe-card" onclick="openRecipeByIndex(${recipeIndex})">
      <div class="recipe-img" style="background:${r.gradient}">
        ${recipeImageHTML(r, 'recipe-img-photo', r.title)}
      </div>
      <div class="recipe-badge-diff ${r.difficulty === 'Mudah' ? 'easy' : 'medium'}">${r.difficulty}</div>
      <div class="recipe-info">
        <h3>${r.title}</h3>
        <p class="recipe-meta">⏱ ${r.time} &nbsp;|&nbsp; 👥 ${r.servings} &nbsp;|&nbsp; 🔥 ${r.calories}</p>
        <div class="recipe-tags">${r.tags.map(t => `<span>${t}</span>`).join('')}</div>
        <div class="recipe-ingredients-preview">
          ${r.ingredients.slice(0, 4).map(i => `<span>${i.split(' ')[0]}</span>`).join('')}
          ${r.ingredients.length > 4 ? `<span class="more">+${r.ingredients.length - 4}</span>` : ''}
        </div>
      </div>
    </div>
  `;
}

function filterRecipes() {
  renderRecipesGrid();
}

function setFilter(filter, el) {
  currentFilter = filter;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderRecipesGrid();
}

function getExploreRecipes(categoryId = selectedExploreCategory) {
  const category = EXPLORE_CATEGORIES.find(item => item.id === categoryId) || EXPLORE_CATEGORIES[0];
  return RECIPES_DB.filter(category.matches);
}

function filterByCategory(categoryId) {
  selectedExploreCategory = categoryId;
  renderExploreResults();
  document.querySelectorAll('.cat-card').forEach(button => {
    const active = button.dataset.category === categoryId;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  document.getElementById('exploreResults')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================================
// JELAJAHI GRID
// ============================================================
function renderJelajahiGrid() {
  const categoryGrid = document.getElementById('exploreCategories');
  if (!categoryGrid) return;

  categoryGrid.innerHTML = EXPLORE_CATEGORIES.map(category => {
    const count = RECIPES_DB.filter(category.matches).length;
    const active = category.id === selectedExploreCategory;
    return `<button class="cat-card${active ? ' active' : ''}" type="button" data-category="${category.id}" aria-pressed="${active}" onclick="filterByCategory('${category.id}')" style="--cat-color:${category.color}">
      <span class="cat-swatch" aria-hidden="true"></span>
      <span class="cat-name">${category.label}</span>
      <span class="cat-count">${count} resep</span>
    </button>`;
  }).join('');

  const quickList = document.getElementById('quickRecipesList');
  if (quickList) {
    const quickRecipes = RECIPES_DB.filter(recipe => parseInt(recipe.time, 10) <= 30)
      .sort((a, b) => parseInt(a.time, 10) - parseInt(b.time, 10));
    const quickCount = document.getElementById('quickRecipesCount');
    if (quickCount) quickCount.textContent = `Menampilkan ${Math.min(4, quickRecipes.length)} dari ${quickRecipes.length} resep`;
    quickList.innerHTML = quickRecipes.length
      ? quickRecipes.slice(0, 4).map(recipe => `<button class="qr-item" type="button" onclick="openRecipeByIndex(${RECIPES_DB.indexOf(recipe)})">
          ${recipeImageHTML(recipe, 'qr-photo', recipe.title)}
          <span class="qr-info"><span class="qr-name">${recipe.title}</span><span class="qr-meta">${recipe.difficulty} · ${recipe.ingredients.length} bahan</span></span>
          <span class="qr-time">${recipe.time}</span>
        </button>`).join('')
      : '<p class="explore-empty">Belum ada resep singkat di katalog.</p>';
    bindRecipeImageFallbacks(quickList);
  }

  const fiveBahanGrid = document.getElementById('fiveBahanGrid');
  if (fiveBahanGrid) {
    const fiveBahan = RECIPES_DB.filter(recipe => recipe.ingredients.length <= 5);
    fiveBahanGrid.innerHTML = fiveBahan.length
      ? fiveBahan.map(recipe => createRecipeCardHTML(recipe)).join('')
      : '<p class="explore-empty">Belum ada resep dengan lima bahan atau kurang.</p>';
    bindRecipeImageFallbacks(fiveBahanGrid);
  }
  renderExploreResults();
}

function renderExploreResults() {
  const title = document.getElementById('exploreResultsTitle');
  const count = document.getElementById('exploreResultsCount');
  const grid = document.getElementById('exploreResultsGrid');
  const category = EXPLORE_CATEGORIES.find(item => item.id === selectedExploreCategory) || EXPLORE_CATEGORIES[0];
  const recipes = getExploreRecipes(category.id);
  if (title) title.textContent = category.label;
  if (count) count.textContent = `${recipes.length} resep dari katalog`;
  if (grid) {
    grid.innerHTML = recipes.length
      ? recipes.map(recipe => createRecipeCardHTML(recipe)).join('')
      : '<p class="explore-empty">Belum ada resep dalam kategori ini.</p>';
    bindRecipeImageFallbacks(grid);
  }
}

// ============================================================
// RECIPE MODAL
// ============================================================
const EMOJI_GRADIENTS = {
  '🌽': 'linear-gradient(135deg,#e67e22,#f39c12)',
  '🍚': 'linear-gradient(135deg,#8e44ad,#9b59b6)',
  '🥬': 'linear-gradient(135deg,#27ae60,#2ecc71)',
  '🧱': 'linear-gradient(135deg,#e74c3c,#c0392b)',
  '🥦': 'linear-gradient(135deg,#1abc9c,#16a085)',
  '🍗': 'linear-gradient(135deg,#f39c12,#d68910)',
};

function openRecipeModal(title, time, servings, calories, ingredients, steps) {
  const modal = document.getElementById('recipeModal');
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalMeta').innerHTML = `
    <span>⏱ ${time}</span>
    <span>👥 ${servings}</span>
    <span>🔥 ${calories}</span>
  `;

  const recipe = RECIPES_DB.find(r => r.title === title);
  const hero = document.getElementById('modalHero');
  const heroMedia = document.getElementById('modalHeroMedia');
  const photoSrc = getRecipeImage(recipe);
  if (photoSrc) {
    heroMedia.innerHTML = `<img class="modal-hero-photo" src="${photoSrc}" alt="${title}" onerror="this.style.display='none';document.getElementById('modalHeroEmoji').style.display='flex'" />`;
    document.getElementById('modalHeroEmoji').style.display = 'none';
  } else {
    heroMedia.innerHTML = '';
    const firstEmoji = ingredients[0]?.split(' ')[0] || '🍳';
    const heroEmoji = document.getElementById('modalHeroEmoji');
    heroEmoji.textContent = firstEmoji + (ingredients[1]?.split(' ')[0] || '');
    heroEmoji.style.display = 'flex';
  }
  const firstEmoji = ingredients[0]?.split(' ')[0] || '🍳';
  const gradient = EMOJI_GRADIENTS[firstEmoji] || 'linear-gradient(135deg,rgba(255,107,53,0.2),rgba(46,196,182,0.15))';
  hero.style.background = gradient;

  document.getElementById('modalIngredients').innerHTML = ingredients.map(ing => {
    const detected = detectedIngredients.some(d => ing.toLowerCase().includes(d.name.toLowerCase()));
    return `<li style="${detected ? 'border-color:rgba(46,196,182,0.5);background:rgba(46,196,182,0.08)' : ''}">${ing}${detected ? ' ✅' : ''}</li>`;
  }).join('');

  document.getElementById('modalSteps').innerHTML = steps.map(s => `<li>${s}</li>`).join('');

  const ingredientName = ingredients[0]?.split(' ').slice(1).join(' ').toLowerCase() || '';
  const tip = findAITip(ingredientName);
  document.getElementById('modalTip').textContent = tip;

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function openRecipeByIndex(index) {
  const recipe = RECIPES_DB[index];
  if (!recipe) return;
  openRecipeModal(recipe.title, recipe.time, recipe.servings, recipe.calories, recipe.ingredients, recipe.steps);
}

function findAITip(ingredientName) {
  for (const [key, val] of Object.entries(AI_RESPONSES.keywords)) {
    if (ingredientName.includes(key)) return val.tip;
  }
  return AI_RESPONSES.keywords.default.tip;
}

function closeRecipeModal() {
  document.getElementById('recipeModal').classList.remove('open');
  document.body.style.overflow = '';
}

function closeModal(event) {
  if (event.target === document.getElementById('recipeModal')) closeRecipeModal();
}

function saveRecipe() {
  showToast('❤️ Resep disimpan ke Favorit!', 'success');
  closeRecipeModal();
}

// ============================================================
// CHEF AI CHAT
// ============================================================
function updateChefBahanBadge() {
  const badge = document.getElementById('chefBahanText');
  if (!badge) return;
  if (detectedIngredients.length === 0) {
    badge.textContent = 'Belum ada bahan';
  } else {
    badge.textContent = `${detectedIngredients.length} bahan aktif`;
  }
}

function sendQuickPrompt(text) {
  const input = document.getElementById('chatInput');
  input.value = text;
  sendChat();
}

function sendChat() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  if (!message) return;

  input.value = '';
  input.style.height = 'auto';

  appendChatMessage(message, 'user');
  hideQuickPrompts();

  // Show typing indicator
  const typingId = 'typing-' + Date.now();
  appendTypingIndicator(typingId);

  // Simulate AI response delay
  const delay = 1200 + Math.random() * 800;
  setTimeout(() => {
    removeTypingIndicator(typingId);
    const response = generateAIResponse(message);
    appendAIResponse(response);
  }, delay);
}

function generateAIResponse(message) {
  const lowerMsg = message.toLowerCase();
  const normalized = lowerMsg.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const textHasPhrase = (text, phrase) => {
    const textWords = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').match(/\p{L}+/gu) || [];
    const phraseWords = phrase.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').match(/\p{L}+/gu) || [];
    return phraseWords.length > 0 && textWords.some((_, index) =>
      phraseWords.every((word, offset) => textWords[index + offset] === word));
  };
  const substitutionAdvice = {
    santan: 'coba susu cair atau santan bubuk yang dilarutkan. Untuk masakan gurih, susu oat tanpa gula juga bisa dipakai.',
    kecap: 'campurkan sedikit garam dengan gula merah dan air. Rasanya tidak persis sama, jadi tambahkan sedikit demi sedikit.',
    terasi: 'lewati saja atau tambahkan sedikit ikan asin/udang kering yang dihaluskan jika tersedia.',
    'daun salam': 'gunakan daun jeruk atau sedikit thyme untuk aroma; kalau tidak ada, bumbunya tetap bisa dimasak tanpa daun salam.',
    kemiri: 'gunakan sedikit kacang tanah sangrai atau skip saja. Tekstur bumbu akan sedikit berbeda.',
    selada: 'pakai kol iris tipis, timun, atau sawi muda. Untuk isian burger, keringkan sayuran dulu supaya rotinya tidak lembek.',
    ayam: 'gunakan tempe, tahu, jamur tiram, atau ikan sesuai jenis masakannya. Atur kembali waktu masak sampai bahan pengganti matang.',
    telur: 'untuk adonan, coba 1 sdm maizena + 2 sdm air per telur. Untuk lauk, tahu hancur bisa jadi pengganti yang lebih mengenyangkan.',
    'roti burger': 'pakai roti tawar panggang, English muffin, atau nasi sebagai lauk patty.',
    patty: 'gunakan ayam cincang, daging cincang, tempe, atau jamur yang dibentuk pipih.',
    tomat: 'gunakan paprika panggang atau sedikit saus tomat. Jika hanya butuh kesegaran, tambahkan timun.',
    keju: 'boleh dilewati, atau gunakan sedikit susu/saus putih untuk memberi rasa gurih.',
    cabai: 'gunakan lada hitam atau paprika bubuk untuk rasa hangat tanpa pedas yang kuat.',
    susu: 'gunakan susu kedelai tanpa gula atau air/kaldu, tergantung resepnya.',
    bawang: 'gunakan bawang putih atau bawang merah yang tersedia; bila keduanya habis, bubuk bawang bisa dipakai sedikit saja.'
  };
  const substitutionFor = ingredient => {
    const known = Object.keys(substitutionAdvice).find(name => textHasPhrase(ingredient, name));
    if (known) return substitutionAdvice[known];
    if (/sayur|bayam|kangkung|brokoli|sawi|kol|wortel|selada/.test(ingredient)) return 'ganti dengan sayuran lain yang tekstur dan waktu masaknya mirip, seperti kol, sawi, atau wortel. Masukkan sayuran keras lebih dulu.';
    return 'sebutkan jenis masakannya supaya aku bisa pilih pengganti yang rasanya dan fungsinya paling mendekati. Kalau bahan ini hanya pelengkap, biasanya bisa dilewati.';
  };
  const explicitRecipeRequest = /\b(resep|masak|menu|mau|bikin|buat)\b/.test(normalized) ||
    RECIPES_DB.some(recipe => textHasPhrase(normalized, recipe.title)) ||
    /\b(ayam\s+betutu|ayam\s+sere\s+lemo|ayam\s+sisit\s+sere\s+lemo|ayam\s+bakar\s+(?:khas\s+)?bali|coto|babi\s+guling|lawar|fried\s+chicken|pizza|burger|spaghetti|ramen|sushi|taco|pancake|teriyaki|sate\s+lilit)\b/.test(normalized);

  // Handle conversation before looking for ingredients, so a greeting never
  // falls through to an unrelated recipe or generic zero-waste tip.
  if (/^(hai|halo|hello|hi|hei|pagi|siang|sore|malam)(?:\s+(?:bro|kak|bang|sis|guys))?[!?.\s]*$/i.test(normalized.trim())) {
    return { type: 'text', text: 'Hai! 👋 Aku Chef Resepin. Kamu lagi punya bahan apa, atau mau tanya soal resep dan substitusi?' };
  }
  if (/\b(terima kasih|makasih|thanks|thank you)\b/.test(normalized)) {
    return { type: 'text', text: 'Sama-sama! 😊 Kalau ada bahan lain atau ingin mengubah resepnya, bilang saja ya.' };
  }
  if (/\b(kamu siapa|siapa kamu|bisa apa|bant[u]? apa|help|tolong)\b/.test(normalized)) {
    return { type: 'text', text: 'Aku Chef Resepin. Aku bisa bantu mencari ide resep dari bahan yang tersedia, memberi tips memasak, dan menyarankan pengganti bahan. Coba sebutkan bahan atau pertanyaanmu.' };
  }

  if (/\b(belum punya bahan|belum ada bahan|tidak punya bahan|tidak ada bahan|ga punya bahan|gak punya bahan|nggak punya bahan|gak ada bahan|nggak ada bahan|kehabisan bahan)\b/.test(normalized)) {
    return { type: 'text', text: 'Nggak apa-apa 😊 Kita mulai dari yang paling sederhana. Coba cek apakah ada nasi, telur, mi, atau roti? Sebutkan satu saja yang ada—aku carikan ide paling simpel. Kalau benar-benar belum ada bahan, aku bisa bantu susun daftar belanja minimal untuk masakan yang kamu inginkan.' };
  }

  const asksSubstitution = /\b(ganti|diganti|pengganti|alternatif|substitusi|tidak ada|tidak punya|nggak ada|ga ada|habis|kehabisan)\b/.test(normalized);
  const isAcknowledgement = /^(oke|ok|iya|ya|boleh|siap|gas|lanjut|sip)(?:\s+(?:deh|dong|bro|kak|bang|sis|lanjut|ya|boleh|aja))*[!?.\s]*$/.test(normalized.trim());
  if (awaitingSubstitutionIngredient && !asksSubstitution && !explicitRecipeRequest) {
    if (isAcknowledgement) {
      return { type: 'text', text: 'Siap 😊 Sebutkan bahan yang mau diganti, nanti aku carikan pilihan yang paling cocok.' };
    }
    const suppliedIngredient = Object.keys(substitutionAdvice).find(item => textHasPhrase(normalized, item)) || message.trim().replace(/[?.!,]+$/, '');
    awaitingSubstitutionIngredient = false;
    return { type: 'substitusi', text: `Untuk **${suppliedIngredient}**, ${substitutionFor(suppliedIngredient)}`, tip: 'Sesuaikan takaran sedikit demi sedikit dan cicipi sebelum menambah lagi.' };
  }
  if (asksSubstitution) {
    const missingIngredient = Object.keys(substitutionAdvice).find(item => textHasPhrase(normalized, item));
    if (missingIngredient) {
      awaitingSubstitutionIngredient = false;
      return { type: 'substitusi', text: `Untuk **${missingIngredient}**, ${substitutionFor(missingIngredient)}`, tip: 'Sesuaikan takaran sedikit demi sedikit dan cicipi sebelum menambah lagi.' };
    }
    awaitingSubstitutionIngredient = true;
    return { type: 'text', text: 'Bisa banget! Bahan apa yang lagi kosong? Sebutkan namanya, nanti aku kasih pengganti yang paling masuk akal.' };
  }

  if (isAcknowledgement) {
    if (currentChatRecipeIdx !== null && RECIPES_DB[currentChatRecipeIdx]) {
      const recipe = RECIPES_DB[currentChatRecipeIdx];
      return { type: 'text', text: `Siap 😊 Untuk **${recipe.title}**, sebutkan bahan yang tersedia atau yang mau diganti. Nanti aku sesuaikan resep dan langkahnya buat kamu.` };
    }
    return { type: 'text', text: 'Oke 😊 Mau cari resep, tanya pengganti bahan, atau ceritakan bahan yang ada di dapur?' };
  }

  const requestedRecipe = RECIPES_DB.find(recipe => normalized.includes(recipe.title.toLowerCase()) ||
    (recipe.title === 'Coto Makassar' && /\bcoto\b/.test(normalized)) ||
    (recipe.title === 'Ayam Betutu Bali' && /\bayam\s+betutu\b/.test(normalized)) ||
    (recipe.title === 'Ayam Sere Lemo (Ayam Sisit Bali)' && /\b(ayam\s+sere\s+lemo|ayam\s+sisit\s+sere\s+lemo|ayam\s+serli)\b/.test(normalized)) ||
    (recipe.title === 'Ayam Bakar Bumbu Bali' && /\bayam\s+bakar\s+(?:khas\s+)?bali\b/.test(normalized)) ||
    (recipe.title === 'Ayam Bakar Kecap' && /\bayam\s+bakar\b/.test(normalized)) ||
    (recipe.title === 'Lawar Sayur Bali' && /\blawar\b/.test(normalized)) ||
    (recipe.title === 'Babi Guling Bali (Versi Rumahan)' && /\bbabi\s+guling\b/.test(normalized)) ||
    (recipe.title === 'Fried Chicken Rumahan' && /\b(fried\s+chicken|ayam\s+goreng\s+crispy|ayam\s+goreng\s+krispi)\b/.test(normalized)) ||
    (recipe.title === 'Pizza Teflon Keju' && /\bpizza\b/.test(normalized)) ||
    (recipe.title === 'Burger Ayam Rumahan' && /\b(burger|hamburger)\b/.test(normalized)) ||
    (recipe.title === 'Spaghetti Bolognese' && /\b(spaghetti|bolognese)\b/.test(normalized)) ||
    (recipe.title === 'Ramen Ayam Praktis' && /\bramen\b/.test(normalized)) ||
    (recipe.title === 'Sushi Roll Isi Matang' && /\bsushi\b/.test(normalized)) ||
    (recipe.title === 'Taco Daging Sapi' && /\b(taco|tacos)\b/.test(normalized)) ||
    (recipe.title === 'Pancake Lembut' && /\bpancake\b/.test(normalized)) ||
    (recipe.title === 'Ayam Teriyaki' && /\bteriyaki\b/.test(normalized)) ||
    (recipe.title === 'Sate Lilit Bali' && /\bsate\s+lilit\b/.test(normalized))
  );
  if (requestedRecipe) {
    const dietaryNote = ['Babi Guling Bali (Versi Rumahan)', 'Lawar Sayur Bali'].includes(requestedRecipe.title)
      ? '\n\nCatatan: babi guling memakai daging babi. Lawar ini versi sayur tanpa daging dan tanpa darah.'
      : '';
    return { type: 'recipe', text: `Asik, kita bikin **${requestedRecipe.title}**! Aku tuliskan resep lengkapnya di bawah—kalau ada bahan yang nggak tersedia, bilang saja, nanti kita cari gantinya.${dietaryNote}`, recipe: { title: requestedRecipe.title, time: requestedRecipe.time, idx: RECIPES_DB.indexOf(requestedRecipe) } };
  }

  // Only offer a substitution for an ingredient actually mentioned.
  if (currentChatRecipeIdx !== null && /\b(lebih pedas|tambah pedas|kurang pedas|tidak pedas|ga pedas|nggak pedas|lebih hemat|tips|trik)\b/.test(normalized)) {
    const recipe = RECIPES_DB[currentChatRecipeIdx];
    const advice = /\b(lebih pedas|tambah pedas)\b/.test(normalized)
      ? 'Tambahkan cabai sedikit demi sedikit saat menumis bumbu, lalu cicipi sebelum menambah lagi.'
      : /\b(kurang pedas|tidak pedas|ga pedas|nggak pedas)\b/.test(normalized)
        ? 'Kurangi atau hilangkan cabai rawit. Rasa tetap gurih dengan bawang, garam, dan sedikit jeruk limau.'
        : 'Pakai bahan pengganti yang sudah ada, siapkan semua bahan sebelum memasak, dan buat porsi sesuai kebutuhan agar tidak ada sisa.';
    return { type: 'text', text: `Buat **${recipe.title}**, ${advice} Mau ubah bahan tertentu juga boleh—sebutkan bahan yang ingin diganti.` };
  }

  // Match recipes against ingredients from this message and the scan list.
  const availableIngredients = [...new Set([
    ...detectedIngredients.map(item => item.name.toLowerCase()),
    ...( /\b(bun|buns|burger\s+bun|roti\s+burger)\b/.test(normalized) ? ['roti burger'] : [] ),
    ...( /\b(patty|patti|beef\s+patty|chicken\s+patty|patty\s+burger)\b/.test(normalized) ? ['patty'] : [] ),
    ...Object.keys(AI_RESPONSES.keywords).filter(item => item !== 'default' && textHasPhrase(normalized, item)),
    ...RECIPES_DB.flatMap(recipe => recipe.ingredients.map(item => item.replace(/^\S+\s*/, '').toLowerCase()).filter(item => textHasPhrase(normalized, item)))
  ])];
  const asksForRecipe = /\b(resep|masak|masakan|makanan|ide|buat apa|bikin apa|menu)\b/.test(normalized);
  if (availableIngredients.length && (asksForRecipe || availableIngredients.some(item => normalized.includes(item)))) {
    const mentionsIngredient = (ingredient, available) => textHasPhrase(ingredient.replace(/^\S+\s*/, ''), available);
    const rankedRecipes = RECIPES_DB.map(recipe => {
      const matched = recipe.ingredients.filter(ingredient => availableIngredients.some(available => mentionsIngredient(ingredient, available)));
      const hasMainIngredient = recipe.ingredients.slice(0, 2).some(ingredient => availableIngredients.some(available => mentionsIngredient(ingredient, available)));
      const asksProtein = /\b(protein|tinggi protein|banyak protein)\b/.test(normalized);
      const asksQuick = /\b(cepat|kilat|sebentar|praktis|singkat)\b/.test(normalized);
      const hasChicken = recipe.ingredients.some(ingredient => mentionsIngredient(ingredient, 'ayam'));
      const meetsIntent = (!asksProtein || hasChicken || recipe.ingredients.some(ingredient => /telur|tempe|tahu|daging|ikan|kacang/i.test(ingredient))) &&
        (!asksQuick || parseInt(recipe.time, 10) <= 30);
      return { recipe, matched, score: matched.length, meetsIntent, hasMainIngredient };
    }).filter(item => item.score > 0 && item.meetsIntent &&
      (availableIngredients.length > 1 || item.hasMainIngredient) &&
      (item.recipe.title !== 'Burger Ayam Rumahan' || /\b(burger|hamburger|bun|patty)\b/.test(normalized)) &&
      (item.recipe.title !== 'Fried Chicken Rumahan' || /\b(fried chicken|crispy|krispi|goreng)\b/.test(normalized))
    ).sort((a, b) => b.score - a.score || parseInt(a.recipe.time, 10) - parseInt(b.recipe.time, 10));

    const best = rankedRecipes[0];
    if (best) {
      const names = availableIngredients.join(', ');
      if (best.recipe.title === 'Burger Ayam Rumahan' && availableIngredients.includes('roti burger') && availableIngredients.includes('patty')) {
        return {
          type: 'recipe',
          text: 'Nah, bun + patty sudah cukup buat burger simpel! 🔥 Masak patty sampai matang, panggang bun sebentar, lalu tumpuk. Keju, saus, atau sayur cuma tambahan kalau ada. Aku tulis langkah lengkapnya di bawah.',
          recipe: { title: best.recipe.title, time: best.recipe.time, idx: RECIPES_DB.indexOf(best.recipe) }
        };
      }
      return {
        type: 'recipe',
        text: `Dari pesanmu, bahan yang cocok adalah **${names}**. Ide yang paling mendekati: **${best.recipe.title}** (${best.recipe.time}, ${best.recipe.difficulty.toLowerCase()}). Resep ini memakai ${best.matched.join(', ')}. Mau aku bantu sesuaikan langkahnya dengan bahan yang kamu punya?`,
        recipe: { title: best.recipe.title, time: best.recipe.time, idx: RECIPES_DB.indexOf(best.recipe) }
      };
    }
    if (availableIngredients.length) {
      const names = availableIngredients.join(', ');
      return { type: 'text', text: `Aku baru menangkap ${names}. Itu belum cukup untuk memilih resep utama dengan pas. Ada bahan lain yang bisa dipakai, atau kamu sedang mencari pengganti untuk bahan ini?` };
    }
  }

  if (asksForRecipe && detectedIngredients.length) {
    const names = detectedIngredients.map(i => i.name).join(', ');
    const ranked = RECIPES_DB.map(recipe => ({ recipe, score: recipe.ingredients.filter(ingredient => detectedIngredients.some(item => ingredient.toLowerCase().includes(item.name.toLowerCase()))).length }))
      .sort((a, b) => b.score - a.score || parseInt(a.recipe.time, 10) - parseInt(b.recipe.time, 10));
    const best = ranked[0];
    if (best && best.score) return { type: 'recipe', text: `Dari daftar bahanmu (${names}), coba **${best.recipe.title}** (${best.recipe.time}). Resep ini paling banyak memakai bahan yang sudah tersedia.`, recipe: { title: best.recipe.title, time: best.recipe.time, idx: RECIPES_DB.indexOf(best.recipe) } };
  }

  if (/\b(tips|cara memasak|cara masak|supaya|agar)\b/.test(normalized)) {
    return { type: 'text', text: 'Tentu, aku bantu. Bahan atau masakan apa yang sedang kamu siapkan? Dengan detail itu aku bisa memberi tips yang pas.' };
  }

  return {
    type: 'text',
    text: `Aku menangkap pesanmu: “${escapeHtml(message)}”. Aku khusus membantu soal resep dan memasak. Ceritakan bahan yang tersedia atau tanyakan resep, cara memasak, maupun pengganti bahan supaya aku bisa memberi saran yang tepat.`
  };
}

function appendChatMessage(text, role) {
  const container = document.getElementById('chatMessages');
  const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const div = document.createElement('div');
  div.className = `chat-bubble ${role === 'user' ? 'user-bubble' : 'bot-bubble'}`;

  if (role === 'user') {
    div.innerHTML = `
      <div class="bubble-content"><p>${escapeHtml(text)}</p></div>
      <div class="bubble-avatar">👤</div>
      <span class="bubble-time">${time}</span>
    `;
  } else {
    div.innerHTML = `
      <div class="bubble-avatar">👩‍🍳</div>
      <div class="bubble-content"><p>${formatBotText(text)}</p></div>
      <span class="bubble-time">${time}</span>
    `;
  }

  container.appendChild(div);
  div.style.animation = 'slideIn 0.3s ease';
  container.scrollTop = container.scrollHeight;
}

function appendAIResponse(response) {
  const container = document.getElementById('chatMessages');
  const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const div = document.createElement('div');
  div.className = 'chat-bubble bot-bubble';

  let recipeCardHTML = '';
  if (response.type === 'recipe' && response.recipe) {
    const r = RECIPES_DB[response.recipe.idx] || RECIPES_DB[0];
    currentChatRecipeIdx = response.recipe.idx;
    recipeCardHTML = `
      <section class="chat-recipe-card" aria-label="Resep ${escapeHtml(r.title)}">
        <div class="crc-title">${r.emoji} ${escapeHtml(r.title)}</div>
        <div class="crc-meta">⏱ ${escapeHtml(r.time)} &nbsp;•&nbsp; ${escapeHtml(r.difficulty)} &nbsp;•&nbsp; 👥 ${escapeHtml(r.servings)}</div>
        <h4>Bahan-bahan</h4>
        <ul class="chat-recipe-ingredients">${r.ingredients.map(ingredient => `<li>${escapeHtml(ingredient)}</li>`).join('')}</ul>
        <h4>Langkah memasak</h4>
        <ol class="chat-recipe-steps">${r.steps.map(step => `<li>${escapeHtml(step)}</li>`).join('')}</ol>
        <button class="crc-link" type="button" onclick="openRecipeByIndex(${response.recipe.idx})">Buka tampilan resep ↗</button>
        <div class="chat-recipe-actions">
          <button type="button" onclick="sendQuickPrompt('Bikin versi lebih pedas')">🌶️ Bikin lebih pedas</button>
          <button type="button" onclick="sendQuickPrompt('Bahan apa yang bisa diganti?')">🔄 Tanya substitusi</button>
          <button type="button" onclick="sendQuickPrompt('Kasih tips biar lebih hemat')">💡 Tips hemat</button>
        </div>
      </section>
    `;
  }

  div.innerHTML = `
    <div class="bubble-avatar">👩‍🍳</div>
    <div class="bubble-content">
      <p>${formatBotText(response.text)}</p>
      ${recipeCardHTML}
    </div>
    <span class="bubble-time">${time}</span>
  `;

  container.appendChild(div);
  div.style.animation = 'slideIn 0.3s ease';
  container.scrollTop = container.scrollHeight;
}

function appendTypingIndicator(id) {
  const container = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.id = id;
  div.className = 'chat-bubble bot-bubble';
  div.innerHTML = `
    <div class="bubble-avatar">👩‍🍳</div>
    <div class="bubble-content" style="padding:14px 18px">
      <div class="typing-dots">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function hideQuickPrompts() {
  const qp = document.getElementById('quickPrompts');
  if (qp) qp.style.display = 'none';
}

function initQuickPromptDragging() {
  const strip = document.querySelector('.qp-scroll');
  if (!strip || strip.dataset.dragReady) return;
  strip.dataset.dragReady = 'true';

  let startX = 0;
  let startScrollLeft = 0;
  let isDragging = false;
  let didMove = false;

  strip.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    startX = event.clientX;
    startScrollLeft = strip.scrollLeft;
    isDragging = true;
    didMove = false;
  });

  window.addEventListener('pointermove', event => {
    if (!isDragging) return;
    const distance = event.clientX - startX;
    if (Math.abs(distance) > 5) {
      didMove = true;
      strip.classList.add('dragging');
      strip.scrollLeft = startScrollLeft - distance;
    }
  });

  const stopDragging = () => {
    if (!isDragging) return;
    isDragging = false;
    strip.classList.remove('dragging');
    if (didMove) strip.dataset.draggedAt = String(Date.now());
  };
  window.addEventListener('pointerup', stopDragging);
  window.addEventListener('pointercancel', stopDragging);
  strip.addEventListener('click', event => {
    if (Date.now() - Number(strip.dataset.draggedAt || 0) < 250) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
}

function formatBotText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function autoResizeTextarea(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
let toastTimeout;
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeRecipeModal();
    document.getElementById('navLinks').classList.remove('open');
  }
});

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initQuickPromptDragging();
  initParticles();
  initScrollEffects();
  animateFooterCounter();
  showPage('home');
  bindRecipeImageFallbacks();

  // Initial recipe grid render
  setTimeout(() => {
    renderJelajahiGrid();
  }, 100);
});
