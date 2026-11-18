# Catatan versi E-Tilang Dishub

Aturan rilis: tiap pembaruan sistem menaikkan versi di 4 tempat sekaligus: `js/versi.js`, `sw.js`, `backend/Config.gs` (APP.versi), dan berkas ini. `tools/uji-versi.js` memeriksa keempatnya sama.
Dampak: **frontend** = cukup push GitHub; **backend** = tempel berkas .gs lalu Deploy > New version; **keduanya** = kedua langkah.

## v1.2.3 - 2026-11-18 (keduanya)
- Versi aplikasi dan server tampil di menu Akun, beserta riwayat versi.
- Peringatan bila versi aplikasi dan server berbeda (tanda backend belum diperbarui).
- Berkas backend: Config.gs (APP.versi sebelumnya masih 1.0.0).

## v1.2.2 - 2026-11-18 (keduanya)
- Kolom `nama_singkat` di master jenis pelanggaran (46 pasal terisi; admin dapat mengubah).
- Daftar pilihan berformat "Ps.57(1)c ±15 m rambu larangan".
- Berkas backend: Config.gs, Kasus.gs, Admin.gs, MasterPerda.gs. Jalankan `perbaruiMasterPerda()` sebelum New version.

## v1.2.1 - 2026-11-18 (frontend)
- Label pilihan jenis pelanggaran diringkas; pasal di depan; uraian lengkap di kotak info.

## v1.2.0 - 2026-10-28 (keduanya)
- Warga memeriksa surat di website Bidang Angkutan (hasil memuat sanksi dikenakan); petugas masuk lewat website; QR surat ke website.
- Alamat E-Tilang dibuka langsung dialihkan ke website; aplikasi terpasang langsung ke halaman login; noindex.

## v1.1.x - tanggal tidak tercatat (keduanya)
- Pemasangan di layar utama HP (PWA), pilihan sanksi per kasus, master Perda 7/2022, reset data uji. Dirangkum; nomor dan tanggal tiap rilis antara tidak tercatat.

## v1.0.0 - tanggal tidak tercatat (keduanya)
- Rilis awal.
