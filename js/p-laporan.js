/* p-laporan.js : W-08 Dashboard, W-09 Peta, W-11 Rekap, W-14 Log Audit. */
(function () {
  'use strict';
  const ETL = window.ETL, h = ETL.h;
  const PERIODE = [['bulan_ini', 'Bulan ini'], ['30hari', '30 hari terakhir'], ['90hari', '90 hari terakhir'], ['tahun_ini', 'Tahun ini'], ['semua', 'Semua waktu'], ['kustom', 'Rentang tanggal…']];

  /** Pemilih periode: mengembalikan {el, nilai()} */
  function pilihPeriode(awal, onUbah) {
    const sel = h('select', { class: 'select', 'aria-label': 'Periode', style: { minWidth: '170px' } }, PERIODE.map(([v, l]) => h('option', { value: v, selected: v === awal }, l)));
    const d1 = h('input', { class: 'input', type: 'date', 'aria-label': 'Dari', style: { display: 'none' } }), d2 = h('input', { class: 'input', type: 'date', 'aria-label': 'Sampai', style: { display: 'none' } });
    const ubah = () => { const k = sel.value === 'kustom'; d1.style.display = d2.style.display = k ? '' : 'none'; if (!k || (d1.value && d2.value)) onUbah(); };
    [sel, d1, d2].forEach((x) => x.addEventListener('change', ubah));
    return { el: h('div', { class: 'flex gap-2 flex-wrap' }, sel, d1, d2), nilai: () => ({ periode: sel.value, dari: d1.value, sampai: d2.value }) };
  }
  ETL.pilihPeriode = pilihPeriode;
  const judulHalaman = (t, s, ...kanan) => h('div', { class: 'flex items-end justify-between gap-3 flex-wrap mb-3' }, h('div', null, h('h1', { class: 'text-headline-lg-mobile md:text-headline-lg text-primary' }, t), h('p', { class: 'text-body-md text-on-surface-variant' }, s)), h('div', { class: 'flex gap-2 flex-wrap items-center' }, ...kanan));

  // ═════════════ W-08 Dashboard ═════════════
  ETL.rute('/dashboard', { layout: 'app', nav: 'dashboard', judul: 'Dashboard', render: async ({ el }) => {
    const p = ETL.sesi.profil(), isi = h('div', { class: 'grid gap-4' }, ETL.skeleton(2, 120)), diperbarui = h('span', { class: 'text-body-sm text-on-surface-variant' });
    let paksa = false;
    const per = pilihPeriode('tahun_ini', () => muat());
    const segar = h('button', { class: 'btn btn-sekunder btn-kecil', onclick: () => { paksa = true; muat(); } }, ETL.ikon('segar', 16), 'Segarkan');
    el.appendChild(h('div', null, judulHalaman(p.peran === 'Petugas' ? 'Dashboard saya' : 'Ringkasan eksekutif', 'Ringkasan penindakan pelanggaran ' + (p.peran === 'Petugas' ? '(hanya kasus Anda)' : 'seluruh petugas') + '.', per.el, segar), isi, h('div', { class: 'mt-2' }, diperbarui)));
    async function muat() {
      const f = { filter: per.nilai() };
      const tampil = (d, lama) => { gambar(d); diperbarui.textContent = 'Diperbarui ' + ETL.waktu(d.diperbarui) + (lama ? ' • menyegarkan…' : ''); };
      try { if (paksa) { const d = await ETL.api('dashboard', Object.assign({ segarkan: true }, f)); paksa = false; tampil(d, false); ETL.toast('Dashboard disegarkan.', 'ok'); } else await ETL.apiSwr('dashboard', f, tampil); }
      catch (e) { ETL.kosong(isi); isi.appendChild(h('div', { class: 'bahaya-kotak' }, e.pesan || 'Gagal memuat dashboard.')); }
    }
    function gambar(d) {
      ETL.kosong(isi); const k = d.kartu, proses = k.terbit + k.tindak_lanjut, persen = k.total ? Math.round((k.selesai / k.total) * 100) : 0;
      const kartu = (judul, nilai, sub, warna, ik) => { const a = h('div', { class: 'angka' }, '0'); const c = h('div', { class: 'kartu stat reveal', style: { '--sv': warna } }, h('div', { class: 'flex justify-between' }, h('div', { class: 'text-label-md text-on-surface-variant', style: { textTransform: 'uppercase', letterSpacing: '.06em' } }, judul), ETL.ikon(ik, 22, 'text-secondary')), a, h('div', { class: 'text-body-sm text-on-surface-variant mt-1' }, sub)); setTimeout(() => ETL.hitungNaik(a, nilai), 80); return c; };
      const bar = h('div', { style: { height: '8px', borderRadius: '8px', background: '#eceef2', overflow: 'hidden', marginTop: '.5rem' } }, h('div', { style: { height: '100%', width: '0%', background: '#2a9d4f', borderRadius: '8px', transition: 'width 1s cubic-bezier(.2,.7,.2,1)' } }));
      setTimeout(() => { bar.firstChild.style.width = persen + '%'; }, 200);
      const donatEl = h('div'), legenda = h('div', { class: 'grid gap-2 mt-3' }), trenEl = h('div');
      const selesaiKartu = kartu('Selesai', k.selesai, persen + '% dari total', 'rgba(42,157,79,.12)', 'centangLingkar'); selesaiKartu.appendChild(bar);
      isi.appendChild(h('div', { class: 'grid gap-3', style: { gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' } }, kartu('Total pelanggaran', k.total, 'dalam periode terpilih', 'rgba(30,39,97,.08)', 'palu'), kartu('Bulan ini', k.bulan_ini, 'kasus terbit bulan berjalan', 'rgba(85,91,142,.12)', 'kalender'), kartu('Dalam proses', proses, k.tindak_lanjut + ' tindak lanjut • ' + k.terbit + ' baru terbit', 'rgba(242,153,74,.18)', 'jam'), selesaiKartu));
      if (k.draft || k.batal) isi.appendChild(h('div', { class: 'flex gap-2 flex-wrap text-body-sm' }, k.draft ? h('span', { class: 'badge badge-draft' }, k.draft + ' draft') : null, k.batal ? h('span', { class: 'badge badge-batal' }, k.batal + ' dibatalkan') : null));
      isi.appendChild(h('div', { class: 'grid gap-3 lg:grid-cols-3' },
        h('section', { class: 'kartu reveal lg:col-span-2' }, h('h2', { class: 'text-headline-md text-primary' }, 'Tren penindakan bulanan'), h('p', { class: 'text-body-sm text-on-surface-variant mb-2' }, '12 bulan terakhir • ' + d.lingkup), trenEl),
        h('section', { class: 'kartu reveal' }, h('h2', { class: 'text-headline-md text-primary' }, 'Komposisi pelanggaran'), h('p', { class: 'text-body-sm text-on-surface-variant mb-2' }, 'Berdasarkan jenis, periode terpilih'), donatEl, legenda)));
      ETL.chart.garis(trenEl, d.tren.map((t) => ({ label: ETL.bulanLabel(t.bulan), nilai: t.n })), { label: 'Tren bulanan' });
      if (d.jenis.length) ETL.chart.donat(donatEl, d.jenis).forEach((l) => legenda.appendChild(h('div', { class: 'flex items-center gap-2 text-body-sm' }, h('i', { style: { width: '12px', height: '12px', borderRadius: '3px', background: l.warna, display: 'inline-block', flexShrink: 0 } }), h('span', { class: 'flex-1', style: { minWidth: 0 } }, l.nama), h('b', null, l.persen + '%'), h('span', { class: 'text-on-surface-variant' }, '(' + l.n + ')'))));
      else donatEl.appendChild(ETL.kosongState('grafik', 'Belum ada data', 'Tidak ada kasus pada periode ini.'));
      isi.appendChild(h('section', { class: 'kartu reveal', style: { padding: 0 } }, h('div', { class: 'flex items-center justify-between', style: { padding: '1rem 1rem .5rem' } }, h('h2', { class: 'text-headline-md text-primary' }, 'Penindakan terkini'), h('a', { href: '#/kasus', class: 'text-label-lg', style: { color: 'var(--primary-c)' } }, 'Lihat semua')),
        d.terbaru.length ? h('div', { class: 'tabel-wrap' }, h('table', { class: 'tabel' }, h('thead', null, h('tr', null, ['Waktu', 'Nopol', 'Jenis pelanggaran', 'Lokasi', 'Petugas', 'Status'].map((t) => h('th', null, t)))),
          h('tbody', null, d.terbaru.map((x) => h('tr', { class: 'klik', onclick: () => { location.hash = ETL.href('kasus', x.id); } }, h('td', null, ETL.waktu(x.waktu)), h('td', null, ETL.plat(x.nopol)), h('td', null, x.nama_jenis), h('td', null, x.lokasi || '–'), h('td', null, x.nama_petugas || '–'), h('td', null, ETL.lencana(x.status))))))) : ETL.kosongState('daftar', 'Belum ada kasus', 'Kasus terbit akan tampil di sini.')));
      ETL.munculSaatTergulir(isi);
    }
    muat();
  } });

  // ═════════════ W-09 Peta ═════════════
  ETL.rute('/peta', { layout: 'app', nav: 'peta', judul: 'Peta Sebaran', render: async ({ el }) => {
    const petaEl = h('div', { class: 'peta-besar', id: 'peta-sebaran' }), daftar = h('div', { class: 'grid gap-2' }), meta = h('div', { class: 'text-body-sm text-on-surface-variant' });
    const per = pilihPeriode('tahun_ini', () => muat());
    const selJ = h('select', { class: 'select', 'aria-label': 'Jenis' }, h('option', { value: '' }, 'Semua jenis')), selW = h('select', { class: 'select', 'aria-label': 'Wilayah' }, h('option', { value: '' }, 'Semua wilayah'));
    [selJ, selW].forEach((s) => s.addEventListener('change', () => muat()));
    ETL.apiSwr('master.jenis', {}, (m) => { ETL.kosong(selJ); selJ.appendChild(h('option', { value: '' }, 'Semua jenis')); m.jenis.forEach((j) => selJ.appendChild(h('option', { value: j.id }, j.uraian))); ETL.kosong(selW); selW.appendChild(h('option', { value: '' }, 'Semua wilayah')); m.wilayah.forEach((w) => selW.appendChild(h('option', { value: w }, w))); }).catch(() => {});
    el.appendChild(h('div', null, judulHalaman('Peta sebaran titik rawan', 'Pin berukuran sesuai kepadatan kasus.', per.el, selJ, selW), h('div', { class: 'grid gap-4 lg:grid-cols-3' }, h('div', { class: 'lg:col-span-2 kartu', style: { padding: '.5rem' } }, petaEl), h('section', { class: 'kartu' }, h('h2', { class: 'text-headline-md text-primary mb-2' }, 'Lokasi rawan teratas'), meta, h('div', { class: 'mt-2' }, daftar)))));
    let peta, lapis;
    await new Promise((r) => setTimeout(r, 50));
    try { L.Icon.Default.prototype.options.imagePath = 'vendor/images/'; peta = L.map(petaEl).setView([-1.2654, 116.8312], 12); L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(peta); lapis = L.layerGroup().addTo(peta); setTimeout(() => peta.invalidateSize(), 250); }
    catch (e) { petaEl.appendChild(h('div', { class: 'p-4' }, 'Peta tidak dapat dimuat.')); }
    async function muat() {
      ETL.kosong(daftar); daftar.appendChild(ETL.skeleton(3, 40));
      try {
        const d = await ETL.api('peta', { filter: Object.assign(per.nilai(), { id_jenis: selJ.value, wilayah: selW.value }) });
        ETL.kosong(daftar); if (lapis) lapis.clearLayers();
        const maks = Math.max(1, ...d.titik.map((t) => t.n)), batas = [];
        d.titik.forEach((t) => {
          const r = 7 + Math.sqrt(t.n / maks) * 22, c = L.circleMarker([t.lat, t.lng], { radius: r, color: '#06104c', weight: 2, fillColor: '#f2994a', fillOpacity: 0.7 });
          const pop = h('div', null, h('b', null, t.lokasi), h('div', null, t.n + ' kasus'), t.wilayah ? h('div', null, t.wilayah) : null); c.bindPopup(pop); if (lapis) c.addTo(lapis); batas.push([t.lat, t.lng]);
        });
        if (peta && batas.length) peta.fitBounds(batas, { padding: [30, 30], maxZoom: 15 });
        meta.textContent = d.titik.length + ' titik berkoordinat • diperbarui ' + ETL.waktu(d.diperbarui);
        if (!d.top_lokasi.length) daftar.appendChild(ETL.kosongState('peta', 'Belum ada data lokasi', 'Tidak ada kasus pada filter ini.'));
        const top = d.top_lokasi[0] ? d.top_lokasi[0].n : 1;
        d.top_lokasi.forEach((x, i) => { const b = h('div', { class: 'batang-isi', style: { width: '0%' } }); daftar.appendChild(h('div', null, h('div', { class: 'flex justify-between text-body-sm' }, h('span', { class: 'font-semibold' }, (i + 1) + '. ' + x.lokasi), h('b', null, x.n)), h('div', { class: 'batang-lajur', style: { marginTop: '4px' } }, b))); setTimeout(() => { b.style.width = (x.n / top) * 100 + '%'; }, 100 + i * 60); });
      } catch (e) { ETL.kosong(daftar); daftar.appendChild(h('div', { class: 'bahaya-kotak' }, e.pesan || 'Gagal memuat peta.')); }
    }
    muat();
  } });

  // ═════════════ W-11 Rekap ═════════════
  ETL.rute('/rekap', { layout: 'app', nav: 'rekap', judul: 'Rekap Laporan', peran: ['Pimpinan', 'Admin'], render: async ({ el }) => {
    const hasil = h('div', { class: 'mt-4' }), per = pilihPeriode('bulan_ini', () => {});
    const selJ = h('select', { class: 'select', 'aria-label': 'Jenis' }, h('option', { value: '' }, 'Semua jenis')), selW = h('select', { class: 'select', 'aria-label': 'Wilayah' }, h('option', { value: '' }, 'Semua wilayah'));
    ETL.apiSwr('master.jenis', {}, (m) => { ETL.kosong(selJ); selJ.appendChild(h('option', { value: '' }, 'Semua jenis')); m.jenis.forEach((j) => selJ.appendChild(h('option', { value: j.id }, j.uraian))); ETL.kosong(selW); selW.appendChild(h('option', { value: '' }, 'Semua wilayah')); m.wilayah.forEach((w) => selW.appendChild(h('option', { value: w }, w))); }).catch(() => {});
    let data = null;
    const btn = h('button', { class: 'btn btn-primer', onclick: async () => { ETL.tombolMuat(btn, true, 'Menyusun…'); try { data = await ETL.api('rekap', { filter: Object.assign(per.nilai(), { id_jenis: selJ.value, wilayah: selW.value }), segarkan: true }); gambar(data); } catch (e) { ETL.toast(e.pesan || 'Gagal.', 'galat'); } ETL.tombolMuat(btn, false, ' Tampilkan rekap'); btn.prepend(ETL.ikon('grafik', 18)); } }, ETL.ikon('grafik', 18), 'Tampilkan rekap');
    el.appendChild(h('div', null, judulHalaman('Rekap laporan penindakan', 'Rekap bulanan/tahunan per jenis, lokasi, dan petugas. Siap cetak.'), h('div', { class: 'kartu tanpa-cetak flex gap-2 flex-wrap items-center' }, per.el, selJ, selW, btn), hasil));
    const tabel = (judul, baris, kolom1) => h('section', { class: 'kartu reveal mt-3', style: { breakInside: 'avoid' } }, h('h3', { class: 'text-headline-sm text-primary mb-2' }, judul), baris.length ? h('table', { class: 'tabel' }, h('thead', null, h('tr', null, h('th', null, kolom1), h('th', { style: { textAlign: 'right' } }, 'Jumlah'))), h('tbody', null, baris.map((b) => h('tr', null, h('td', null, b.nama), h('td', { style: { textAlign: 'right', fontWeight: 700 } }, ETL.angka(b.n)))))) : h('div', { class: 'text-body-sm text-on-surface-variant' }, 'Tidak ada data.'));
    function gambar(d) {
      ETL.kosong(hasil); const p = ETL.sesi.profil();
      hasil.appendChild(h('div', { class: 'area-cetak' },
        h('div', { class: 'kartu' }, h('div', { class: 'flex justify-between gap-3 flex-wrap' }, h('div', null, h('div', { class: 'bagian-nomor' }, 'Rekap penindakan'), h('h2', { class: 'text-headline-md text-primary' }, ETL_CONFIG.NAMA_INSTANSI), h('div', { class: 'text-body-md' }, 'Periode ' + ETL.tgl(d.periode.dari) + ' – ' + ETL.tgl(d.periode.sampai))),
          h('div', { class: 'text-right' }, h('div', { class: 'angka', style: { fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' } }, ETL.angka(d.total)), h('div', { class: 'text-body-sm text-on-surface-variant' }, 'kasus (tidak termasuk draft & batal)'))),
          h('div', { class: 'flex gap-2 flex-wrap mt-2' }, Object.keys(d.per_status).map((s) => h('span', { class: 'badge badge-' + ({ Terbit: 'terbit', 'Tindak Lanjut': 'tl', Selesai: 'selesai', Dibatalkan: 'batal' }[s] || 'draft') }, s + ': ' + d.per_status[s])))),
        h('div', { class: 'grid gap-0 md:grid-cols-2 md:gap-3' }, tabel('Per bulan', d.per_bulan.map((b) => ({ nama: ETL.bulanLabel(b.nama), n: b.n })), 'Bulan'), tabel('Per jenis pelanggaran', d.per_jenis, 'Jenis'), tabel('Per lokasi (20 teratas)', d.per_lokasi, 'Lokasi'), tabel('Per petugas', d.per_petugas, 'Petugas'), tabel('Per wilayah', d.per_wilayah, 'Wilayah')),
        h('p', { class: 'text-body-sm text-on-surface-variant mt-3' }, 'Dicetak oleh ' + p.nama + ' • ' + ETL.waktu(d.dibuat))),
        h('div', { class: 'flex gap-2 flex-wrap mt-3 tanpa-cetak' }, h('button', { class: 'btn btn-utama', onclick: () => window.print() }, ETL.ikon('cetak', 18), 'Cetak / simpan PDF'), h('button', { class: 'btn btn-sekunder', onclick: () => { const rows = []; [['Bulan', d.per_bulan], ['Jenis', d.per_jenis], ['Lokasi', d.per_lokasi], ['Petugas', d.per_petugas], ['Wilayah', d.per_wilayah]].forEach(([k, arr]) => arr.forEach((b) => rows.push([k, b.nama, b.n]))); ETL.unduhCsv('rekap-' + d.periode.dari + '_' + d.periode.sampai + '.csv', ['Kelompok', 'Nama', 'Jumlah'], rows); } }, ETL.ikon('unduh', 18), 'Ekspor CSV')));
      ETL.munculSaatTergulir(hasil);
    }
  } });

  // ═════════════ W-14 Log audit ═════════════
  const AKSI_LOG = ['', 'LOGIN', 'LOGOUT', 'GANTI_PIN', 'RESET_PIN', 'BUAT_DRAFT', 'UBAH_DRAFT', 'FOTO', 'TERBIT', 'TINDAK_LANJUT', 'KOREKSI', 'BATAL', 'TAMBAH_PENGGUNA', 'UBAH_PENGGUNA', 'UBAH_PENGATURAN', 'SIMPAN_RAHASIA', 'EKSPOR', 'DITOLAK', 'BLAST', 'IMPOR_RUN'];
  ETL.rute('/log', { layout: 'app', nav: 'log', judul: 'Log Audit', peran: ['Pimpinan', 'Admin'], render: async ({ el }) => {
    const st = { hal: 1 }, isi = h('div', { class: 'mt-3' }), nav = h('div', { class: 'halaman-nav' });
    const q = h('input', { class: 'input', placeholder: 'Cari pengguna / objek / keterangan…', 'aria-label': 'Cari log' }), aksi = h('select', { class: 'select', 'aria-label': 'Aksi', style: { maxWidth: '230px' } }, AKSI_LOG.map((a) => h('option', { value: a }, a || 'Semua aksi')));
    const muat = async () => {
      ETL.kosong(isi); isi.appendChild(ETL.skeleton(5, 44));
      try {
        const d = await ETL.api('log.list', { q: q.value, aksi: aksi.value, halaman: st.hal, per_halaman: 25 }); ETL.kosong(isi);
        isi.appendChild(d.items.length ? h('div', { class: 'tabel-wrap kartu', style: { padding: 0 } }, h('table', { class: 'tabel' }, h('thead', null, h('tr', null, ['Waktu', 'Pengguna', 'Aksi', 'Objek', 'Perubahan'].map((t) => h('th', null, t)))),
          h('tbody', null, d.items.map((x) => h('tr', null, h('td', { style: { whiteSpace: 'nowrap' } }, ETL.waktu(x.waktu)), h('td', null, h('div', { class: 'font-semibold' }, x.username || 'sistem'), h('div', { class: 'text-body-sm text-on-surface-variant' }, x.peran)), h('td', null, h('span', { class: 'badge badge-peran' }, x.aksi)), h('td', { class: 'mono', style: { fontSize: '.78rem' } }, x.objek),
            h('td', { style: { maxWidth: '320px' } }, x.ket ? h('div', { class: 'text-body-sm' }, x.ket) : null, x.lama || x.baru ? h('details', null, h('summary', { class: 'text-body-sm cursor-pointer', style: { color: 'var(--primary-c)' } }, 'Lihat nilai'), h('div', { class: 'mono', style: { fontSize: '.72rem', wordBreak: 'break-all' } }, x.lama ? 'lama: ' + x.lama : '', x.lama && x.baru ? h('br') : null, x.baru ? 'baru: ' + x.baru : '')) : null)))))) : ETL.kosongState('riwayat', 'Tidak ada entri'));
        ETL.kosong(nav); const maks = Math.max(1, Math.ceil(d.total / d.per_halaman));
        nav.append(h('span', null, d.total + ' entri • ' + d.catatan), h('div', { class: 'flex items-center gap-2' }, h('button', { class: 'btn btn-sekunder btn-kecil', disabled: st.hal <= 1, onclick: () => { st.hal--; muat(); } }, ETL.ikon('kiri', 16)), h('span', null, st.hal + ' / ' + maks), h('button', { class: 'btn btn-sekunder btn-kecil', disabled: st.hal >= maks, onclick: () => { st.hal++; muat(); } }, ETL.ikon('kanan', 16))));
      } catch (e) { ETL.kosong(isi); isi.appendChild(h('div', { class: 'bahaya-kotak' }, e.pesan || 'Gagal.')); }
    };
    q.addEventListener('input', ETL.debounce(() => { st.hal = 1; muat(); }, 400)); aksi.addEventListener('change', () => { st.hal = 1; muat(); });
    el.appendChild(h('div', null, judulHalaman('Log audit sistem', 'Jejak siapa, kapan, dan apa. Hanya bisa dibaca; tidak dapat diubah dari aplikasi.'), h('div', { class: 'kartu flex gap-2 flex-wrap' }, h('div', { style: { flex: 1, minWidth: '220px' } }, q), aksi), isi, nav));
    muat();
  } });
})();
