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

### Deploy ke Cloudflare Pages

Frontend statis dibangun ke `dist/` dengan `npm run build` dan diunggah menggunakan Wrangler. Jalankan `npx wrangler pages deploy dist --project-name=resepin` setelah menghubungkan Wrangler ke akun Cloudflare.

Pages saat ini hanya menjalankan frontend. Scan publik memakai checkpoint PyTorch custom `models/best.pt`, jadi endpoint scan belum aktif di Cloudflare. Menjalankan checkpoint privat di platform Cloudflare memerlukan Container yang diprovisikan lewat Workers Paid; model dapat dibundel di image privat Container agar tidak disajikan sebagai aset publik. Server scan lokal tetap tersedia lewat `server.py`.

## Bagian aplikasi

- Beranda: pengenalan produk dan resep unggulan.
- Scan Bahan: kamera, deteksi foto melalui model PyTorch lokal, Mode Demo, input manual, dan daftar bahan.
- Resep/Jelajahi: katalog resep, filter dan pencarian berdasarkan bahan.
- Chef Resepin: asisten dapur dengan aturan lokal untuk resep katalog, substitusi umum, teknik, dan keamanan pangan. Pertanyaan yang belum cocok memakai Cloudflare Workers AI melalui Pages Function; balasan resep katalog menampilkan bahan dan langkah langsung di chat.
- Modal resep: detail bahan, langkah, serta penyimpanan lokal di browser.

## Struktur frontend

- `index.html`: kerangka seluruh halaman aplikasi.
- `src/app.js`: entry point Vue 3 untuk shell aplikasi dan interaksi hero.
- `src/legacy/`: modul JavaScript lama yang masih menangani perilaku katalog, kamera, dan chat sambil dipindahkan ke komponen Vue.
- `functions/api/detect.js`: respons fallback Pages ketika endpoint scan belum dipasang.
- `css/reference-theme.css`: token warna krem/cokelat, komponen, dan breakpoint tambahan.
- `css/style.css`: komponen, warna, dan gaya dasar.
- `css/responsive.css`: breakpoint layar dan preferensi aksesibilitas.

Hero memakai foto koki lokal dari `assets/img/chef-hero.jpg`; gambar resep menggunakan foto lokal di `assets/img/`.

## Alur pengguna

Beranda → Scan Bahan → izinkan kamera → arahkan ke bahan → Ambil Foto → periksa/ubah bahan terdeteksi → Cari Resep atau Tanya Chef Resepin.

## Pengembangan, build, dan pemeriksaan

Frontend memakai Vue 3 yang disimpan di repo, HTML, dan CSS; skrip build hanya menyalin file statis ke `dist/` untuk Cloudflare Pages. Untuk menyiapkan deploy dan menjalankan cek lokal:

```powershell
npm test
npm run build
```

`npm test` menjalankan pemeriksaan utilitas pencocokan bahan, kalkulasi resep, serta kelengkapan katalog/foto menggunakan Node.js bawaan. Cek sintaks browser JavaScript dapat dijalankan dengan `node --check src/app.js` dan `node --check src/legacy/main.js`.

## Implementasi dan batasan

### Keputusan desain

- Navigasi memakai satu landmark utama per halaman. Pembungkus `.page` tetap menjadi landmark agar perpindahan rute bisa memindahkan fokus dan tautan “Lewati ke konten” selalu menuju halaman aktif.
- Chat koki mengambang tetap non-modal: pengguna boleh berpindah ke kontrol halaman lain saat chat terbuka, jadi fokus tidak dikunci di panel.
- Pilihan tema dibaca sebelum stylesheet merender halaman, dengan preferensi sistem sebagai cadangan. Google Fonts tetap dimuat dari layanan Google; font sistem menjadi fallback jika jaringan font tidak tersedia.
- Foto katalog menetapkan dimensi intrinsik 800×600, sedangkan gambar modal mempertahankan rasio melalui kontainer dan CSS. Gambar hero bukan gambar konten dan memakai ukuran cover.
- Petunjuk navbar tetap mengajarkan hover pada desktop dan klik pada perangkat sentuh; petunjuk menghilang setelah interaksi pertama.

