/* p-petugas.js : W-04 Beranda, W-05 Form Pelanggaran, W-06 Surat. */
(function () {
  'use strict';
  const ETL = window.ETL, h = ETL.h, medan = (...a) => ETL.medan(...a);

  // ───────── panel riwayat nopol (dipakai beranda & form) ─────────
  async function cariRiwayat(nopolRaw, wadah) {
    ETL.kosong(wadah); wadah.appendChild(ETL.skeleton(2, 56));
    try {
      const d = await ETL.api('riwayat.nopol', { nopol: nopolRaw });
      ETL.kosong(wadah);
      wadah.appendChild(h('div', { class: 'kartu', style: { background: 'var(--surface-low)', boxShadow: 'none' } },
        h('div', { class: 'flex items-center justify-between gap-2 flex-wrap' }, ETL.plat(d.nopol), h('span', { class: d.jumlah ? 'text-label-md' : 'text-label-md text-on-surface-variant', style: { color: d.jumlah ? '#ba1a1a' : undefined } }, d.jumlah ? d.jumlah + ' riwayat tercatat' : 'Belum ada riwayat')),
        d.riwayat.map((r) => h('a', { class: 'kartu mt-2 block', style: { padding: '.65rem .8rem', textDecoration: 'none', color: 'inherit' }, href: ETL.href('kasus', r.id) },
          h('div', { class: 'flex items-center justify-between gap-2' }, h('span', { class: 'text-label-md text-on-surface-variant' }, ETL.waktu(r.waktu)), ETL.lencana(r.status)),
          h('div', { class: 'font-semibold text-primary', style: { fontSize: '.92rem' } }, r.nama_jenis), h('div', { class: 'flex items-center gap-1 text-body-sm text-on-surface-variant' }, ETL.ikon('pin', 14), r.lokasi || '–'))),
        h('div', { class: 'flex items-center gap-2 text-body-sm text-on-surface-variant mt-2' }, ETL.ikon('basisData', 16), d.catatan)));
      return d;
    } catch (e) { ETL.kosong(wadah); wadah.appendChild(h('div', { class: 'bahaya-kotak' }, e.pesan || 'Gagal memeriksa riwayat.')); }
  }
  ETL.cariRiwayat = cariRiwayat;

  // ═════════════ W-04 Beranda ═════════════
  ETL.rute('/beranda', { layout: 'app', nav: 'beranda', judul: 'Beranda', peran: ['Petugas'], render: async ({ el }) => {
    const p = ETL.sesi.profil();
    const inp = h('input', { class: 'input input-plat', id: 'cek-nopol', placeholder: 'KT 8421 LQ', autocapitalize: 'characters', maxlength: 12, style: { paddingRight: '6.5rem' } });
    const hasil = h('div', { class: 'mt-3' });
    const go = () => { if (inp.value.trim()) cariRiwayat(inp.value, hasil); };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
    const statWadah = h('div', { class: 'grid grid-cols-3 gap-2' }, [1, 2, 3].map(() => h('div', { class: 'skeleton', style: { height: '84px' } })));
    const terbaru = h('div', { class: 'grid gap-2' }, ETL.skeleton(3, 64));
    el.appendChild(h('div', { class: 'grid gap-4', style: { maxWidth: '640px', margin: '0 auto' } },
      h('section', { class: 'kartu reveal' }, h('div', { class: 'flex items-start justify-between gap-2' },
        h('div', { class: 'flex items-center gap-3 min-w-0' }, h('div', { class: 'avatar', style: { width: '48px', height: '48px', fontSize: '1rem' } }, ETL.inisial(p.nama)),
          h('div', { class: 'min-w-0' }, h('div', { class: 'text-headline-sm text-primary truncate' }, p.nama), h('div', { class: 'text-body-sm text-on-surface-variant truncate' }, [p.jabatan, p.nip && 'NIP ' + p.nip].filter(Boolean).join(' • ')))),
        h('span', { class: 'badge badge-ok' }, h('span', { class: 'denyut', style: { width: '8px', height: '8px', borderRadius: '50%', background: '#2a9d4f' } }), 'Bertugas')),
        h('div', { class: 'text-body-sm text-on-surface-variant mt-2', id: 'sapaan' }, 'Selamat bertugas. Waktu dan identitas Anda dicatat otomatis oleh server pada setiap kasus.')),
      h('a', { href: '#/catat', class: 'btn btn-utama btn-blok reveal', style: { minHeight: '60px', fontSize: '1.05rem' } }, ETL.ikon('berkasTambah', 26), 'Catat pelanggaran baru'),
      h('section', { class: 'kartu reveal' }, h('div', { class: 'flex items-center gap-2 text-primary mb-1' }, ETL.ikon('cari', 22), h('h2', { class: 'text-headline-sm' }, 'Cek riwayat nomor polisi')),
        h('p', { class: 'text-body-sm text-on-surface-variant mb-3' }, 'Hanya berdasarkan data E-Tilang Dishub — bukan status hukum kendaraan.'),
        h('div', { style: { position: 'relative' } }, inp, h('button', { class: 'btn btn-utama btn-kecil', style: { position: 'absolute', right: '.5rem', top: '.55rem' }, onclick: go }, 'Cek')), hasil),
      h('section', { class: 'reveal' }, statWadah),
      h('section', { class: 'reveal' }, h('div', { class: 'flex items-center justify-between mb-2' }, h('h2', { class: 'text-headline-sm text-primary' }, 'Kasus terbaru saya'), h('a', { href: '#/kasus', class: 'text-label-lg', style: { color: 'var(--primary-c)' } }, 'Lihat semua')), terbaru),
      h('div', { class: 'grid grid-cols-2 gap-2 reveal' },
        [['dashboard', 'Dashboard saya', '#/dashboard'], ['peta', 'Peta kasus saya', '#/peta']].map(([ik, t, href]) => h('a', { href, class: 'kartu kartu-klik flex items-center gap-2', style: { textDecoration: 'none', color: 'var(--primary-c)', fontWeight: 700 } }, ETL.ikon(ik, 22), t)))));
    ETL.munculSaatTergulir(el);
    ETL.apiSwr('dashboard', { filter: { periode: 'bulan_ini' } }, (d) => {
      ETL.kosong(statWadah);
      [['Bulan ini', d.kartu.bulan_ini], ['Dalam proses', d.kartu.terbit + d.kartu.tindak_lanjut], ['Draft', d.kartu.draft]].forEach(([l, n]) => {
        const a = h('div', { class: 'angka' }, '0'); statWadah.appendChild(h('div', { class: 'kartu stat', style: { padding: '.8rem' } }, h('div', { class: 'text-label-md text-on-surface-variant' }, l), a)); ETL.hitungNaik(a, n);
      });
      ETL.kosong(terbaru);
      if (!d.terbaru.length) terbaru.appendChild(ETL.kosongState('daftar', 'Belum ada kasus', 'Kasus yang Anda terbitkan akan tampil di sini.'));
      d.terbaru.slice(0, 4).forEach((k) => terbaru.appendChild(kartuKasus(k)));
    }).catch((e) => { ETL.kosong(statWadah); ETL.kosong(terbaru); terbaru.appendChild(h('div', { class: 'bahaya-kotak' }, e.pesan || 'Gagal memuat.')); });
  } });

  function kartuKasus(k) {
    return h('a', { href: ETL.href('kasus', k.id), class: 'kartu kartu-klik block', style: { textDecoration: 'none', color: 'inherit', padding: '.8rem' } },
      h('div', { class: 'flex items-center justify-between gap-2' }, ETL.plat(k.nopol), ETL.lencana(k.status)),
      h('div', { class: 'font-semibold text-primary mt-2', style: { fontSize: '.92rem' } }, k.nama_jenis),
      h('div', { class: 'flex items-start justify-between gap-3 flex-wrap text-body-sm text-on-surface-variant mt-1' }, h('span', { class: 'flex items-center gap-1', style: { minWidth: 0, flex: '1 1 14rem' } }, ETL.ikon('pin', 14), h('span', null, k.lokasi || '–')), h('span', { style: { whiteSpace: 'nowrap' } }, ETL.waktu(k.waktu))));
  }
  ETL.kartuKasus = kartuKasus;

  // ═════════════ kompresi foto ═════════════
  async function kompres(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Berkas bukan gambar yang valid.')); i.src = url; });
      const maks = 1280, s = Math.min(1, maks / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      let q = 0.74, blob;
      do { blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', q)); q -= 0.08; } while (blob && blob.size > 330 * 1024 && q > 0.3);
      if (!blob) throw new Error('Gagal memproses foto.');
      return blob;
    } finally { URL.revokeObjectURL(url); }
  }
  const keBase64 = (blob) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });

  // ═════════════ W-05 Form pelanggaran ═════════════
  const LABEL_FOTO = ['Plat depan *', 'Plat belakang *', 'Foto ke-3', 'Foto ke-4'];
  ETL.rute('/catat/:id', { layout: 'app', nav: 'catat', judul: 'Catat Pelanggaran', peran: ['Petugas', 'Admin'], render: (c) => formCatat(c) });
  ETL.rute('/catat', { layout: 'app', nav: 'catat', judul: 'Catat Pelanggaran', peran: ['Petugas', 'Admin'], render: (c) => formCatat(c) });

  async function formCatat({ el, param }) {
    const KUNCI_DRAFT = 'etl_draft_form';
    const S = { id: param.id || null, slot: [null, null, null, null], lat: '', lng: '', akur: '', jenis: [], cfg: {} };
    el.appendChild(ETL.skeleton(4, 120));
    let master, cfg, kasusLama = null;
    try {
      [master, cfg] = await Promise.all([ETL.apiSwr('master.jenis', {}, () => {}), ETL.config()]);
      if (S.id) { const d = await ETL.api('pelanggaran.detail', { id: S.id }); kasusLama = d.kasus; if (kasusLama.status !== 'Draft') { location.replace(ETL.href('kasus', S.id)); return; } }
    } catch (e) { ETL.kosong(el); el.appendChild(h('div', { class: 'bahaya-kotak' }, e.pesan || 'Gagal memuat formulir.')); return; }
    ETL.kosong(el);
    S.jenis = master.jenis; S.cfg = cfg || {};
    const adaNotif = !!S.cfg.notif_tersedia;
    const F = {};
    const kolom = (id, kelas, opsi) => (F[id] = h('input', Object.assign({ class: kelas || 'input', id: 'f-' + id }, opsi)));
    kolom('nopol', 'input input-plat', { placeholder: 'KT 8421 LQ', autocapitalize: 'characters', maxlength: 12, autocomplete: 'off' });
    F.jenis_kendaraan = h('select', { class: 'select', id: 'f-jk' }, h('option', { value: '' }, 'Pilih jenis kendaraan'), master.jenis_kendaraan.map((j) => h('option', { value: j }, j)));
    kolom('merek_warna', 'input', { placeholder: 'Contoh: Hino / putih', maxlength: 80 }); kolom('nama_pemilik', 'input', { placeholder: 'Nama pengemudi atau pemilik', maxlength: 100 });
    kolom('no_wa', 'input', { placeholder: '0812xxxxxxxx', inputmode: 'tel', maxlength: 20 });
    F.izin_notif = h('input', { type: 'checkbox', id: 'f-izin' });
    F.id_jenis = h('select', { class: 'select', id: 'f-jenis' }, h('option', { value: '' }, 'Pilih jenis pelanggaran'));
    const labelJenis = ETL.labelJenis;
    const kat = {}; master.jenis.forEach((j) => { (kat[j.kategori] = kat[j.kategori] || []).push(j); });
    Object.keys(kat).forEach((k) => F.id_jenis.appendChild(h('optgroup', { label: k }, kat[k].map((j) => h('option', { value: j.id, title: j.uraian }, labelJenis(j))))));
    kolom('no_bukti_uji', 'input', { placeholder: 'Nomor bukti uji (dari dokumen fisik)', maxlength: 40 }); kolom('masa_berlaku_uji', 'input', { type: 'date' });
    kolom('lokasi_teks', 'input', { placeholder: 'Nama jalan / patokan lokasi', maxlength: 160 });
    F.wilayah = h('select', { class: 'select', id: 'f-wilayah' }, h('option', { value: '' }, 'Pilih wilayah'), master.wilayah.map((w) => h('option', { value: w }, w)));
    F.uraian = h('textarea', { class: 'textarea', id: 'f-uraian', maxlength: 600, placeholder: 'Catat keterangan secara objektif dan singkat.' });
    const hitung = h('div', { class: 'bantuan text-right' }, '0 / 600');
    F.uraian.addEventListener('input', () => { hitung.textContent = F.uraian.value.length + ' / 600'; });

    // riwayat
    const riwayat = h('div', { class: 'mt-3' });
    const btnRiwayat = h('button', { type: 'button', class: 'btn btn-sekunder btn-kecil', onclick: () => { if (F.nopol.value.trim()) cariRiwayat(F.nopol.value, riwayat); } }, ETL.ikon('riwayat', 16), 'Cek riwayat nopol');
    F.nopol.addEventListener('change', () => { if (F.nopol.value.trim().length >= 4) cariRiwayat(F.nopol.value, riwayat); });

    // info jenis
    const infoJenis = h('div', { class: 'kartu', style: { background: 'var(--surface-low)', boxShadow: 'none', display: 'none' } });
    const blokUji = h('div', { class: 'kartu', style: { display: 'none', background: '#fff7ee', boxShadow: 'none', border: '1px solid #f2c48f' } },
      h('div', { class: 'font-semibold text-primary mb-2' }, 'Pemeriksaan bukti uji fisik'), h('div', { class: 'grid gap-3' }, medan('Nomor bukti uji', F.no_bukti_uji, null, { wajib: true }), medan('Masa berlaku', F.masa_berlaku_uji, null, { wajib: true }),
        h('div', { class: 'bantuan' }, 'Ketik sesuai kartu/stiker fisik. Foto bukti uji (foto ke-3) wajib.')));
    // sanksi yang dikenakan: pilih satu atau lebih ("dan/atau")
    const blokSanksi = h('div', { class: 'kartu', style: { display: 'none', boxShadow: 'none', border: '1px solid var(--outline-variant, #c8c5d0)' } });
    const pilihSanksi = new Set();
    function gambarSanksi(j) {
      ETL.kosong(blokSanksi);
      const opsi = (j && j.opsi) || [];
      if (!opsi.length) { blokSanksi.style.display = 'none'; pilihSanksi.clear(); return; }
      blokSanksi.style.display = 'block';
      [...pilihSanksi].forEach((x) => { if (opsi.indexOf(x) < 0) pilihSanksi.delete(x); });
      blokSanksi.appendChild(h('div', { class: 'font-semibold text-primary mb-1' }, 'Sanksi yang dikenakan', h('span', { class: 'wajib' }, ' *')));
      blokSanksi.appendChild(h('div', { class: 'bantuan mb-2' }, 'Pilih satu atau lebih (dan/atau) sesuai tindakan yang dilakukan di lapangan.'));
      opsi.forEach((o) => {
        const cb = h('input', { type: 'checkbox', checked: pilihSanksi.has(o) });
        cb.addEventListener('change', () => { cb.checked ? pilihSanksi.add(o) : pilihSanksi.delete(o); el.dispatchEvent(new Event('change', { bubbles: true })); });
        blokSanksi.appendChild(h('label', { class: 'pilihan' }, cb, h('span', null, o)));
      });
    }
    function jenisBerubah() {
      const j = S.jenis.find((x) => x.id === F.id_jenis.value); ETL.kosong(infoJenis); gambarSanksi(j);
      if (!j) { infoJenis.style.display = 'none'; blokUji.style.display = 'none'; ubahLabelFoto(false); return; }
      infoJenis.style.display = 'block';
      infoJenis.appendChild(h('div', { class: 'flex justify-between gap-2 items-center' }, h('span', { class: 'text-label-md text-on-surface-variant' }, 'Dasar hukum & ketentuan'), h('span', { class: 'badge badge-peran' }, 'Perda 7/2022')));
      infoJenis.appendChild(h('div', { class: 'font-semibold text-primary mt-1' }, j.pasal_perda));
      infoJenis.appendChild(h('div', { class: 'text-body-sm text-on-surface-variant mt-1' }, j.sanksi ? 'Dasar sanksi: ' + j.sanksi : 'Sanksi mengikuti ketentuan Perda (belum diisi admin).'));
      blokUji.style.display = j.perlu_bukti_uji === 'YA' ? 'block' : 'none'; ubahLabelFoto(j.perlu_bukti_uji === 'YA');
    }
    F.id_jenis.addEventListener('change', jenisBerubah);

    // foto
    const slotEl = [];
    let ujiWajib = false;
    function ubahLabelFoto(uji) { ujiWajib = uji; slotEl.forEach((s, i) => { if (i === 2) s.lbl.textContent = uji ? 'Bukti uji fisik *' : LABEL_FOTO[2]; }); }
    function buatSlot(i) {
      const input = h('input', { type: 'file', accept: 'image/*', capture: 'environment', class: 'sr-only', 'aria-label': 'Ambil foto ' + (i + 1) });
      const lbl = h('span', null, LABEL_FOTO[i]), status = h('div', { class: 'status-slot' }), prog = h('div', { class: 'progres', style: { width: '0%' } });
      const isi = h('div', { class: 'flex flex-col items-center gap-1 p-2 text-body-sm' }, ETL.ikon('kamera', 30), h('span', { class: 'font-semibold' }, 'Ambil foto'));
      const kotak = h('div', { class: 'slot-foto', role: 'button', tabindex: 0, onclick: () => input.click(), onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } } }, isi, h('div', { class: 'label-slot' }, lbl), status, prog, input);
      input.addEventListener('change', async () => {
        const f = input.files[0]; if (!f) return;
        try { const blob = await kompres(f); S.slot[i] = { blob, terunggah: false }; tampilSlot(i, URL.createObjectURL(blob), Math.round(blob.size / 1024) + ' KB'); mulaiLatar(); }
        catch (e) { ETL.toast(e.message || 'Foto gagal diproses.', 'galat'); }
        input.value = '';
      });
      slotEl[i] = { kotak, lbl, status, prog, isi };
      return kotak;
    }
    function tampilSlot(i, src, ket, tersimpan) {
      const s = slotEl[i]; s.kotak.classList.add('terisi'); const lama = s.kotak.querySelector('img'); if (lama) lama.remove(); ETL.kosong(s.isi); s.isi.style.display = 'none';
      s.kotak.insertBefore(h('img', { src, alt: 'Foto ' + (i + 1) }), s.kotak.firstChild); ETL.kosong(s.status);
      s.status.appendChild(h('span', { class: 'badge ' + (tersimpan ? 'badge-ok' : 'badge-terbit') }, tersimpan ? 'Tersimpan' : ket || 'Siap'));
    }
    const gridFoto = h('div', { class: 'grid grid-cols-2 gap-3' }, [0, 1, 2, 3].map(buatSlot));

    // lokasi & peta
    const infoGps = h('div', { class: 'text-body-sm text-on-surface-variant', id: 'info-gps' }, 'Belum ada titik. Gunakan GPS atau ketuk peta.');
    const petaEl = h('div', { class: 'peta-mini', id: 'peta-form' });
    let peta, marker;
    function setTitik(lat, lng, akur, dariPeta) {
      S.lat = Math.round(lat * 1e6) / 1e6; S.lng = Math.round(lng * 1e6) / 1e6; S.akur = akur || '';
      infoGps.textContent = 'Titik: ' + S.lat + ', ' + S.lng + (akur ? ' • akurasi ±' + Math.round(akur) + ' m' : '');
      if (peta) { if (!marker) { marker = L.marker([lat, lng], { draggable: true }).addTo(peta); marker.on('dragend', () => { const p = marker.getLatLng(); setTitik(p.lat, p.lng, '', true); }); } else marker.setLatLng([lat, lng]); if (!dariPeta) peta.setView([lat, lng], 17); }
    }
    const btnGps = h('button', { type: 'button', class: 'btn btn-primer btn-kecil', onclick: () => {
      if (!navigator.geolocation) { ETL.toast('Peramban tidak mendukung GPS. Pilih titik di peta.', 'galat'); return; }
      ETL.tombolMuat(btnGps, true, 'Mencari sinyal GPS…');
      navigator.geolocation.getCurrentPosition((p) => { setTitik(p.coords.latitude, p.coords.longitude, p.coords.accuracy); ETL.tombolMuat(btnGps, false, ' Gunakan GPS saya'); btnGps.prepend(ETL.ikon('gps', 16)); ETL.toast('Titik GPS terpasang.', 'ok'); },
        (e) => { ETL.tombolMuat(btnGps, false, ' Gunakan GPS saya'); btnGps.prepend(ETL.ikon('gps', 16)); ETL.toast(e.code === 1 ? 'Izin lokasi ditolak. Pilih titik di peta atau ketik nama jalan.' : 'GPS tidak tersedia. Pilih titik di peta.', 'galat'); }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
    } }, ETL.ikon('gps', 16), 'Gunakan GPS saya');

    // pemasangan form
    const bagian = (no, judul, ...isi) => h('section', { class: 'kartu reveal', style: { display: 'grid', gap: '.9rem' } }, h('div', null, h('div', { class: 'bagian-nomor' }, 'Bagian ' + no), h('h2', { class: 'text-headline-md text-primary' }, judul)), ...isi);
    const galatUmum = h('div', { class: 'bahaya-kotak', role: 'alert', style: { display: 'none' } });
    const btnDraft = h('button', { type: 'button', class: 'btn btn-sekunder', style: { flex: 1 } }, 'Simpan draft');
    const btnTerbit = h('button', { type: 'button', class: 'btn btn-utama', style: { flex: 2 } }, 'Pratinjau & terbitkan');
    el.appendChild(h('div', { class: 'grid gap-4 pad-bawah', style: { maxWidth: '720px', margin: '0 auto', paddingBottom: '9rem' } },
      h('div', { class: 'flex items-center justify-between gap-2' }, h('div', null, h('h1', { class: 'text-headline-lg-mobile text-primary' }, S.id ? 'Lanjutkan draft' : 'Catat pelanggaran'), h('div', { class: 'text-body-sm text-on-surface-variant' }, S.id ? S.id : 'Waktu & identitas petugas dicatat server')),
        S.id ? null : h('button', { type: 'button', class: 'btn btn-hantu btn-kecil', onclick: () => { ETL.simpan.del(KUNCI_DRAFT); location.reload(); } }, 'Kosongkan')),
      bagian('01', 'Data kendaraan', medan('Nomor polisi (nopol)', F.nopol, null, { wajib: true }), h('div', { class: 'flex gap-2 flex-wrap' }, btnRiwayat), riwayat,
        medan('Jenis kendaraan', F.jenis_kendaraan, null, { wajib: true }), medan('Merek & warna', F.merek_warna, null, { opsi: 'opsional' }), medan('Nama pengemudi / pemilik', F.nama_pemilik, null, { opsi: 'opsional' }),
        adaNotif ? h('div', { class: 'kartu', style: { background: 'var(--surface-low)', boxShadow: 'none', display: 'grid', gap: '.6rem' } }, medan('Nomor WhatsApp pelanggar', F.no_wa, null, { opsi: 'opsional' }),
          h('label', { class: 'pilihan' }, F.izin_notif, h('span', null, 'Pelanggar menyetujui menerima pemberitahuan status surat lewat WhatsApp (dapat berhenti dengan membalas STOP).'))) : null),
      bagian('02', 'Jenis pelanggaran & pasal Perda', medan('Jenis pelanggaran', F.id_jenis, null, { wajib: true }), infoJenis, blokSanksi, blokUji),
      bagian('03', 'Bukti foto lapangan', h('div', { class: 'flex justify-between text-body-sm text-on-surface-variant' }, h('span', null, 'Minimal 2 foto, maksimal 4'), h('span', null, 'Dikompres otomatis (≈150–300 KB)')), gridFoto),
      bagian('04', 'Lokasi penindakan', h('div', { class: 'flex items-center justify-between gap-2 flex-wrap' }, btnGps, infoGps), petaEl,
        medan('Nama jalan / patokan', F.lokasi_teks, null, { wajib: true }), medan('Wilayah', F.wilayah, null, { opsi: 'opsional' })),
      bagian('05', 'Uraian singkat kejadian', F.uraian, hitung), galatUmum));
    el.appendChild(h('div', { class: 'bar-aksi tanpa-cetak' }, btnDraft, btnTerbit));
    ETL.munculSaatTergulir(el);

    // peta (Leaflet) — setelah elemen berada di DOM
    setTimeout(() => {
      try {
        L.Icon.Default.prototype.options.imagePath = 'vendor/images/';
        peta = L.map(petaEl, { zoomControl: true, attributionControl: true }).setView([-1.2654, 116.8312], 12);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(peta);
        peta.on('click', (e) => setTitik(e.latlng.lat, e.latlng.lng, '', true));
        if (S.lat !== '') setTitik(S.lat, S.lng, S.akur);
        setTimeout(() => peta.invalidateSize(), 300);
      } catch (e) { petaEl.appendChild(h('div', { class: 'p-3 text-body-sm' }, 'Peta tidak dapat dimuat. Ketik nama jalan sebagai lokasi.')); }
    }, 150);

    // isi dari draft server / lokal
    const isiForm = (d) => {
      ['nopol', 'merek_warna', 'nama_pemilik', 'no_wa', 'no_bukti_uji', 'lokasi_teks'].forEach((k) => { if (d[k] !== undefined && d[k] !== null) F[k].value = k === 'nopol' ? ETL.formatNopol(d[k]) : d[k]; });
      if (d.masa_berlaku_uji) F.masa_berlaku_uji.value = String(d.masa_berlaku_uji).slice(0, 10);
      ['jenis_kendaraan', 'id_jenis', 'wilayah'].forEach((k) => { if (d[k]) F[k].value = d[k]; });
      F.uraian.value = d.uraian || ''; hitung.textContent = F.uraian.value.length + ' / 600'; F.izin_notif.checked = d.izin_notif === 'YA';
      if (d.lat !== '' && d.lat !== undefined && d.lat !== null) { S.lat = Number(d.lat); S.lng = Number(d.lng); infoGps.textContent = 'Titik: ' + S.lat + ', ' + S.lng; }
      pilihSanksi.clear(); String(d.sanksi_dikenakan || '').split('|').filter(Boolean).forEach((x) => pilihSanksi.add(x));
      jenisBerubah();
    };
    if (kasusLama) {
      isiForm(kasusLama);
      (kasusLama.slot_foto || []).forEach((n) => { const i = n - 1; S.slot[i] = { tersimpan: true, terunggah: true }; tampilSlot(i, 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==', '', true);
        ETL.api('foto.get', { id: S.id, urutan: n }).then((f) => { const im = slotEl[i].kotak.querySelector('img'); if (im) im.src = 'data:' + f.mime + ';base64,' + f.data; }).catch(() => {}); });
    } else if (!S.id) {
      try { const t = ETL.simpan.get(KUNCI_DRAFT); if (t) { const dl = JSON.parse(t); if (dl._id) { S.id = dl._id; S.latar = true; } isiForm(dl); ETL.toast('Isian terakhir dipulihkan (foto perlu diambil ulang).', 'info'); } } catch (e) {}
    }
    const autosimpan = ETL.debounce(() => { if (S.id && !S.latar) return; ETL.simpan.set(KUNCI_DRAFT, JSON.stringify(Object.assign(ambil(), { _id: S.latar ? S.id : undefined }))); }, 600);
    el.addEventListener('input', autosimpan); el.addEventListener('change', autosimpan);

    function ambil() {
      return { nopol: F.nopol.value, jenis_kendaraan: F.jenis_kendaraan.value, merek_warna: F.merek_warna.value, nama_pemilik: F.nama_pemilik.value, no_wa: adaNotif ? F.no_wa.value : '',
        izin_notif: adaNotif && F.izin_notif.checked ? 'YA' : 'TIDAK', id_jenis: F.id_jenis.value, sanksi_dikenakan: [...pilihSanksi].join('|'), no_bukti_uji: F.no_bukti_uji.value, masa_berlaku_uji: F.masa_berlaku_uji.value,
        lokasi_teks: F.lokasi_teks.value, wilayah: F.wilayah.value, lat: S.lat, lng: S.lng, uraian: F.uraian.value };
    }
    function tandai(f, salah) { f.classList.toggle('salah', !!salah); }
    function periksa(penuh) {
      const g = []; Object.values(F).forEach((f) => f.classList && tandai(f, false));
      if (F.nopol.value.trim().length < 3) { g.push('Isi nomor polisi.'); tandai(F.nopol, 1); }
      if (!F.jenis_kendaraan.value) { g.push('Pilih jenis kendaraan.'); tandai(F.jenis_kendaraan, 1); }
      if (!F.id_jenis.value) { g.push('Pilih jenis pelanggaran.'); tandai(F.id_jenis, 1); }
      if (penuh) {
        const jn = S.jenis.find((x) => x.id === F.id_jenis.value);
        if (jn && jn.opsi && jn.opsi.length && !pilihSanksi.size) g.push('Pilih sanksi yang dikenakan.');
        const jumlah = S.slot.filter(Boolean).length;
        if (jumlah < 2 || !S.slot[0] || !S.slot[1]) g.push('Ambil foto plat depan dan belakang (minimal 2 foto).');
        if (ujiWajib) { if (!F.no_bukti_uji.value.trim()) { g.push('Isi nomor bukti uji.'); tandai(F.no_bukti_uji, 1); } if (!F.masa_berlaku_uji.value) { g.push('Isi masa berlaku bukti uji.'); tandai(F.masa_berlaku_uji, 1); } if (!S.slot[2]) g.push('Ambil foto bukti uji (foto ke-3).'); }
        if (!F.lokasi_teks.value.trim() && S.lat === '') { g.push('Isi lokasi (GPS/peta atau nama jalan).'); tandai(F.lokasi_teks, 1); }
      }
      galatUmum.style.display = g.length ? 'block' : 'none'; ETL.kosong(galatUmum); if (g.length) { galatUmum.appendChild(h('ul', { style: { margin: 0, paddingLeft: '1.1rem' } }, g.map((x) => h('li', null, x)))); galatUmum.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      return !g.length;
    }
    async function simpanDraft(konfirmasi) {
      const r = await ETL.api('pelanggaran.simpan', Object.assign(ambil(), { id: S.id || undefined, konfirmasi_duplikat: !!konfirmasi }), { ulang: false });
      if (r.perlu_konfirmasi) {
        const lanjut = await new Promise((res) => { let sel = false; ETL.modal({ judul: 'Kemungkinan kasus ganda', onTutup: () => { if (!sel) res(false); },
          isi: [h('div', { class: 'peringatan' }, 'Nopol yang sama sudah tercatat dengan jenis pelanggaran yang sama dalam 24 jam terakhir.'), r.duplikat.map((d) => h('div', { class: 'kartu', style: { boxShadow: 'none', background: 'var(--surface-low)' } }, h('div', { class: 'flex justify-between' }, h('span', { class: 'text-body-sm' }, ETL.waktu(d.waktu)), ETL.lencana(d.status)), h('div', { class: 'text-body-sm mt-1' }, d.nomor_surat || d.id)))],
          tombol: [{ teks: 'Periksa dulu', kelas: 'btn-sekunder', onClick: () => { sel = true; res(false); } }, { teks: 'Lanjutkan dengan sadar', kelas: 'btn-utama', onClick: () => { sel = true; res(true); } }] }); });
        if (!lanjut) return null;
        return simpanDraft(true);
      }
      S.id = r.id; S.latar = false; history.replaceState(null, '', '#/catat/' + encodeURIComponent(S.id)); ETL.simpan.del(KUNCI_DRAFT);
      return S.id;
    }
    // ── Unggah foto di latar belakang: begitu foto diambil dan isian dasar lengkap, draft dibuat diam-diam
    // lalu foto diunggah satu per satu, sehingga saat tombol terbit ditekan tinggal menyimpan dan menerbitkan.
    let latarJalan = null;
    const adaFotoMenunggu = () => S.slot.some((x) => x && x.blob && !x.terunggah);
    const dasarLatarSiap = () => F.nopol.value.trim().length >= 3 && !!F.jenis_kendaraan.value && !!F.id_jenis.value;
    async function simpanSenyap() {
      if (S.id) return S.id;
      const r = await ETL.api('pelanggaran.simpan', Object.assign(ambil(), { konfirmasi_duplikat: false }), { ulang: false });
      if (r.perlu_konfirmasi) { S.tahanLatar = true; return null; } // kemungkinan ganda: biarkan jalur terbit menampilkan konfirmasi
      S.id = r.id; S.latar = true; return S.id;
    }
    function mulaiLatar() {
      if (latarJalan || S.tahanLatar) return; // putaran yang sedang jalan akan mengambil foto baru
      latarJalan = (async () => {
        await null; // beri kesempatan penugasan latarJalan selesai sebelum penandanya dikosongkan
        try {
          while (adaFotoMenunggu() && dasarLatarSiap()) {
            if (!S.id && !(await simpanSenyap())) break;
            await unggahFoto();
          }
        } catch (e) { /* senyap: tombol simpan/terbit mengulang dan menampilkan galat bila masih gagal */ }
        latarJalan = null;
      })();
    }
    async function tungguLatar() { while (latarJalan) await latarJalan; }
    el.addEventListener('change', () => { if (adaFotoMenunggu()) mulaiLatar(); });
    async function unggahFoto() {
      for (let i = 0; i < 4; i++) {
        const s = S.slot[i]; if (!s || s.terunggah || !s.blob) continue;
        const prog = slotEl[i].prog; prog.style.width = '30%';
        const b64 = await keBase64(s.blob); prog.style.width = '60%';
        try { await ETL.api('pelanggaran.foto', { id: S.id, urutan: i + 1, data: b64 }, { ulang: false, timeout: 90000 }); s.terunggah = true; prog.style.width = '100%'; ETL.kosong(slotEl[i].status); slotEl[i].status.appendChild(h('span', { class: 'badge badge-ok' }, 'Terunggah')); }
        catch (e) { prog.style.width = '0%'; ETL.kosong(slotEl[i].status); slotEl[i].status.appendChild(h('span', { class: 'badge badge-err' }, 'Gagal')); throw e; }
      }
    }
    function kunciTombol(b) { btnDraft.disabled = b; btnTerbit.disabled = b; }
    btnDraft.addEventListener('click', async () => {
      if (!periksa(false)) return; kunciTombol(true);
      try { await tungguLatar(); const id = await simpanDraft(); if (id) { await unggahFoto(); ETL.toast('Draft tersimpan.', 'ok'); } } catch (e) { ETL.toast(e.pesan || 'Gagal menyimpan.', 'galat'); }
      kunciTombol(false);
    });
    btnTerbit.addEventListener('click', async () => {
      if (!periksa(true)) return;
      const ya = await ETL.konfirmasi('Terbitkan surat penindakan?', 'Setelah terbit, data tidak dapat diubah oleh petugas dan nomor surat akan dibuat. Pastikan nopol, jenis pelanggaran, dan foto sudah benar.', 'Ya, terbitkan', 'btn-utama');
      if (!ya) return; kunciTombol(true); ETL.tombolMuat(btnTerbit, true, 'Memproses…');
      try {
        await tungguLatar();
        const id = await simpanDraft(true); if (!id) throw { pesan: 'Dibatalkan.' };
        await unggahFoto();
        const r = await ETL.api('pelanggaran.terbitkan', { id }, { ulang: false });
        ETL.toast('Surat terbit: ' + r.nomor_surat, 'ok'); ETL.simpan.del(KUNCI_DRAFT); location.hash = ETL.href('surat', id);
      } catch (e) { ETL.toast(e.pesan || 'Gagal menerbitkan.', 'galat'); ETL.tombolMuat(btnTerbit, false, 'Pratinjau & terbitkan'); kunciTombol(false); }
    });
  }

  // ═════════════ W-06 Surat ═════════════
  function qrSvg(teks, ukuran) {
    const q = qrcode(0, 'M'); q.addData(teks); q.make();
    const n = q.getModuleCount(), NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + (n + 2) + ' ' + (n + 2)); svg.setAttribute('width', ukuran); svg.setAttribute('height', ukuran); svg.setAttribute('shape-rendering', 'crispEdges'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'QR cek status surat');
    const bg = document.createElementNS(NS, 'rect'); bg.setAttribute('width', n + 2); bg.setAttribute('height', n + 2); bg.setAttribute('fill', '#fff'); svg.appendChild(bg);
    let d = ''; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += 'M' + (c + 1) + ' ' + (r + 1) + 'h1v1h-1z';
    const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); p.setAttribute('fill', '#141a4a'); svg.appendChild(p);
    return svg;
  }
  ETL.qrSvg = qrSvg;

  ETL.rute('/surat/:id', { layout: 'app', nav: 'kasus', judul: 'Surat Penindakan', render: async ({ el, param }) => {
    el.appendChild(ETL.skeleton(3, 160));
    let det;
    try { det = await ETL.api('pelanggaran.detail', { id: param.id }); } catch (e) { ETL.kosong(el); el.appendChild(h('div', { class: 'bahaya-kotak' }, e.pesan || 'Gagal memuat surat.')); return; }
    const k = det.kasus, ins = det.instansi, p = ETL.sesi.profil();
    ETL.kosong(el);
    if (k.status === 'Draft') { el.appendChild(h('div', { class: 'peringatan' }, 'Kasus ini masih draft dan belum memiliki surat.', h('a', { href: ETL.href('catat', k.id), class: 'btn btn-utama btn-kecil ml-2' }, 'Lanjutkan draft'))); return; }
    const urlCek = (ins.url_cek || (location.origin + location.pathname + '#/cek')).replace(/\?.*$/, '') + '?no=' + encodeURIComponent(k.nomor_surat);
    const batal = k.status === 'Dibatalkan';
    const fotoGrid = h('div', { class: 'foto-grid' });
    const baris = (a, b) => h('div', { class: 'baris' }, h('b', null, a), h('span', null, b || '–'));
    const surat = h('article', { class: 'surat area-cetak', style: { position: 'relative' } },
      batal ? h('div', { class: 'dibatalkan-cap' }, 'DIBATALKAN') : null,
      h('div', { class: 'kop' }, h('div', { style: { fontSize: '12px', letterSpacing: '.08em' } }, 'PEMERINTAH KOTA BALIKPAPAN'), h('h2', { style: { fontSize: '19px', color: '#06104c' } }, (ins.nama_dinas || '').toUpperCase()), h('div', { style: { fontSize: '11px' } }, ins.kop_alamat)),
      h('div', { style: { textAlign: 'center', marginBottom: '8px' } }, h('h1', { style: { fontSize: '15px' } }, 'SURAT PENINDAKAN PELANGGARAN'), h('div', { class: 'mono', style: { fontWeight: 700, marginTop: '4px' } }, 'No. ' + k.nomor_surat)),
      h('div', { class: 'blok' }, h('div', { class: 'blok-judul' }, 'Waktu & lokasi'), baris('Hari / tanggal / pukul', ETL.waktu(k.tgl_terbit || k.waktu, true)), baris('Lokasi', [k.lokasi_teks, k.wilayah].filter(Boolean).join(', ')), k.lat !== '' ? baris('Koordinat', k.lat + ', ' + k.lng) : null),
      h('div', { class: 'blok' }, h('div', { class: 'blok-judul' }, 'Identitas kendaraan'),
        h('div', { style: { background: '#141a4a', color: '#fff', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, h('span', { style: { fontSize: '22px', fontWeight: 800, letterSpacing: '.12em' } }, ETL.formatNopol(k.nopol)), h('span', { style: { fontSize: '11px', background: '#fff', color: '#141a4a', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 } }, (k.jenis_kendaraan || '').toUpperCase())),
        baris('Merek / warna', k.merek_warna), baris('Pengemudi / pemilik', k.nama_pemilik), k.no_bukti_uji ? baris('Bukti uji', k.no_bukti_uji + (k.masa_berlaku_uji ? ' (berlaku s.d. ' + ETL.tgl(k.masa_berlaku_uji) + ')' : '')) : null),
      h('div', { class: 'blok' }, h('div', { class: 'blok-judul' }, 'Pelanggaran & dasar hukum'), baris('Pelanggaran', k.nama_jenis), baris('Dasar hukum', k.pasal_perda), baris('Sanksi dikenakan', String(k.sanksi_dikenakan || '').split('|').filter(Boolean).join('; ') || 'Sesuai ketentuan Perda'), k.sanksi ? baris('Dasar sanksi', k.sanksi) : null, k.uraian ? baris('Uraian', k.uraian) : null),
      h('div', { class: 'blok' }, h('div', { class: 'blok-judul' }, 'Dokumentasi bukti (' + (k.jumlah_foto || 0) + ' foto)'), fotoGrid),
      h('div', { class: 'ttd' }, h('div', null, h('div', { style: { fontSize: '11px' } }, 'Penerima surat'), h('div', { class: 'garis-ttd' }), h('div', { style: { fontSize: '11px' } }, k.nama_pemilik || '(nama & tanda tangan)')),
        h('div', null, ETL.qrSvg(urlCek, 112), h('div', { style: { fontSize: '9px' } }, 'Pindai untuk cek status')),
        h('div', null, h('div', { style: { fontSize: '11px' } }, 'Petugas penindak'), h('div', { class: 'garis-ttd' }), h('div', { style: { fontWeight: 700, fontSize: '12px', textDecoration: 'underline' } }, k.petugas.nama), h('div', { style: { fontSize: '10px' } }, 'NIP ' + (k.petugas.nip || '–')))),
      h('p', { style: { fontSize: '10px', color: '#555', textAlign: 'center', marginTop: '12px', fontStyle: 'italic' } }, 'Surat ini diterbitkan melalui Sistem ' + ETL_CONFIG.NAMA_APP + '. Keaslian dapat diperiksa dengan memindai QR atau di halaman Cek Status dengan nomor surat dan nomor polisi.'));
    const arsip = h('button', { class: 'btn btn-sekunder', onclick: async () => { ETL.tombolMuat(arsip, true, 'Mengarsipkan…'); try { await ETL.api('pelanggaran.arsipPdf', { id: k.id }, { ulang: false, timeout: 90000 }); ETL.toast('PDF tersimpan di folder Drive kasus.', 'ok'); } catch (e) { ETL.toast(e.pesan || 'Gagal.', 'galat'); } ETL.tombolMuat(arsip, false, ' Arsipkan PDF ke Drive'); arsip.prepend(ETL.ikon('basisData', 18)); } }, ETL.ikon('basisData', 18), 'Arsipkan PDF ke Drive');
    el.appendChild(h('div', { class: 'grid gap-3', style: { maxWidth: '794px', margin: '0 auto' } },
      h('div', { class: 'flex items-center justify-between gap-2 flex-wrap tanpa-cetak' }, h('div', null, h('div', { class: 'text-headline-sm text-primary' }, 'Pratinjau resmi'), h('div', { class: 'text-body-sm text-on-surface-variant' }, 'Format A4 • ' + k.status)), ETL.lencana(k.status)),
      h('div', { class: 'grid grid-cols-2 gap-2 tanpa-cetak' }, h('button', { class: 'btn btn-primer', onclick: () => window.print() }, ETL.ikon('cetak', 20), 'Cetak surat (A4)'), h('button', { class: 'btn btn-sekunder', onclick: () => { ETL.toast('Pada dialog cetak, pilih "Simpan sebagai PDF".', 'info'); setTimeout(() => window.print(), 400); } }, ETL.ikon('pdf', 20), 'Simpan PDF')),
      h('div', { class: 'flex gap-2 flex-wrap tanpa-cetak' }, h('a', { href: ETL.beranda(), class: 'btn btn-hantu btn-kecil' }, ETL.ikon('kiri', 16), 'Beranda'), h('a', { href: ETL.href('kasus', k.id), class: 'btn btn-hantu btn-kecil' }, 'Detail kasus'), (p.peran === 'Admin' || p.peran === 'Petugas') && !batal ? arsip : null),
      surat));
    // muat foto berurutan
    (async () => { for (let n = 1; n <= 4; n++) { if (!(k.slot_foto || []).includes(n)) continue; try { const f = await ETL.api('foto.get', { id: k.id, urutan: n }); fotoGrid.appendChild(h('img', { src: 'data:' + f.mime + ';base64,' + f.data, alt: 'Foto bukti ' + n })); } catch (e) { /* lewati */ } } if (!fotoGrid.children.length) fotoGrid.appendChild(h('div', { style: { padding: '8px', fontSize: '11px' } }, 'Foto tidak tersedia.')); })();
  } });
})();
