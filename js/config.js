/* Satu-satunya berkas yang perlu Anda ubah sebelum deploy frontend.
 * API_URL = URL Web App Apps Script (berakhiran /exec). Bukan rahasia: hanya alamat API.
 * JANGAN menaruh token, API key, atau ID spreadsheet di sini. */
window.ETL_CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbwsyWXdzudchrpmsNv-LyKRY3xP_hdEkWk0-RLLKIN6L5mc2RaiEUm9kid3RVxj1IEI7A/exec',
  /* Alamat website Bidang Angkutan (tanpa garis miring di akhir). Cek status surat oleh warga ada di sana;
   * warga yang membuka alamat E-Tilang ini dialihkan ke sana. Kosongkan untuk mematikan pengalihan. */
  WEBSITE_URL: 'https://bid-angkutan-bpp.vercel.app',
  NAMA_APP: 'E-Tilang Dishub',
  NAMA_INSTANSI: 'Dinas Perhubungan Kota Balikpapan'
};
