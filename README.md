# Resepin

Website resep zero food waste: masukkan bahan sisa secara manual atau pindai objek yang didukung kamera, lalu temukan ide masakan dan tanyakan Chef Resepin.

## Menjalankan

Backend scan memerlukan **CPython Windows 64-bit**. Python dari MSYS2/MinGW tidak cocok untuk memasang wheel PyTorch. Pasang Python 3.12 dari [python.org](https://www.python.org/downloads/windows/) dan pastikan perintah `py -3.12 --version` berhasil.

### Setup baru di Windows

Buka PowerShell, lalu jalankan perintah berikut. Akun GitHub harus sudah menerima akses ke repo model privat `resepin-models`.

```powershell
git clone https://github.com/anrahadi-dotcom/Resepin.git
cd Resepin
git lfs install
git clone https://github.com/anrahadi-dotcom/resepin-models.git models
py -3.12 -m venv .venv-win
.\.venv-win\Scripts\python.exe -m pip install -r requirements.txt
.\.venv-win\Scripts\python.exe server.py
```

Server menampilkan alamat `http://127.0.0.1:8000`. Buka alamat itu di browser. Kamera memerlukan izin pengguna dan secure context (`localhost` memenuhi syarat ini). Jangan membuka `index.html` langsung sebagai file atau memakai Live Server; frontend memanggil API lokal pada origin yang sama. Tekan `Ctrl+C` di terminal untuk menghentikan server.

### Menjalankan dari VS Code

1. Buka folder `Resepin` di VS Code.
2. Pilih **Python: Select Interpreter** dari Command Palette (`Ctrl+Shift+P`), lalu pilih `.venv-win\Scripts\python.exe`.
3. Buka terminal PowerShell di folder project dan jalankan:

   ```powershell
   .\.venv-win\Scripts\python.exe server.py
   ```

Jika model sudah pernah di-clone, jangan clone lagi. Ambil update model dengan:

```powershell
git -C models pull
```

Untuk mengambil update kode website, jalankan `git pull` dari folder `Resepin`.

### Memperbarui model

Setelah mengganti `models/best.pt`, pemilik model dapat mengirim versinya ke repo privat:

```powershell
git -C models add best.pt
git -C models commit -m "Update ingredient model"
git -C models push
```

Teman yang sudah menerima akses repo privat cukup menjalankan `git -C models pull`.

### Deploy ke Vercel (frontend dan API scan)

Repo ini dapat diimpor sebagai project Vercel dengan root directory default. Vercel menyajikan file frontend sebagai static site dan menjalankan `api/detect.py` sebagai Python Function. Setelah menghubungkan repo GitHub, tambahkan environment variables berikut di **Project Settings → Environment Variables**, lalu deploy ulang:

- `RESEPIN_GITHUB_TOKEN`: fine-grained personal access token yang dibatasi ke repo privat `resepin-models` dengan izin **Contents: Read-only**. Function memakai token ini untuk mengambil pointer dan bobot Git LFS; token tidak dikirim ke browser atau disimpan di repo.
- `VERCEL_SUPPORT_LARGE_FUNCTIONS`: isi `1` agar bundle Python yang memuat PyTorch dapat melewati batas ukuran function standar. Vercel mensyaratkan Fluid Compute dengan Active CPU untuk large functions.

Atur kedua variable untuk Production dan Preview. Model diunduh dan diverifikasi saat function pertama kali menerima foto, lalu disimpan pada cache sementara instance tersebut. Endpoint menerima foto hingga 4 MB karena batas request Vercel Functions adalah 4,5 MB; browser mengecilkan foto kamera sebelum mengirimnya. Server `server.py` tetap dipakai saat development lokal.

## Bagian aplikasi

- Beranda: pengenalan produk dan resep unggulan.
- Scan Bahan: kamera, deteksi foto melalui model PyTorch lokal, Mode Demo, input manual, dan daftar bahan.
- Resep/Jelajahi: katalog resep, filter dan pencarian berdasarkan bahan.
- Chef Resepin: asisten resep berbasis aturan lokal untuk ide awal, variasi, dan substitusi. Balasan resep menampilkan bahan dan langkah langsung di chat dengan tombol tindak lanjut.
- Modal resep: detail bahan, langkah, serta penyimpanan lokal di browser.

## Struktur frontend

- `index.html`: kerangka halaman dan urutan pemuatan stylesheet/script; hero memakai Vue 3 dan Tailwind CDN.
- `api/detect.py`: endpoint scan untuk Vercel Functions; mengambil bobot model dari Git LFS privat.
- `css/style.css`: komponen, warna, dan gaya dasar.
- `css/responsive.css`: breakpoint layar dan preferensi aksesibilitas.
- `js/main.js`: navigasi halaman, kamera, katalog UI, dan interaksi umum.
- `js/recipes.js`: data resep dan mapping foto.
- `js/chef-prompts.js`: teks jawaban standar Chef Resepin.
- `js/chatbot.js`: alur chat, pencocokan maksud, dan tampilan jawaban/resep.

## Alur pengguna

Beranda → Scan Bahan → izinkan kamera → arahkan ke bahan → Ambil Foto → periksa/ubah bahan terdeteksi → Cari Resep atau Tanya Chef Resepin.

## Implementasi dan batasan

Antarmuka menggunakan HTML, CSS responsif, dan JavaScript tanpa proses build. Server Python bawaan memuat `models/best.pt` menggunakan Ultralytics/PyTorch saat server mulai; checkpoint ini berisi 30 kelas bahan berbahasa Indonesia, yang juga dicatat di `data_classes.yaml`. Foto kamera dikirim ke endpoint lokal `/api/detect`, diproses di komputer yang menjalankan server, lalu dibuang setelah inferensi. File gambar tidak disimpan. Model mendeteksi objek sesuai kelas yang dipelajari; periksa hasilnya dan tambahkan bahan lain secara manual bila perlu. Mode Demo selalu menghasilkan bahan contoh dan bukan deteksi model.

Server deteksi hanya bind ke `127.0.0.1`, memeriksa origin permintaan, membatasi foto ke JPG/PNG/WebP hingga 10 MB, dan hanya menyajikan file frontend yang diperlukan. Checkpoint tidak bisa diunduh melalui web. Tidak ada kunci API atau panggilan layanan AI eksternal; Chef tetap memakai katalog dan aturan JavaScript lokal. Font masih dimuat dari Google Fonts.

Katalog awal mencakup masakan rumahan, beberapa menu Bali (babi guling versi rumahan, ayam betutu, ayam sere lemo, ayam bakar, lawar sayur, sate lilit), serta hidangan populer seperti fried chicken, pizza, burger, pasta, ramen, sushi roll isi matang, taco, pancake, dan teriyaki. Katalog ini bukan ensiklopedia semua masakan; resep baru dapat ditambahkan ke `RECIPES_DB`.

## Prompt Chef Resepin

Jadilah chef yang ramah, kreatif, dan ahli masakan minim limbah. Susun resep praktis dari bahan pengguna, termasuk saat bahan terbatas; sarankan substitusi bila bumbu tidak tersedia. Jawab dalam bahasa Indonesia dengan nama masakan, estimasi waktu dan kesulitan, bahan utama dan bumbu dasar, langkah singkat, serta tips hemat/substitusi. Jangan menganggap bahan opsional tersedia tanpa menjelaskannya.
