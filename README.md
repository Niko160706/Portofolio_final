# THE HUMAN PROTOCOL — Portofolio

Portofolio pribadi **Niko Rajani Syahputra Pane**, mahasiswa Informatika Telkom University Surabaya. Berisi profil, pengalaman, proyek, dan informasi kontak dalam satu halaman editorial yang di-scroll vertikal.

---

## Isi situs

- **Beranda** — perkenalan, peran, dan tautan cepat.
- **Selected Work** — empat proyek:
  - **Deep Research** — preview riset dengan metrik 84% recall (angka self-reported).
  - **Visualize** — demo matriks 2D interaktif.
  - **UMKM / Bilqish** — studi antarmuka.
  - **Starlink Reseller** — katalog perbandingan skematis.
- **Lab** — indeks proyek dan panel utilitas.
- **How I Work** — tiga prinsip kerja.
- **About** — bio, riwayat, keahlian, penghargaan, dan sertifikasi.
- **Contact** — email, LinkedIn, GitHub, dan CV.

Ada juga **MORO**, karakter canvas kecil yang bisa diajak interaksi, dan beberapa catatan anomali fiktif yang bisa dinyalakan/dimatikan lewat pengaturan. Semua teks bersifat lokal dan deterministik — tidak ada AI live, backend, atau telemetri.

---

## Teknologi

| Bagian | Dipakai |
|---|---|
| Framework | **Astro 7** (static output) |
| UI | **React 19** |
| Styling | CSS biasa (tanpa Tailwind) |
| Animasi karakter | Canvas API + sprite sheet |
| Font | Inter, IBM Plex Mono, Silkscreen, VT323 (self-hosted) |
| Test | **Vitest** (unit), Playwright/Selenium (opsional, manual) |
| Deploy | **Cloudflare Pages** |

Hasil build adalah file statis di folder `dist/`.

---

## Menjalankan

Butuh Node.js ≥ 22.19 dan npm ≥ 10.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # hasil di dist/
npm run preview
npm test
```

`npm run dev` memakai `scripts/dev.mjs` agar Astro tetap foreground di WSL/Windows mount.

Kalau pindah antara Windows dan WSL/Linux, jangan pakai `node_modules` yang sama. Jalankan `npm ci` di sistem operasi yang dipakai.

---

## Deploy

Proyek terhubung ke Cloudflare Pages lewat Git. Pengaturan yang dipakai:

- **Build command:** `npm run build`
- **Build output:** `dist`
- **Deploy command:** kosongkan (biarkan Cloudflare yang deploy otomatis)

`wrangler.toml` sudah memakai nama project `my-portofolio` agar sesuai dengan dashboard Cloudflare.

---

## Catatan

- Metrik 84% pada Deep Research adalah angka owner-reported dari benchmark lokal, bukan hasil audit independen.
- Visual UMKM dan tabel Starlink adalah ilustrasi skematis, bukan screenshot klien asli.
- Tidak ada klien, testimoni, atau layanan AI palsu.
- Anomali dan MORO adalah narasi fiksi untuk keperluan portofolio.
- Tidak ada form kontak, backend, analytics, atau model bahasa langsung.

Lisensi font ada di `public/fonts/LICENSES.md`.
