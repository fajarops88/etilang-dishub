/* Catatan versi E-Tilang Dishub: SATU-SATUNYA tempat versi aplikasi ditulis untuk tampilan di layar.
 * Setiap rilis, ubah 4 tempat sekaligus (diperiksa tools/uji-versi.js):
 *   1) js/versi.js  (VERSI + entri baru paling atas di RIWAYAT)
 *   2) sw.js        (VERSI = 'etl-v<versi>')
 *   3) backend/Config.gs  (APP.versi)
 *   4) CHANGELOG.md (entri baru paling atas)
 * 'dampak': frontend = cukup push GitHub; backend = tempel .gs lalu New version; keduanya = kedua langkah. */
(function () {
  const E = (window.ETL = window.ETL || {});
  E.VERSI = '1.2.3';
  E.RIWAYAT = [
    { v: '1.2.3', tanggal: '2026-11-18', dampak: 'keduanya', judul: 'Catatan versi', perubahan: ['Versi aplikasi dan server tampil di menu Akun, beserta riwayat versi.', 'Peringatan bila versi aplikasi dan server berbeda (tanda backend belum diperbarui).'] },
    { v: '1.2.2', tanggal: '2026-11-18', dampak: 'keduanya', judul: 'Nama singkat jenis pelanggaran', perubahan: ['Kolom nama_singkat di master; dapat diubah admin (Master > Ubah).', 'Daftar pilihan memakai format "Ps.57(1)c ±15 m rambu larangan".'] },
    { v: '1.2.1', tanggal: '2026-11-18', dampak: 'frontend', judul: 'Label pilihan diringkas', perubahan: ['Pasal ditaruh di depan agar tidak terpotong di HP.', 'Uraian lengkap tampil di kotak info setelah memilih.'] },
    { v: '1.2.0', tanggal: '2026-10-28', dampak: 'keduanya', judul: 'Pintu masuk lewat website', perubahan: ['Warga memeriksa surat di website Bidang Angkutan; hasil memuat sanksi dikenakan.', 'Petugas masuk lewat tautan di website; QR surat mengarah ke website.', 'Alamat E-Tilang yang dibuka langsung dialihkan ke website; aplikasi terpasang langsung ke login.'] },
    { v: '1.1.x', tanggal: '', dampak: 'keduanya', judul: 'Rilis antara (dirangkum)', perubahan: ['Pemasangan di layar utama HP (PWA), pilihan sanksi per kasus, master Perda 7/2022, reset data uji.', 'Tanggal dan nomor tiap rilis antara tidak tercatat saat itu.'] },
    { v: '1.0.0', tanggal: '', dampak: 'keduanya', judul: 'Rilis awal', perubahan: ['Pencatatan pelanggaran, surat, cek status, dashboard, laporan, pengguna, dan log audit.'] }
  ];
})();
