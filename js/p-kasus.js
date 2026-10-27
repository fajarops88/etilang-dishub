/* p-kasus.js : W-07 Daftar Kasus, W-10 Tindak Lanjut, detail kasus, W-15 Pembatalan/Koreksi. */
(function () {
  'use strict';
  const ETL = window.ETL, h = ETL.h, medan = (...a) => ETL.medan(...a);
  const hariIni = () => { const d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };

  async function daftarKasus(el, o) {
    const p = ETL.sesi.profil(), panel = p.peran !== 'Petugas';
    const F = { status: o.awal || '', q: '', id_jenis: '', wilayah: '', dari: '', sampai: '', semua: false }, st = { hal: 1 };
    const hasil = h('div', { class: 'mt-3' }), nav = h('div', { class: 'halaman-nav' }), info = h('div', { class: 'text-body-sm text-on-surface-variant' });
    const cari = h('input', { class: 'input', placeholder: 'Cari nopol, nomor surat, atau ID…', 'aria-label': 'Cari kasus', style: { paddingLeft: '2.6rem' } });
    const chips = h('div', { class: 'flex gap-2 flex-wrap mt-3' });
    function gambarChips() {
      ETL.kosong(chips);
      (o.status || ['', 'Draft', 'Terbit', 'Tindak Lanjut', 'Selesai', 'Dibatalkan']).forEach((s) => chips.appendChild(h('button', { type: 'button', class: 'chip' + (F.status === s ? ' aktif' : ''), onclick: () => { F.status = s; st.hal = 1; gambarChips(); muat(); } }, s || 'Semua')));
    }
    let master = null;
    const filterLanjut = h('div', { class: 'grid gap-3 mt-3', style: { gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' } });
    if (panel) {
      const selJ = h('select', { class: 'select', 'aria-label': 'Jenis pelanggaran' }, h('option', { value: '' }, 'Semua jenis')), selW = h('select', { class: 'select', 'aria-label': 'Wilayah' }, h('option', { value: '' }, 'Semua wilayah'));
      const d1 = h('input', { class: 'input', type: 'date', 'aria-label': 'Dari tanggal' }), d2 = h('input', { class: 'input', type: 'date', 'aria-label': 'Sampai tanggal' });
      const cb = h('input', { type: 'checkbox' });
      ETL.apiSwr('master.jenis', {}, (m) => { master = m; ETL.kosong(selJ); selJ.appendChild(h('option', { value: '' }, 'Semua jenis')); m.jenis.forEach((j) => selJ.appendChild(h('option', { value: j.id, title: j.uraian }, ETL.labelJenis(j)))); ETL.kosong(selW); selW.appendChild(h('option', { value: '' }, 'Semua wilayah')); m.wilayah.forEach((w) => selW.appendChild(h('option', { value: w }, w))); }).catch(() => {});
      [[selJ, 'id_jenis'], [selW, 'wilayah'], [d1, 'dari'], [d2, 'sampai']].forEach(([n, k]) => n.addEventListener('change', () => { F[k] = n.value; st.hal = 1; muat(); }));
      cb.addEventListener('change', () => { F.semua = cb.checked; st.hal = 1; muat(); });
      filterLanjut.append(selJ, selW, d1, d2, h('label', { class: 'pilihan', style: { alignItems: 'center' } }, cb, h('span', { class: 'text-body-sm' }, 'Cari semua arsip')));
    }
    cari.addEventListener('input', ETL.debounce(() => { F.q = cari.value; st.hal = 1; muat(); }, 350));
    async function muat() {
      ETL.kosong(hasil); hasil.appendChild(ETL.skeleton(4, 72));
      try {
        const d = await ETL.api('pelanggaran.list', { filter: F, halaman: st.hal, per_halaman: 15 });
        ETL.kosong(hasil); info.textContent = d.total + ' kasus' + (d.catatan ? ' • ' + d.catatan : '');
        if (!d.items.length) { hasil.appendChild(ETL.kosongState('daftar', 'Tidak ada kasus', 'Ubah kata kunci atau filter pencarian.')); }
        else {
          hasil.appendChild(h('div', { class: 'hanya-mobile grid gap-2' }, d.items.map((k) => ETL.kartuKasus(k))));
          hasil.appendChild(h('div', { class: 'hanya-desktop tabel-wrap kartu', style: { padding: 0 } }, h('table', { class: 'tabel' },
            h('thead', null, h('tr', null, ['Waktu', 'Nopol', 'Jenis pelanggaran', 'Lokasi', 'Petugas', 'Status'].map((t) => h('th', null, t)))),
            h('tbody', null, d.items.map((k) => h('tr', { class: 'klik', tabindex: 0, onclick: () => { location.hash = ETL.href('kasus', k.id); }, onkeydown: (e) => { if (e.key === 'Enter') location.hash = ETL.href('kasus', k.id); } },
              h('td', null, h('div', { class: 'font-semibold' }, ETL.tgl(k.waktu)), h('div', { class: 'text-body-sm text-on-surface-variant' }, k.nomor_surat || k.id)), h('td', null, ETL.plat(k.nopol)), h('td', null, k.nama_jenis), h('td', null, k.lokasi || '–'), h('td', null, k.nama_petugas || '–'), h('td', null, ETL.lencana(k.status))))))));
        }
        ETL.kosong(nav); const maks = Math.max(1, Math.ceil(d.total / d.per_halaman));
        nav.append(info, h('div', { class: 'flex items-center gap-2' }, h('button', { class: 'btn btn-sekunder btn-kecil', disabled: st.hal <= 1, onclick: () => { st.hal--; muat(); } }, ETL.ikon('kiri', 16), 'Sebelumnya'), h('span', null, st.hal + ' / ' + maks), h('button', { class: 'btn btn-sekunder btn-kecil', disabled: st.hal >= maks, onclick: () => { st.hal++; muat(); } }, 'Berikutnya', ETL.ikon('kanan', 16))));
      } catch (e) { ETL.kosong(hasil); hasil.appendChild(h('div', { class: 'bahaya-kotak' }, e.pesan || 'Gagal memuat.')); }
    }
    const ekspor = panel ? h('button', { class: 'btn btn-sekunder btn-kecil', onclick: async () => { try { const d = await ETL.api('pelanggaran.export', { filter: Object.assign({}, F, { semua: true }) }); ETL.unduhCsv('kasus-' + hariIni() + '.csv', d.kolom, d.baris); ETL.toast(d.baris.length + ' baris diekspor' + (d.dibatasi ? ' (dibatasi 5.000)' : ''), 'ok'); } catch (e) { ETL.toast(e.pesan || 'Gagal ekspor', 'galat'); } } }, ETL.ikon('unduh', 16), 'Ekspor CSV') : null;
    el.appendChild(h('div', { class: 'grid gap-2' }, h('div', { class: 'flex items-end justify-between gap-2 flex-wrap' }, h('div', null, h('h1', { class: 'text-headline-lg-mobile text-primary' }, o.judul), h('p', { class: 'text-body-md text-on-surface-variant' }, o.sub)), h('div', { class: 'flex gap-2' }, ekspor, o.tombolBaru ? h('a', { href: '#/catat', class: 'btn btn-utama btn-kecil' }, ETL.ikon('tambah', 16), 'Catat baru') : null)),
      h('div', { class: 'kartu' }, h('div', { class: 'ikon-di-input' }, ETL.ikon('cari', 20), cari), chips, filterLanjut), hasil, nav));
    gambarChips(); muat();
  }
  ETL.rute('/kasus', { layout: 'app', nav: 'kasus', judul: 'Daftar Kasus', render: ({ el }) => daftarKasus(el, { judul: ETL.sesi.profil().peran === 'Petugas' ? 'Kasus saya' : 'Daftar kasus', sub: 'Cari, saring, dan buka detail kasus penindakan.', tombolBaru: true }) });
  ETL.rute('/tindak', { layout: 'app', nav: 'tindak', judul: 'Tindak Lanjut', peran: ['Pimpinan', 'Admin'], render: ({ el }) => daftarKasus(el, { judul: 'Tindak lanjut perkara', sub: ETL.sesi.profil().peran === 'Admin' ? 'Pilih kasus untuk mencatat teguran, panggilan, atau penyelesaian.' : 'Pantau linimasa tindak lanjut (baca saja).', awal: 'Terbit', status: ['Terbit', 'Tindak Lanjut', 'Selesai'] }) });

  // ═════════════ detail kasus ═════════════
  ETL.rute('/kasus/:id', { layout: 'app', nav: 'kasus', judul: 'Detail Kasus', render: async ({ el, param }) => {
    el.appendChild(ETL.skeleton(3, 140));
    let det; try { det = await ETL.api('pelanggaran.detail', { id: param.id }); } catch (e) { ETL.kosong(el); el.appendChild(h('div', { class: 'bahaya-kotak' }, e.pesan || 'Gagal memuat.')); return; }
    const k = det.kasus, p = ETL.sesi.profil(), admin = p.peran === 'Admin';
    ETL.kosong(el); const muatUlang = () => ETL.rutekan();
    const baris = (a, b) => h('div', { class: 'flex justify-between gap-4 py-2', style: { borderBottom: '1px solid #eceef2' } }, h('span', { class: 'text-body-sm text-on-surface-variant' }, a), h('span', { class: 'text-body-md font-semibold text-right', style: { wordBreak: 'break-word' } }, b || '–'));
    const fotoWadah = h('div', { class: 'grid grid-cols-2 gap-2 md:grid-cols-4' });
    const timeline = h('div', { class: 'garis-waktu' }, det.tindak.length ? det.tindak.map((t) => h('div', null, h('span', { class: 'titik' }), h('div', { class: 'flex items-center gap-2 flex-wrap' }, h('span', { class: 'badge badge-tl', style: { textTransform: 'capitalize' } }, t.tindakan), h('span', { class: 'text-body-sm text-on-surface-variant' }, ETL.tgl(t.tanggal, true))), h('div', { class: 'text-body-md mt-1' }, t.catatan || '–'), h('div', { class: 'text-body-sm text-on-surface-variant' }, 'oleh ' + (t.oleh || '–')))) : h('div', { class: 'text-body-md text-on-surface-variant' }, 'Belum ada tindak lanjut.'));
    const aksi = h('div', { class: 'flex gap-2 flex-wrap' });
    if (k.status === 'Draft') aksi.appendChild(h('a', { href: ETL.href('catat', k.id), class: 'btn btn-utama' }, ETL.ikon('pensil', 18), 'Lanjutkan draft'));
    else aksi.appendChild(h('a', { href: ETL.href('surat', k.id), class: 'btn btn-primer' }, ETL.ikon('kertas', 18), 'Lihat / cetak surat'));
    if (admin && ['Terbit', 'Tindak Lanjut'].includes(k.status)) aksi.appendChild(h('button', { class: 'btn btn-sekunder', onclick: () => modalKoreksi(k, muatUlang) }, ETL.ikon('pensil', 18), 'Koreksi data'));
    if (admin && k.status !== 'Dibatalkan') aksi.appendChild(h('button', { class: 'btn btn-bahaya', onclick: () => modalBatal(k, muatUlang) }, ETL.ikon('batal', 18), 'Batalkan'));
    let formTindak = null;
    if (admin && ['Terbit', 'Tindak Lanjut'].includes(k.status)) {
      const tin = h('select', { class: 'select', id: 'tl-tindakan' }, [['teguran', 'Teguran'], ['panggilan', 'Panggilan'], ['lainnya', 'Lainnya'], ['selesai', 'Selesai (tutup perkara)']].map(([v, l]) => h('option', { value: v }, l)));
      const tg = h('input', { class: 'input', id: 'tl-tgl', type: 'date', value: hariIni() }), cat = h('textarea', { class: 'textarea', id: 'tl-cat', maxlength: 400, placeholder: 'Catatan tindak lanjut' }), btn = h('button', { class: 'btn btn-primer', type: 'submit' }, 'Simpan tindak lanjut');
      formTindak = h('form', { class: 'kartu reveal', style: { display: 'grid', gap: '.8rem' }, onsubmit: async (e) => { e.preventDefault(); ETL.tombolMuat(btn, true, 'Menyimpan…'); try { await ETL.api('tindak.simpan', { id_pelanggaran: k.id, tindakan: tin.value, tanggal: tg.value, catatan: cat.value }, { ulang: false }); ETL.toast('Tindak lanjut dicatat.', 'ok'); muatUlang(); } catch (er) { ETL.toast(er.pesan || 'Gagal.', 'galat'); ETL.tombolMuat(btn, false, 'Simpan tindak lanjut'); } } },
        h('h2', { class: 'text-headline-md text-primary' }, 'Catat tindak lanjut'), h('div', { class: 'grid gap-3 md:grid-cols-2' }, medan('Tindakan', tin), medan('Tanggal', tg)), medan('Catatan', cat, null, { opsi: 'opsional' }), btn, h('div', { class: 'bantuan' }, 'Riwayat tidak dapat dihapus. Memilih "Selesai" menutup perkara.'));
    }
    el.appendChild(h('div', { class: 'grid gap-4', style: { maxWidth: '900px', margin: '0 auto' } },
      h('a', { href: '#/kasus', class: 'text-label-lg flex items-center gap-1', style: { color: 'var(--primary-c)' } }, ETL.ikon('kiri', 16), 'Kembali'),
      h('section', { class: 'kartu reveal' }, h('div', { class: 'flex items-start justify-between gap-3 flex-wrap' }, h('div', null, ETL.plat(k.nopol, 'plat-besar'), h('div', { class: 'text-body-sm text-on-surface-variant mt-2' }, k.nomor_surat || k.id)), ETL.lencana(k.status)),
        k.status === 'Dibatalkan' ? h('div', { class: 'bahaya-kotak mt-3' }, h('b', null, 'Dibatalkan: '), k.alasan_batal) : null, h('div', { class: 'mt-3' }, aksi)),
      h('section', { class: 'kartu reveal grid md:grid-cols-2 gap-x-6' }, h('div', null, h('div', { class: 'bagian-nomor' }, 'Pelanggaran'), baris('Jenis', k.nama_jenis), baris('Dasar', k.pasal_perda), baris('Sanksi dikenakan', String(k.sanksi_dikenakan || '').split('|').filter(Boolean).join('; ') || 'Sesuai Perda'), k.sanksi ? baris('Dasar sanksi', k.sanksi) : null, baris('Dicatat', ETL.waktu(k.waktu, true)), baris('Terbit', k.tgl_terbit ? ETL.waktu(k.tgl_terbit, true) : '–')),
        h('div', null, h('div', { class: 'bagian-nomor' }, 'Kendaraan & lokasi'), baris('Jenis kendaraan', k.jenis_kendaraan), baris('Merek / warna', k.merek_warna), baris('Pengemudi / pemilik', k.nama_pemilik), baris('Lokasi', [k.lokasi_teks, k.wilayah].filter(Boolean).join(', ')), baris('Petugas', k.petugas.nama + (k.petugas.nip ? ' (NIP ' + k.petugas.nip + ')' : '')), k.no_bukti_uji ? baris('Bukti uji', k.no_bukti_uji + (k.masa_berlaku_uji ? ' • s.d. ' + ETL.tgl(k.masa_berlaku_uji) : '')) : null)),
      k.uraian ? h('section', { class: 'kartu reveal' }, h('div', { class: 'bagian-nomor' }, 'Uraian'), h('p', { class: 'text-body-lg mt-1' }, k.uraian)) : null,
      h('section', { class: 'kartu reveal' }, h('div', { class: 'bagian-nomor' }, 'Foto bukti (' + k.jumlah_foto + ')'), h('div', { class: 'mt-2' }, fotoWadah)),
      h('section', { class: 'kartu reveal' }, h('div', { class: 'bagian-nomor mb-2' }, 'Linimasa tindak lanjut'), timeline), formTindak));
    ETL.munculSaatTergulir(el);
    (k.slot_foto || []).forEach(async (n) => {
      const slot = h('button', { class: 'slot-foto', type: 'button', style: { padding: 0, cursor: 'zoom-in' } }, h('span', { class: 'denyut' }, 'Memuat…')); fotoWadah.appendChild(slot);
      try { const f = await ETL.api('foto.get', { id: k.id, urutan: n }), src = 'data:' + f.mime + ';base64,' + f.data; ETL.kosong(slot); slot.classList.add('terisi'); slot.appendChild(h('img', { src, alt: 'Foto ' + n })); slot.appendChild(h('div', { class: 'label-slot' }, 'Foto ' + n)); slot.addEventListener('click', () => ETL.modal({ judul: 'Foto ' + n, lebar: 'lebar', isi: h('img', { src, alt: 'Foto ' + n, style: { width: '100%', borderRadius: '8px' } }) })); }
      catch (e) { ETL.kosong(slot); slot.textContent = 'Gagal'; }
    });
  } });

  // ═════════════ W-15 Pembatalan & koreksi ═════════════
  function modalBatal(k, selesai) {
    const alasan = h('textarea', { class: 'textarea', maxlength: 400, placeholder: 'Jelaskan alasan pembatalan (minimal 10 karakter)', id: 'alasan-batal' });
    const cacah = h('div', { class: 'bantuan' }, '0 / 400');
    alasan.addEventListener('input', () => { cacah.textContent = alasan.value.length + ' / 400'; });
    const cepat = ['Salah input data kendaraan', 'Surat diterbitkan ganda', 'Salah sasaran penindakan'].map((t) => h('button', { type: 'button', class: 'chip', onclick: () => { alasan.value = t; alasan.dispatchEvent(new Event('input')); } }, t));
    ETL.modal({ judul: 'Batalkan kasus', isi: [h('div', { class: 'bahaya-kotak' }, 'Pembatalan bersifat permanen dan tercatat di log audit. Surat ditandai DIBATALKAN dan nomor surat tidak dipakai ulang.'), h('div', { class: 'flex items-center gap-2' }, ETL.plat(k.nopol), h('span', { class: 'text-body-sm' }, k.nomor_surat || k.id)), h('div', { class: 'flex gap-2 flex-wrap' }, cepat), medan('Alasan pembatalan', alasan, cacah, { wajib: true })],
      tombol: [{ teks: 'Kembali', kelas: 'btn-sekunder' }, { teks: 'Batalkan kasus', kelas: 'btn-bahaya', onClick: async () => { if (alasan.value.trim().length < 10) { alasan.classList.add('salah'); ETL.toast('Alasan minimal 10 karakter.', 'galat'); return false; } try { await ETL.api('kasus.batal', { id: k.id, alasan: alasan.value }, { ulang: false }); ETL.toast('Kasus dibatalkan.', 'ok'); selesai(); } catch (e) { ETL.toast(e.pesan || 'Gagal.', 'galat'); return false; } } }] });
  }
  async function modalKoreksi(k, selesai) {
    let m; try { m = await ETL.apiSwr('master.jenis', {}, () => {}); } catch (e) { ETL.toast('Gagal memuat master.', 'galat'); return; }
    const labelJenis = ETL.labelJenis;
    const F = { nopol: h('input', { class: 'input', value: ETL.formatNopol(k.nopol) }), jenis_kendaraan: h('select', { class: 'select' }, m.jenis_kendaraan.map((j) => h('option', { value: j, selected: j === k.jenis_kendaraan }, j))),
      merek_warna: h('input', { class: 'input', value: k.merek_warna || '' }), nama_pemilik: h('input', { class: 'input', value: k.nama_pemilik || '' }), id_jenis: h('select', { class: 'select' }, m.jenis.map((j) => h('option', { value: j.id, selected: j.id === k.id_jenis, title: j.uraian }, labelJenis(j)))),
      lokasi_teks: h('input', { class: 'input', value: k.lokasi_teks || '' }), wilayah: h('select', { class: 'select' }, h('option', { value: '' }, '–'), m.wilayah.map((w) => h('option', { value: w, selected: w === k.wilayah }, w))), uraian: h('textarea', { class: 'textarea' }) };
    F.uraian.value = k.uraian || ''; const alasan = h('textarea', { class: 'textarea', placeholder: 'Alasan koreksi (minimal 10 karakter)', maxlength: 400 });
    const pilih = new Set(String(k.sanksi_dikenakan || '').split('|').filter(Boolean)), blokS = h('div', { class: 'grid gap-1' });
    const gambarS = () => {
      ETL.kosong(blokS); const j = m.jenis.find((x) => x.id === F.id_jenis.value), opsi = (j && j.opsi) || [];
      [...pilih].forEach((x) => { if (opsi.indexOf(x) < 0) pilih.delete(x); });
      opsi.forEach((o) => { const cb = h('input', { type: 'checkbox', checked: pilih.has(o) }); cb.addEventListener('change', () => { cb.checked ? pilih.add(o) : pilih.delete(o); }); blokS.appendChild(h('label', { class: 'pilihan' }, cb, h('span', null, o))); });
      if (!opsi.length) blokS.appendChild(h('div', { class: 'bantuan' }, 'Jenis ini tidak memiliki pilihan sanksi.'));
    };
    F.id_jenis.addEventListener('change', () => { pilih.clear(); gambarS(); }); gambarS();
    const awal = { nopol: k.nopol, jenis_kendaraan: k.jenis_kendaraan, merek_warna: k.merek_warna || '', nama_pemilik: k.nama_pemilik || '', id_jenis: k.id_jenis, lokasi_teks: k.lokasi_teks || '', wilayah: k.wilayah || '', uraian: k.uraian || '' };
    ETL.modal({ judul: 'Koreksi data kasus', lebar: 'lebar', isi: [h('div', { class: 'info-kotak' }, 'Perubahan dicatat di log audit beserta nilai lama dan baru. Hanya bidang yang berubah yang dikirim.'),
      h('div', { class: 'grid gap-3 md:grid-cols-2' }, medan('Nopol', F.nopol), medan('Jenis kendaraan', F.jenis_kendaraan), medan('Merek / warna', F.merek_warna), medan('Pengemudi / pemilik', F.nama_pemilik), medan('Jenis pelanggaran', F.id_jenis), medan('Wilayah', F.wilayah)), medan('Sanksi yang dikenakan', blokS), medan('Lokasi', F.lokasi_teks), medan('Uraian', F.uraian), medan('Alasan koreksi', alasan, null, { wajib: true })],
      tombol: [{ teks: 'Batal', kelas: 'btn-sekunder' }, { teks: 'Simpan koreksi', kelas: 'btn-primer', onClick: async () => {
        const perubahan = {}; Object.keys(F).forEach((c) => { const v = F[c].value, a = c === 'nopol' ? ETL.formatNopol(awal.nopol) : awal[c]; if (String(v) !== String(a)) perubahan[c] = v; });
        const sj = [...pilih].join('|'); if (sj !== String(k.sanksi_dikenakan || '')) perubahan.sanksi_dikenakan = sj;
        if (!Object.keys(perubahan).length) { ETL.toast('Tidak ada perubahan.', 'galat'); return false; }
        if (alasan.value.trim().length < 10) { alasan.classList.add('salah'); ETL.toast('Alasan minimal 10 karakter.', 'galat'); return false; }
        try { await ETL.api('kasus.koreksi', { id: k.id, perubahan, alasan: alasan.value }, { ulang: false }); ETL.toast('Koreksi tersimpan.', 'ok'); selesai(); } catch (e) { ETL.toast(e.pesan || 'Gagal.', 'galat'); return false; } } }] });
  }
})();
