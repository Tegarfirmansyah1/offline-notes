# AM Notes | Spatial Developer Edition

AM Notes adalah aplikasi pencatatan berbasis *spatial canvas* (papan tulis dua dimensi tak terbatas) yang dirancang khusus untuk *developer*, arsitek sistem, dan pemikir visual. Aplikasi ini mengusung arsitektur *Local-First* dan *Zero-Backend*, di mana seluruh pemrosesan dan penyimpanan data beroperasi secara lokal di dalam peramban (*browser*) pengguna.

## Arsitektur & Fitur Utama

### 1. Infinite Spatial Canvas
Menggunakan antarmuka kanvas tak terbatas yang ditenagai oleh `React Flow`. Pengguna dapat memetakan ide, potongan kode, atau alur logika secara spasial. Setiap elemen (*node*) dapat dipindahkan, diubah ukurannya, dan dihubungkan satu sama lain menggunakan sistem garis relasi manual.

### 2. Local-First & Zero Latency (OPFS + SQLite WASM)
Tidak bergantung pada *database cloud* atau koneksi internet. Aplikasi ini menggunakan `SQLocal` untuk menjalankan mesin SQLite secara *native* di dalam peramban melalui WebAssembly (WASM). Data disimpan secara permanen dan aman di dalam Origin Private File System (OPFS), menjamin latensi nol (*zero latency*) saat membaca atau menulis catatan.

### 3. FTS5 Lightning Search & Auto-Focus Camera
Pencarian data ditangani langsung oleh mesin Full-Text Search (FTS5) bawaan SQLite. Proses pencarian bersifat deterministik dan memakan waktu dalam hitungan milidetik. Terintegrasi dengan *Viewport API*, kamera kanvas akan secara otomatis bergerak (*smooth panning & zooming*) menuju koordinat lokasi catatan yang dicari.

### 4. Developer-Grade Markdown Editor
Editor teks terintegrasi dengan `react-markdown` dan `remark-gfm`. Mendukung format penulisan standar GitHub-Flavored Markdown. Pengguna dapat dengan mudah menulis dan merender tabel, daftar tugas, hingga blok kode (*code snippets*) secara presisi di dalam catatan.

### 5. Auto-Expanding Kanban Zones
Sistem tata letak hierarkis (*Parent-Child node mapping*). Catatan yang ditarik ke dalam area Zona secara otomatis akan terikat (*bound*) dengan Zona tersebut. Logika batas area (*bounding box*) telah diprogram agar dimensi Zona membesar secara otomatis (*auto-expand*) apabila muatan catatan di dalamnya bertambah.

### 6. Mobile-Optimized Workspace
Antarmuka dirancang untuk beradaptasi dengan ukuran layar sentuh. Menggunakan sistem *Responsive Drawer* untuk pengaturan ruang kerja dan *Floating Action Dock* khusus di perangkat seluler. Sistem navigasi sentuh dikonfigurasi secara ketat untuk mencegah gangguan gestur bawaan peramban seperti *pull-to-refresh*.

## Tech Stack

* **Core Framework:** React / Next.js
* **Styling:** Tailwind CSS
* **Spatial Engine:** @xyflow/react
* **Local Database:** SQLocal (SQLite WebAssembly + OPFS)
* **Markdown Parsing:** react-markdown, remark-gfm

## Panduan Instalasi Lokal

1. Clone repositori ke mesin lokal Anda:
   ```bash
   git clone [https://github.com/username/am-notes.git](https://github.com/username/offline-notes.git)
   cd am-notes

2. Instalasi seluruh dependensi NPM:

  ```bash
npm install

3. Jalankan server pengembangan:
  ```bash
npm run dev

4. Akses aplikasi melalui peramban di http://localhost:3000 (atau port terkait yang digunakan oleh Vite/Next).