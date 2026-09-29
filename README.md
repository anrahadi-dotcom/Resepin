# Resepin

Website resep zero food waste: masukkan bahan sisa secara manual atau pindai objek yang didukung kamera, lalu temukan ide masakan dan tanyakan Chef Resepin.

## Menjalankan

Buka folder ini melalui server web lokal (contohnya Live Server di VS Code), lalu kunjungi alamat `localhost` yang diberikan. Kamera memerlukan izin pengguna dan secure context (`localhost` atau HTTPS). TensorFlow.js dan model COCO-SSD dimuat dari jsDelivr, jadi pemindaian ML memerlukan koneksi internet.

## Bagian aplikasi

- Beranda: pengenalan produk dan resep unggulan.
- Scan Bahan: kamera, deteksi foto di browser, Mode Demo, input manual, dan daftar bahan.
- Resep/Jelajahi: katalog resep, filter dan pencarian berdasarkan bahan.
- Chef AI: asisten resep berbasis aturan lokal untuk ide awal, variasi, dan substitusi. Balasan resep menampilkan bahan dan langkah langsung di chat dengan tombol tindak lanjut.
- Modal resep: detail bahan, langkah, serta penyimpanan lokal di browser.

## Alur pengguna

Beranda → Scan Bahan → izinkan kamera → arahkan ke bahan → Ambil Foto → periksa/ubah bahan terdeteksi → Cari Resep atau Tanya Chef AI.

## Implementasi dan batasan

Antarmuka menggunakan HTML, CSS responsif, dan JavaScript tanpa proses build. Deteksi memakai TensorFlow.js dengan model COCO-SSD di browser. Model ini hanya mengenali kelas objek COCO tertentu; hasil perlu dikonfirmasi pengguna dan bahan yang tidak didukung bisa dimasukkan manual. Mode Demo selalu menghasilkan bahan contoh dan bukan deteksi ML.

Respons Chef saat ini memakai basis resep dan aturan JavaScript lokal, bukan model generatif atau API eksternal. Untuk produksi, pindahkan instruksi Chef Resepin dan konteks bahan ke backend (misalnya Node.js + Express), lalu panggil API AI dari server agar kunci API tidak ditanam di browser. Backend juga dapat menyimpan akun, resep favorit, dan histori. Pertimbangkan model klasifikasi bahan makanan yang dilatih khusus bila cakupan deteksi bahan Indonesia perlu lebih luas.

Katalog awal mencakup masakan rumahan, beberapa menu Bali (babi guling versi rumahan, ayam betutu, ayam sere lemo, ayam bakar, lawar sayur, sate lilit), serta hidangan populer seperti fried chicken, pizza, burger, pasta, ramen, sushi roll isi matang, taco, pancake, dan teriyaki. Katalog ini bukan ensiklopedia semua masakan; resep baru dapat ditambahkan ke `RECIPES_DB`.

## Prompt Chef Resepin

Jadilah chef yang ramah, kreatif, dan ahli masakan minim limbah. Susun resep praktis dari bahan pengguna, termasuk saat bahan terbatas; sarankan substitusi bila bumbu tidak tersedia. Jawab dalam bahasa Indonesia dengan nama masakan, estimasi waktu dan kesulitan, bahan utama dan bumbu dasar, langkah singkat, serta tips hemat/substitusi. Jangan menganggap bahan opsional tersedia tanpa menjelaskannya.
