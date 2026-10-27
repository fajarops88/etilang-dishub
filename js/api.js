/* api.js : klien REST ke Google Apps Script. POST text/plain (tanpa preflight CORS). */
(function () {
  'use strict';
  const ETL = window.ETL;
  const KUNCI = 'etl_sesi';
  let sesi = null;
  try { sesi = JSON.parse(ETL.simpan.get(KUNCI) || 'null'); } catch (e) { sesi = null; }

  const S = {
    ada: () => !!(sesi && sesi.token),
    profil: () => (sesi ? sesi.profil : null),
    token: () => (sesi ? sesi.token : ''),
    set(token, profil) { sesi = { token, profil }; ETL.simpan.set(KUNCI, JSON.stringify(sesi)); },
    hapus() { sesi = null; ETL.simpan.del(KUNCI); Object.keys(sessionStorage || {}).forEach((k) => { if (k.indexOf('etl_swr_') === 0) ETL.simpan.del(k); }); }
  };

  const BACA = /(list|detail|get|jenis|config|status|antrean|riwayat|dashboard|peta|rekap|ping|interaksi|cek|^auth\.me)$/;

  async function panggil(aksi, data, opt) {
    opt = opt || {};
    const url = (window.ETL_CONFIG || {}).API_URL;
    if (!url || /GANTI_DENGAN/.test(url)) throw { kode: 'KONFIG', pesan: 'API_URL belum diisi. Buka js/config.js dan isi dengan URL Web App Apps Script.' };
    const coba = opt.ulang === undefined ? BACA.test(aksi) : opt.ulang;
    for (let percobaan = 0; percobaan < (coba ? 2 : 1); percobaan++) {
      const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), opt.timeout || 50000);
      let json;
      try {
        const res = await fetch(url, { method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, signal: ctl.signal,
          body: JSON.stringify({ aksi, data: data || {}, token: opt.publik ? '' : S.token() }) });
        json = await res.json();
      } catch (e) {
        clearTimeout(to);
        if (percobaan + 1 < (coba ? 2 : 1)) { await new Promise((r) => setTimeout(r, 900)); continue; }
        throw { kode: 'JARINGAN', pesan: e && e.name === 'AbortError' ? 'Server terlalu lama menjawab. Periksa sinyal lalu coba lagi.' : 'Tidak dapat terhubung ke server. Periksa sinyal internet.' };
      }
      clearTimeout(to);
      if (json && json.ok) { json.data && typeof json.data === 'object' && Object.defineProperty(json.data, '_ms', { value: json.ms, enumerable: false }); return json.data; }
      const er = (json && json.error) || { kode: 'SERVER', pesan: 'Respons server tidak dikenali.' };
      if (er.kode === 'TOKEN' || er.kode === 'KEDALUWARSA') { const ada = S.ada(); S.hapus(); if (ada && ETL.onSesiBerakhir) ETL.onSesiBerakhir(er.pesan); }
      if (er.kode === 'GANTI_PIN' && ETL.onWajibGantiPin) ETL.onWajibGantiPin();
      throw er;
    }
  }

  /** Stale-while-revalidate: tampilkan data lama seketika, lalu segarkan. cb(data, dariCache). */
  async function swr(aksi, data, cb) {
    const k = 'etl_swr_' + aksi + '_' + JSON.stringify(data || {});
    let adaCache = false;
    try { const c = ETL.simpan.get(k); if (c) { cb(JSON.parse(c), true); adaCache = true; } } catch (e) {}
    try { const f = await panggil(aksi, data); ETL.simpan.set(k, JSON.stringify(f)); cb(f, false); return f; }
    catch (e) { if (!adaCache) throw e; ETL.toast('Menampilkan data tersimpan: ' + (e.pesan || 'server tidak terjangkau'), 'info'); }
  }
  async function batch(daftar) {
    const r = await panggil('batch', { panggilan: daftar.map(([aksi, data]) => ({ aksi, data })) });
    return r.map((x) => (x.ok ? x.data : { galat: x.error }));
  }

  ETL.api = panggil; ETL.apiSwr = swr; ETL.apiBatch = batch; ETL.sesi = S;

  // konfigurasi publik (cache memori + sessionStorage)
  let cfg = null;
  ETL.config = async function () {
    if (cfg) return cfg;
    try { const c = ETL.simpan.get('etl_cfg'); if (c) cfg = JSON.parse(c); } catch (e) {}
    ETL.api('publik.config', {}, { publik: true }).then((d) => { cfg = d; ETL.simpan.set('etl_cfg', JSON.stringify(d)); if (ETL.waFloat) ETL.waFloat.perbarui(d); }).catch(() => {});
    return cfg || {};
  };
})();
