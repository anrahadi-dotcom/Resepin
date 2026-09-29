# Resepin

Website resep zero food waste: masukkan bahan sisa secara manual atau pindai objek yang didukung kamera, lalu temukan ide masakan dan tanyakan Chef Resepin.

## Menjalankan

Deteksi bahan memakai checkpoint PyTorch milik project, jadi jalankan backend lokal untuk membuka situs dan memproses foto:

```powershell
python -m pip install -r requirements.txt
python -m uvicorn server:app --host 127.0.0.1 --port 8000
```

Buka `http://127.0.0.1:8000`. Kamera memerlukan izin pengguna dan secure context (`localhost` memenuhi syarat ini). Jangan membuka `index.html` langsung sebagai file atau memakai Live Server; frontend memanggil API lokal pada origin yang sama.

## Bagian aplikasi

- Beranda: pengenalan produk dan resep unggulan.
- Scan Bahan: kamera, deteksi foto melalui model PyTorch lokal, Mode Demo, input manual, dan daftar bahan.
- Resep/Jelajahi: katalog resep, filter dan pencarian berdasarkan bahan.
- Chef Resepin: asisten resep berbasis aturan lokal untuk ide awal, variasi, dan substitusi. Balasan resep menampilkan bahan dan langkah langsung di chat dengan tombol tindak lanjut.
- Modal resep: detail bahan, langkah, serta penyimpanan lokal di browser.

## Alur pengguna

Beranda → Scan Bahan → izinkan kamera → arahkan ke bahan → Ambil Foto → periksa/ubah bahan terdeteksi → Cari Resep atau Tanya Chef Resepin.

## Implementasi dan batasan

Antarmuka menggunakan HTML, CSS responsif, dan JavaScript tanpa proses build. FastAPI memuat `models/best.pt` menggunakan Ultralytics/PyTorch saat server mulai; checkpoint ini berisi 30 kelas bahan berbahasa Indonesia, yang juga dicatat di `data_classes.yaml`. Foto kamera dikirim ke endpoint lokal `/api/detect`, diproses di komputer yang menjalankan server, lalu dibuang setelah inferensi. File gambar tidak disimpan. Model mendeteksi objek sesuai kelas yang dipelajari; periksa hasilnya dan tambahkan bahan lain secara manual bila perlu. Mode Demo selalu menghasilkan bahan contoh dan bukan deteksi model.

Server deteksi hanya menerima koneksi loopback dari komputer lokal, memeriksa origin permintaan, membatasi foto ke JPG/PNG/WebP hingga 10 MB, dan hanya menyajikan file frontend yang diperlukan. Checkpoint tidak bisa diunduh melalui web. Tidak ada kunci API atau panggilan layanan AI eksternal; Chef tetap memakai katalog dan aturan JavaScript lokal. Font masih dimuat dari Google Fonts.

Katalog awal mencakup masakan rumahan, beberapa menu Bali (babi guling versi rumahan, ayam betutu, ayam sere lemo, ayam bakar, lawar sayur, sate lilit), serta hidangan populer seperti fried chicken, pizza, burger, pasta, ramen, sushi roll isi matang, taco, pancake, dan teriyaki. Katalog ini bukan ensiklopedia semua masakan; resep baru dapat ditambahkan ke `RECIPES_DB`.

## Prompt Chef Resepin

Jadilah chef yang ramah, kreatif, dan ahli masakan minim limbah. Susun resep praktis dari bahan pengguna, termasuk saat bahan terbatas; sarankan substitusi bila bumbu tidak tersedia. Jawab dalam bahasa Indonesia dengan nama masakan, estimasi waktu dan kesulitan, bahan utama dan bumbu dasar, langkah singkat, serta tips hemat/substitusi. Jangan menganggap bahan opsional tersedia tanpa menjelaskannya.
