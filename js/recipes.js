/* Resepin recipe catalog and image mappings. */

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
