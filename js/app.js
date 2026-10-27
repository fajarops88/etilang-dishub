/* app.js : router hash, shell aplikasi (sidebar/topbar/bottom-nav), tombol WA mengambang, boot. */
(function () {
  'use strict';
  const ETL = window.ETL, h = ETL.h;
  const RUTE = [];
  const SEMUA = ['Petugas', 'Pimpinan', 'Admin'];

  ETL.rute = function (pola, opsi) {
    const nama = [];
    const re = new RegExp('^' + pola.replace(/:([a-z]+)/g, (m, n) => { nama.push(n); return '([^/]+)'; }) + '$');
    RUTE.push(Object.assign({ re, nama, peran: SEMUA }, opsi));
  };
  const beranda = () => { const p = ETL.sesi.profil(); return p && p.peran === 'Petugas' ? '#/beranda' : '#/dashboard'; };
  ETL.beranda = beranda;
  ETL.pergi = (hash) => { if (location.hash === hash) ETL.rutekan(); else location.hash = hash; };
  ETL.href = (...bagian) => '#/' + bagian.map((b) => encodeURIComponent(b)).join('/');

  function urai() {
    const raw = (location.hash || '').replace(/^#/, '') || '/', [jalur, qs] = raw.split('?');
    const query = {}; (qs || '').split('&').filter(Boolean).forEach((p) => { const [k, v] = p.split('='); query[decodeURIComponent(k)] = decodeURIComponent((v || '').replace(/\+/g, ' ')); });
    return { jalur: '/' + jalur.split('/').filter(Boolean).join('/'), query };
  }

  // ───────── NAV ─────────
  const NAV = [
    { id: 'beranda', label: 'Beranda', ikon: 'beranda', href: '#/beranda', peran: ['Petugas'] },
    { id: 'catat', label: 'Catat Pelanggaran', ikon: 'berkasTambah', href: '#/catat', peran: ['Petugas', 'Admin'] },
    { id: 'dashboard', label: 'Dashboard', ikon: 'dashboard', href: '#/dashboard', peran: SEMUA },
    { id: 'peta', label: 'Peta Sebaran', ikon: 'peta', href: '#/peta', peran: SEMUA },
    { id: 'kasus', label: 'Daftar Kasus', ikon: 'daftar', href: '#/kasus', peran: SEMUA },
    { id: 'tindak', label: 'Tindak Lanjut', ikon: 'palu', href: '#/tindak', peran: ['Pimpinan', 'Admin'] },
    { id: 'rekap', label: 'Rekap Laporan', ikon: 'grafik', href: '#/rekap', peran: ['Pimpinan', 'Admin'] },
    { id: 'pengguna', label: 'Pengguna', ikon: 'grup', href: '#/pengguna', peran: ['Admin'] },
    { id: 'master', label: 'Master & Pengaturan', ikon: 'gigi', href: '#/master', peran: ['Admin'] },
    { id: 'wa', label: 'Notifikasi WA', ikon: 'wa', href: '#/wa', peran: ['Admin'] },
    { id: 'crm', label: 'CRM Kontak', ikon: 'kontak', href: '#/crm', peran: ['Admin'] },
    { id: 'log', label: 'Log Audit', ikon: 'riwayat', href: '#/log', peran: ['Pimpinan', 'Admin'] }
  ];

  let shell = null;
  function logo(ukuran) {
    return h('div', { class: 'logo-app', style: { width: ukuran + 'px', height: ukuran + 'px', borderRadius: '10px', background: '#fff', color: '#1e2761', display: 'grid', placeItems: 'center', flexShrink: 0 } }, ETL.ikon('perisai', ukuran * 0.62));
  }
  ETL.logo = logo;

  /** Kartu "Pasang di layar utama" + tombol muat ulang bila ada versi baru. null bila tidak relevan. */
  function kartuPasang() {
    const P = ETL.pwa; if (!P) return null;
    const baru = P.versiBaru ? h('button', { class: 'btn btn-sekunder btn-kecil mt-2', onclick: () => P.muatUlang() }, 'Muat ulang ke versi baru') : null;
    const st = P.status(); let isi;
    if (st === 'terpasang') isi = h('div', { class: 'text-body-sm' }, 'Aplikasi sudah terpasang di perangkat ini.');
    else if (st === 'bisa') isi = [h('div', { class: 'text-body-sm' }, 'Pasang aplikasi di layar utama agar terbuka seperti aplikasi biasa.'), h('button', { class: 'btn btn-primer btn-kecil mt-2', onclick: async () => { await P.pasang(); } }, 'Pasang di layar utama')];
    else if (st === 'ios') isi = h('div', { class: 'text-body-sm' }, 'Untuk memasang: buka di Safari, ketuk tombol Bagikan, lalu pilih "Tambah ke Layar Utama".');
    else isi = h('div', { class: 'text-body-sm' }, 'Untuk memasang: buka menu peramban (tiga titik), lalu pilih "Pasang aplikasi" atau "Tambahkan ke layar utama". Pastikan memakai Chrome.');
    return h('div', { class: 'kartu', style: { boxShadow: 'none', background: 'var(--surface-low)' } }, h('div', { class: 'font-semibold text-primary mb-1' }, 'Aplikasi di layar utama'), isi, baru);
  }
  function akunModal() {
    const p = ETL.sesi.profil();
    ETL.modal({ judul: 'Akun saya', isi: [
      h('div', { class: 'flex items-center gap-3' }, h('div', { class: 'avatar', style: { width: '48px', height: '48px', fontSize: '1rem' } }, ETL.inisial(p.nama)),
        h('div', null, h('div', { class: 'text-headline-sm text-primary' }, p.nama), h('div', { class: 'text-body-sm text-on-surface-variant' }, [p.jabatan, p.nip && 'NIP ' + p.nip].filter(Boolean).join(' • ')),
          h('span', { class: 'badge badge-peran mt-1' }, p.peran === 'Admin' ? 'Admin Sistem' : p.peran === 'Pimpinan' ? 'Pimpinan' : 'Petugas Lapangan'))),
      h('div', { class: 'info-kotak' }, 'Sesi berlaku maksimal 6 jam. Jangan membagikan PIN Anda kepada siapa pun.'),
      kartuPasang()
    ].filter(Boolean), tombol: [
      { teks: 'Ganti PIN', kelas: 'btn-sekunder', onClick: () => { location.hash = '#/ganti-pin'; } },
      { teks: 'Keluar', kelas: 'btn-bahaya', onClick: async () => { await keluar(); } }
    ] });
  }
  async function keluar() {
    try { await ETL.api('auth.logout', {}, { ulang: false, timeout: 8000 }); } catch (e) {}
    ETL.sesi.hapus(); shell = null; location.hash = '#/login'; ETL.toast('Anda telah keluar.', 'ok');
  }
  ETL.keluar = keluar;

  function pasangShell() {
    const p = ETL.sesi.profil(), menu = NAV.filter((n) => n.peran.indexOf(p.peran) >= 0);
    const sbGelap = h('div', { class: 'sidebar-gelap', style: { display: 'none' } });
    const sb = h('aside', { class: 'sidebar', 'aria-label': 'Navigasi utama' },
      h('div', { class: 'flex items-center gap-3 px-4', style: { height: '64px', borderBottom: '1px solid rgba(255,255,255,.1)' } }, logo(36),
        h('div', null, h('div', { class: 'font-bold', style: { lineHeight: 1.1 } }, ETL_CONFIG.NAMA_APP), h('div', { style: { fontSize: '.72rem', color: '#bbc3ff' } }, 'Kota Balikpapan'))),
      h('div', { style: { padding: '.9rem 1.2rem .4rem', fontSize: '.68rem', letterSpacing: '.12em', fontWeight: 700, color: '#8790d0' } }, 'NAVIGASI'),
      h('nav', { class: 'flex-1 overflow-auto', id: 'nav-utama' }, menu.map((n) => h('a', { class: 'nav-item', href: n.href, dataset: { id: n.id }, onclick: tutupMenu }, ETL.ikon(n.ikon, 20), n.label))),
      h('button', { class: 'nav-item', style: { background: 'none', border: 0, cursor: 'pointer', textAlign: 'left', font: 'inherit', margin: '.5rem .6rem 1rem', fontWeight: 600 }, onclick: keluar }, ETL.ikon('keluar', 20), 'Keluar sistem'));
    const buka = () => { sb.classList.add('buka'); sbGelap.style.display = 'block'; };
    function tutupMenu() { sb.classList.remove('buka'); sbGelap.style.display = 'none'; }
    sbGelap.addEventListener('click', tutupMenu);
    const judul = h('div', { class: 'font-semibold truncate', id: 'judul-halaman', style: { flex: 1 } }, '');
    const top = h('header', { class: 'topbar' },
      h('button', { class: 'ikon-btn tombol-menu', 'aria-label': 'Buka menu', onclick: buka }, ETL.ikon('menu', 24)),
      h('div', { class: 'hidden sm:flex items-center gap-2 lg:hidden' }, logo(30)),
      judul,
      h('span', { class: 'badge', style: { background: '#555b8e', color: '#fff' } }, p.peran === 'Admin' ? 'Admin' : p.peran),
      h('button', { class: 'avatar', style: { border: 0, cursor: 'pointer' }, 'aria-label': 'Akun saya', onclick: akunModal }, ETL.inisial(p.nama)));
    const isi = h('main', { id: 'isi-halaman', class: 'app-konten' + (p.peran === 'Petugas' ? ' pad-bawah' : '') });
    const bawah = p.peran === 'Petugas' ? h('nav', { class: 'bottom-nav tanpa-cetak', 'aria-label': 'Navigasi bawah' },
      [['beranda', 'Beranda', 'beranda', '#/beranda'], ['catat', 'Catat', 'berkasTambah', '#/catat'], ['kasus', 'Kasus saya', 'daftar', '#/kasus']].map(([id, l, ik, href]) => h('a', { href, dataset: { id } }, ETL.ikon(ik, 24), l)),
      h('button', { onclick: akunModal }, ETL.ikon('akun', 24), 'Akun')) : null;
    const akar = document.getElementById('app'); ETL.kosong(akar);
    akar.appendChild(sbGelap); akar.appendChild(sb); akar.appendChild(h('div', { class: 'app-isi', style: { minHeight: '100vh' } }, top, isi)); if (bawah) akar.appendChild(bawah);
    shell = { isi, judul, sb };
  }
  function tandaiNav(id) {
    document.querySelectorAll('[data-id]').forEach((a) => a.classList.toggle('aktif', a.dataset.id === id));
  }
  ETL.judul = (t) => { if (shell) shell.judul.textContent = t; document.title = t + ' · ' + ETL_CONFIG.NAMA_APP; };

  // ───────── router ─────────
  let gen = 0;
  ETL.rutekan = async function () {
    const { jalur, query } = urai(), id = ++gen;
    let r = null, param = {};
    for (const x of RUTE) { const m = x.re.exec(jalur); if (m) { r = x; x.nama.forEach((n, i) => { param[n] = decodeURIComponent(m[i + 1]); }); break; } }
    const masuk = ETL.sesi.ada(), p = ETL.sesi.profil();
    if (jalur === '/') { location.replace(masuk ? beranda() : '#/cek'); return; }
    if (!r) { location.replace(masuk ? beranda() : '#/cek'); return; }
    if (!r.publik) {
      if (!masuk) { location.replace('#/login'); return; }
      if (p.wajib_ganti_pin && jalur !== '/ganti-pin') { location.replace('#/ganti-pin'); return; }
      if (r.peran.indexOf(p.peran) < 0) { ETL.toast('Anda tidak berhak membuka halaman itu.', 'galat'); location.replace(beranda()); return; }
    }
    window.scrollTo(0, 0);
    let wadah;
    if (r.layout === 'app') {
      if (!shell || !document.getElementById('isi-halaman')) pasangShell();
      wadah = shell.isi; tandaiNav(r.nav || '');
    } else { shell = null; wadah = document.getElementById('app'); }
    ETL.kosong(wadah);
    const hal = h('div', { class: 'halaman-masuk' }); wadah.appendChild(hal);
    ETL.judul(r.judul || ETL_CONFIG.NAMA_APP);
    try { await r.render({ el: hal, param, query, isAktif: () => id === gen }); }
    catch (e) { if (id !== gen) return; console.error(e); ETL.kosong(hal); hal.appendChild(h('div', { class: 'kartu bahaya-kotak' }, (e && e.pesan) || 'Terjadi kesalahan memuat halaman.')); }
    ETL.munculSaatTergulir(hal);
    if (ETL.waFloat) ETL.waFloat.pastikan();
  };

  // ───────── tombol WhatsApp mengambang ─────────
  const wa = { el: null, cfg: null };
  wa.perbarui = function (cfg) {
    if (cfg && Object.keys(cfg).length) wa.cfg = cfg;
    wa.cfg = wa.cfg || {};
    const nomor = String((wa.cfg || {}).wa_chat_nomor || '').replace(/\D/g, '');
    if (!nomor) { if (wa.el) wa.el.style.display = 'none'; return; }
    if (!wa.el) {
      wa.el = h('a', { class: 'wa-float tanpa-cetak', target: '_blank', rel: 'noopener noreferrer', 'aria-label': 'Chat WhatsApp dengan Dishub' },
        h('span', { class: 'wa-bulat' }, ETL.ikon('wa', 32)), h('span', { class: 'wa-label' }, 'Chat Dishub via WhatsApp'));
      document.body.appendChild(wa.el);
      setTimeout(() => { wa.el.classList.add('sapa'); setTimeout(() => wa.el.classList.remove('sapa'), 4500); }, 3200);
    }
    wa.el.style.display = '';
    wa.el.href = 'https://wa.me/' + nomor + '?text=' + encodeURIComponent((wa.cfg || {}).wa_chat_pesan || 'Halo Dishub Balikpapan');
  };
  wa.pastikan = function () { if (wa.cfg) wa.perbarui(); };
  ETL.waFloat = wa;

  ETL.onSesiBerakhir = (pesan) => { shell = null; ETL.toast(pesan || 'Sesi berakhir. Silakan masuk kembali.', 'galat'); location.hash = '#/login'; };
  ETL.onWajibGantiPin = () => { const p = ETL.sesi.profil(); if (p) p.wajib_ganti_pin = true; location.hash = '#/ganti-pin'; };

  ETL.mulai = async function () {
    window.addEventListener('hashchange', ETL.rutekan);
    try { const c = ETL.simpan.get('etl_cfg'); if (c) wa.perbarui(JSON.parse(c)); } catch (e) {}
    ETL.config().then((c) => wa.perbarui(c)); // sekaligus membangunkan server
    ETL.rutekan();
    if ('serviceWorker' in navigator && location.protocol === 'https:') { /* sengaja tanpa service worker: data penindakan tidak di-cache offline */ }
  };
})();