Antarmuka memakai Vue 3 yang disimpan di repo, HTML, dan CSS responsif. Server Python bawaan memuat `models/best.pt` menggunakan Ultralytics/PyTorch saat server mulai; checkpoint ini berisi 30 kelas bahan berbahasa Indonesia, yang juga dicatat di `data_classes.yaml`. Foto kamera dikirim ke endpoint lokal `/api/detect`, diproses di komputer yang menjalankan server, lalu dibuang setelah inferensi. File gambar tidak disimpan. Model mendeteksi objek sesuai kelas yang dipelajari; periksa hasilnya dan tambahkan bahan lain secara manual bila perlu. Mode Demo selalu menghasilkan bahan contoh dan bukan deteksi model.

Server deteksi lokal hanya bind ke `127.0.0.1`, memeriksa origin permintaan, membatasi foto ke JPG/PNG/WebP hingga 10 MB, dan tidak menyajikan checkpoint lewat web. Di deployment Pages, endpoint scan masih mengembalikan status belum tersedia sampai backend Container Cloudflare dipasang. Chef memakai aturan JavaScript lokal terlebih dulu dan meneruskan pertanyaan yang belum dikenali ke Cloudflare Workers AI. Binding `AI` dikonfigurasi di `wrangler.jsonc`; tidak ada kunci API di browser. Workers AI memiliki alokasi gratis harian yang terbatas, sehingga jawaban AI bisa tidak tersedia saat kuota habis. Saat lokal, jalankan `npm run build` lalu `npx wrangler pages dev dist --ai=AI`; penggunaan binding AI lokal tetap memanggil layanan Cloudflare. Jika layanan gagal, Chef menampilkan jawaban fallback lokal. Maksimal enam pesan percakapan terakhir dikirim untuk konteks; jangan masukkan data pribadi/sensitif. Font masih dimuat dari Google Fonts.

Pencarian bahan membandingkan bahan resep yang dinormalisasi, menerima sinonim dan toleransi typo kecil, lalu mengurutkan hasil berdasarkan kecocokan. Harga adalah perkiraan lokal, bukan harga real-time. Data katalog saat ini tidak punya takaran tepercaya untuk tiap bahan; karena itu penskalaan porsi disembunyikan alih-alih menampilkan jumlah karangan. Mode timer hanya muncul jika langkah resep punya durasi terstruktur. Penyimpanan resep memakai localStorage pada browser pengguna.

Halaman memakai hash route (`#/resep`, `#/chef`, `#/jelajahi`, dan lainnya) agar refresh/deep link tetap bekerja di hosting statis. Metadata dan JSON-LD resep diubah di sisi client; crawler yang tidak menjalankan JavaScript mungkin hanya melihat metadata beranda. `sitemap.xml` saat ini hanya mencantumkan beranda.

Tema mengikuti preferensi sistem pada kunjungan pertama dan pilihan manual disimpan di localStorage. Kontras token teks utama, sekunder, dan muted diperiksa terhadap latar tema terang/gelap; animasi menghormati preferensi reduced motion. Form kamera tetap memerlukan izin kamera pada secure context. Scan publik memerlukan backend Container Cloudflare; server lokal tetap menggunakan checkpoint privat di folder `models/`. Tidak ada API key yang disimpan di browser.

Katalog awal berisi 40 resep: masakan rumahan dan Bali serta hidangan populer. Katalog ini bukan ensiklopedia; resep baru dapat ditambahkan ke `RECIPES_DB`.

## Prompt Chef Resepin

Jadilah chef yang ramah, kreatif, dan ahli masakan minim limbah. Susun resep praktis dari bahan pengguna, termasuk saat bahan terbatas; sarankan substitusi bila bumbu tidak tersedia. Jawab dalam bahasa Indonesia dengan nama masakan, estimasi waktu dan kesulitan, bahan utama dan bumbu dasar, langkah singkat, serta tips hemat/substitusi. Jangan menganggap bahan opsional tersedia tanpa menjelaskannya.
