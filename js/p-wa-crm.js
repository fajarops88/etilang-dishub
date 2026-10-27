/* p-wa-crm.js : modul Notifikasi WhatsApp/Email (/wa) dan CRM kontak (/crm). Hanya Admin. */
(function () {
  'use strict';
  const ETL = window.ETL, h = ETL.h, medan = (...a) => ETL.medan(...a);
  const STATUS_KELAS = { Antri: 'badge-terbit', Terkirim: 'badge-ok', Gagal: 'badge-batal', Dilewati: 'badge-draft', Dibatalkan: 'badge-draft' };
  const EVENT = [['evt_terbit', 'Surat diterbitkan', 'Ke pemilik yang memberi izin'], ['evt_tindak', 'Tindak lanjut dicatat', 'Pengingat kewajiban'], ['evt_selesai', 'Kasus selesai', 'Pemberitahuan penutupan'], ['evt_batal', 'Surat dibatalkan', 'Informasi pembatalan']];

  function sakelar(nilai, onUbah, label) {
    const i = h('input', { type: 'checkbox', checked: !!nilai, 'aria-label': label, onchange: async (e) => { const v = e.target.checked; e.target.disabled = true; try { await onUbah(v); } catch (er) { e.target.checked = !v; ETL.toast(er.pesan || 'Gagal.', 'galat'); } e.target.disabled = false; } });
    return h('label', { class: 'sakelar' }, i, h('span'));
  }
  const simpanSet = (k, v) => ETL.api('setting.save', { pengaturan: { [k]: typeof v === 'boolean' ? (v ? 'YA' : 'TIDAK') : String(v) } }, { ulang: false });

  // ═════════════ /wa ═════════════
  ETL.rute('/wa', { layout: 'app', nav: 'wa', judul: 'Notifikasi WhatsApp', peran: ['Admin'], render: async ({ el }) => {
    const akar = h('div', { class: 'grid gap-3' });
    el.appendChild(h('div', null, h('h1', { class: 'text-headline-lg-mobile md:text-headline-lg text-primary' }, 'Notifikasi WhatsApp & Email'), h('p', { class: 'text-body-md text-on-surface-variant mb-3' }, 'Pengiriman bertahap lewat antrean. Hanya ke pemilik yang memberi izin, dengan opsi berhenti (STOP).'), akar));
    let st;
    async function muat() {
      ETL.kosong(akar); akar.appendChild(ETL.skeleton(3, 90));
      try { st = await ETL.api('notif.status'); } catch (e) { ETL.kosong(akar); akar.appendChild(h('div', { class: 'bahaya-kotak' }, e.pesan || 'Gagal memuat.')); return; }
      gambar();
    }
    function gambar() {
      ETL.kosong(akar);
      akar.appendChild(h('div', { class: 'peringatan' }, h('b', null, 'Perhatian hukum & PRD. '), st.peringatan, ' Saklar utama sengaja MATI secara bawaan. Konfirmasikan ke Bagian Hukum/PPID sebelum mengirim data pribadi (nomor WA) kepada pemilik kendaraan.'));
      const sv = (l, n) => { const a = h('div', { class: 'angka' }, '0'); ETL.hitungNaik(a, n, 600); return h('div', { class: 'kartu stat' }, h('div', { class: 'text-label-md text-on-surface-variant', style: { textTransform: 'uppercase' } }, l), a); };
      akar.appendChild(h('div', { class: 'grid gap-3', style: { gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' } }, sv('Antri', st.antrean.Antri || 0), sv('Terkirim', st.antrean.Terkirim || 0), sv('Gagal', st.antrean.Gagal || 0), sv('Terkirim hari ini', st.terkirim_hari_ini), sv('Sisa kuota email', st.kuota_email)));

      // Saklar
      const baris = (judul, ket, ctl) => h('div', { class: 'flex items-center justify-between gap-3 py-2', style: { borderBottom: '1px solid var(--outline-var)' } }, h('div', null, h('div', { class: 'font-semibold text-primary' }, judul), ket ? h('div', { class: 'text-body-sm text-on-surface-variant' }, ket) : null), ctl);
      akar.appendChild(h('section', { class: 'kartu' }, h('h2', { class: 'text-headline-md text-primary mb-2' }, 'Saklar & kanal'),
        baris('Saklar utama notifikasi', 'MATI = tidak ada pesan keluar sama sekali.', sakelar(st.notif_aktif, async (v) => { await simpanSet('notif_aktif', v); st.notif_aktif = v; ETL.toast(v ? 'Notifikasi AKTIF.' : 'Notifikasi dimatikan.', v ? 'ok' : 'info'); })),
        baris('Kanal WhatsApp (Fonnte)', st.token_terisi ? 'Token Fonnte terisi.' : 'Token Fonnte belum diisi (Master › Rahasia & integrasi).', sakelar(st.notif_wa, async (v) => { await simpanSet('notif_wa', v); st.notif_wa = v; })),
        baris('Kanal Email', 'Memakai kuota email akun pemilik script.', sakelar(st.notif_email, async (v) => { await simpanSet('notif_email', v); st.notif_email = v; })),
        h('div', { class: 'text-label-md text-on-surface-variant mt-3 mb-1', style: { textTransform: 'uppercase' } }, 'Peristiwa yang memicu pesan'),
        EVENT.map(([k, l, ket]) => baris(l, ket, sakelar(st.event[k.replace('evt_', '')], async (v) => { await simpanSet(k, v); st.event[k.replace('evt_', '')] = v; })))));

      // Batas
      const bt = h('select', { class: 'select' }, [10, 20, 50].map((n) => h('option', { value: n, selected: n === st.batch }, n + ' pesan / batch'))), hr = h('input', { class: 'input', type: 'number', min: 1, max: 2000, value: st.batas_harian });
      akar.appendChild(h('section', { class: 'kartu', style: { display: 'grid', gap: '.8rem' } }, h('h2', { class: 'text-headline-md text-primary' }, 'Batas pengiriman'), h('div', { class: 'grid gap-3 md:grid-cols-2' }, medan('Ukuran batch', bt), medan('Batas harian', hr)),
        h('button', { class: 'btn btn-primer', style: { justifySelf: 'start' }, onclick: async () => { try { await ETL.api('setting.save', { pengaturan: { blast_batch: bt.value, batas_harian: hr.value } }, { ulang: false }); ETL.toast('Batas tersimpan.', 'ok'); muat(); } catch (e) { ETL.toast(e.pesan || 'Gagal.', 'galat'); } } }, 'Simpan batas')));

      // Tes + cek
      const tuj = h('input', { class: 'input', inputmode: 'tel', placeholder: '0812xxxxxxx' }), hasilCek = h('div', { class: 'text-body-sm' });
      akar.appendChild(h('section', { class: 'kartu', style: { display: 'grid', gap: '.8rem' } }, h('h2', { class: 'text-headline-md text-primary' }, 'Cek & tes nomor'), medan('Nomor WhatsApp', tuj, null, { bantuan: 'Format 08xx / 628xx / +628xx.' }),
        h('div', { class: 'flex gap-2 flex-wrap' },
          h('button', { class: 'btn btn-sekunder', onclick: async () => { ETL.kosong(hasilCek); try { const r = await ETL.api('wa.cek', { nomor: tuj.value, online: !!st.token_terisi }); hasilCek.appendChild(h('span', { class: r.valid ? '' : 'text-error' }, r.valid ? 'Format valid: ' + r.nomor + (r.terdaftar === true ? ' • terdaftar di WhatsApp' : r.terdaftar === false ? ' • TIDAK terdaftar di WhatsApp' : '') : r.catatan)); if (r.valid && r.catatan) hasilCek.appendChild(h('div', { class: 'text-on-surface-variant' }, r.catatan)); } catch (e) { hasilCek.textContent = e.pesan || 'Gagal.'; } } }, ETL.ikon('cari', 18), 'Cek nomor'),
          h('button', { class: 'btn btn-primer', onclick: async () => { if (!(await ETL.konfirmasi('Kirim pesan tes?', 'Satu pesan tes akan dikirim ke nomor tersebut lewat Fonnte.', 'Kirim tes', 'btn-primer'))) return; try { const r = await ETL.api('notif.tes', { tujuan: tuj.value }, { ulang: false }); ETL.toast(r.terkirim ? 'Pesan tes terkirim.' : 'Gagal: ' + (r.hasil || ''), r.terkirim ? 'ok' : 'galat'); } catch (e) { ETL.toast(e.pesan || 'Gagal.', 'galat'); } } }, ETL.ikon('kirim', 18), 'Kirim tes')), hasilCek));

      akar.appendChild(blastKartu());
      akar.appendChild(antreanKartu());
    }

    function blastKartu() {
      const kanal = h('select', { class: 'select' }, h('option', { value: 'WA' }, 'WhatsApp'), h('option', { value: 'EMAIL' }, 'Email')), tag = h('input', { class: 'input', placeholder: 'mis. pengumuman (kosong = semua yang setuju)' }),
        pesan = h('textarea', { class: 'textarea', rows: 5, maxlength: 900, placeholder: 'Halo {nama}, … Balas STOP untuk berhenti menerima pesan.' }), info = h('div', { class: 'text-body-sm' });
      const kirim = async (simulasi, btn) => { ETL.tombolMuat(btn, true, 'Memproses…'); try { const r = await ETL.api('wa.blast', { kanal: kanal.value, tag: tag.value, pesan: pesan.value, simulasi }, { ulang: false }); info.textContent = simulasi ? 'Simulasi: ' + r.penerima + ' penerima yang memenuhi syarat (izin YA, tidak opt-out).' : r.masuk_antrean + ' pesan masuk antrean. ' + r.catatan; if (!simulasi) { ETL.toast('Masuk antrean.', 'ok'); muat(); } } catch (e) { info.textContent = e.pesan || 'Gagal.'; } ETL.tombolMuat(btn, false, simulasi ? 'Simulasi' : 'Kirim ke antrean'); };
      const b1 = h('button', { class: 'btn btn-sekunder', onclick: (e) => kirim(true, e.currentTarget) }, 'Simulasi'), b2 = h('button', { class: 'btn btn-utama', onclick: async (e) => { if (!(await ETL.konfirmasi('Kirim pengumuman?', 'Pesan masuk antrean dan dikirim bertahap ke semua kontak CRM yang sudah memberi izin. Pastikan isi pesan sudah benar.', 'Masukkan ke antrean', 'btn-utama'))) return; kirim(false, b2); } }, 'Kirim ke antrean');
      return h('section', { class: 'kartu', style: { display: 'grid', gap: '.8rem' } }, h('h2', { class: 'text-headline-md text-primary' }, 'Pengumuman massal (blast)'), h('div', { class: 'info-kotak' }, 'Hanya ke kontak CRM berizin dan belum opt-out. Pesan wajib memuat kata “STOP”. {nama} diganti nama kontak. Selalu jalankan simulasi lebih dulu.'),
        h('div', { class: 'grid gap-3 md:grid-cols-2' }, medan('Kanal', kanal), medan('Filter tag', tag, null, { opsi: 'opsional' })), medan('Isi pesan', pesan), h('div', { class: 'flex gap-2 flex-wrap' }, b1, b2), info);
    }

    function antreanKartu() {
      const isi = h('div'), f = h('select', { class: 'select', style: { maxWidth: '200px' } }, ['', 'Antri', 'Terkirim', 'Gagal', 'Dilewati', 'Dibatalkan'].map((s) => h('option', { value: s }, s || 'Semua status')));
      async function muatAntre() {
        ETL.kosong(isi); isi.appendChild(ETL.skeleton(3, 48));
        try {
          const d = await ETL.api('notif.antrean', { status: f.value }); ETL.kosong(isi);
          if (!d.items.length) { isi.appendChild(ETL.kosongState('kirim', 'Antrean kosong', 'Belum ada pesan pada status ini.')); return; }
          const aksi = (x) => h('div', { class: 'flex gap-1' }, x.status === 'Antri' ? h('button', { class: 'btn btn-hantu btn-kecil', onclick: () => ubah('notif.batal', x.id) }, 'Batalkan') : null, ['Gagal', 'Dilewati', 'Dibatalkan'].includes(x.status) ? h('button', { class: 'btn btn-sekunder btn-kecil', onclick: () => ubah('notif.ulang', x.id) }, 'Ulangi') : null);
          isi.appendChild(h('div', { class: 'tabel-wrap' }, h('table', { class: 'tabel' }, h('thead', null, h('tr', null, ['Waktu', 'Kanal', 'Tujuan', 'Peristiwa', 'Pesan', 'Status', ''].map((t) => h('th', null, t)))),
            h('tbody', null, d.items.map((x) => h('tr', null, h('td', null, ETL.waktu(x.waktu)), h('td', null, x.kanal), h('td', { class: 'mono' }, x.tujuan), h('td', null, x.event), h('td', { style: { maxWidth: '280px' } }, h('div', { class: 'truncate', title: x.pesan }, x.pesan), x.hasil && x.status !== 'Terkirim' ? h('div', { class: 'text-body-sm text-on-surface-variant' }, x.hasil) : null), h('td', null, h('span', { class: 'badge ' + (STATUS_KELAS[x.status] || 'badge-draft') }, x.status + (x.percobaan ? ' (' + x.percobaan + 'x)' : ''))), h('td', null, aksi(x))))))));
        } catch (e) { ETL.kosong(isi); isi.appendChild(h('div', { class: 'bahaya-kotak' }, e.pesan || 'Gagal.')); }
      }
      async function ubah(a, id) { try { await ETL.api(a, { id }, { ulang: false }); muatAntre(); } catch (e) { ETL.toast(e.pesan || 'Gagal.', 'galat'); } }
      f.addEventListener('change', muatAntre); muatAntre();
      return h('section', { class: 'kartu', style: { display: 'grid', gap: '.8rem' } }, h('div', { class: 'flex items-center justify-between gap-2 flex-wrap' }, h('h2', { class: 'text-headline-md text-primary' }, 'Antrean pengiriman'), h('div', { class: 'flex gap-2' }, f,
        h('button', { class: 'btn btn-primer', onclick: async (e) => { const b = e.currentTarget; ETL.tombolMuat(b, true, 'Memproses…'); try { const r = await ETL.api('notif.proses', {}, { ulang: false }); ETL.toast('Diproses: ' + (r.terkirim || 0) + ' terkirim, ' + (r.gagal || 0) + ' gagal.', 'ok'); muatAntre(); } catch (er) { ETL.toast(er.pesan || 'Gagal.', 'galat'); } ETL.tombolMuat(b, false, 'Proses sekarang'); } }, 'Proses sekarang'))), isi);
    }
    muat();
  } });

  // ═════════════ /crm ═════════════
  ETL.rute('/crm', { layout: 'app', nav: 'crm', judul: 'CRM Kontak', peran: ['Admin'], render: async ({ el }) => {
    const isi = h('div', { class: 'mt-3' }), halaman = h('div', { class: 'flex justify-between items-center mt-3 flex-wrap gap-2' });
    const F = { q: '', izin: '', opt: '', hal: 1 };
    const cari = h('input', { class: 'input', placeholder: 'Cari nama, WA, email, nopol…' }), selI = h('select', { class: 'select' }, h('option', { value: '' }, 'Semua izin'), h('option', { value: 'YA' }, 'Setuju notifikasi'), h('option', { value: 'TIDAK' }, 'Belum setuju')), selO = h('select', { class: 'select' }, h('option', { value: '' }, 'Semua status'), h('option', { value: 'TIDAK' }, 'Aktif'), h('option', { value: 'YA' }, 'Berhenti (opt-out)'));
    cari.addEventListener('input', ETL.debounce(() => { F.q = cari.value; F.hal = 1; muat(); }, 300)); selI.addEventListener('change', () => { F.izin = selI.value; F.hal = 1; muat(); }); selO.addEventListener('change', () => { F.opt = selO.value; F.hal = 1; muat(); });
    async function muat() {
      ETL.kosong(isi); isi.appendChild(ETL.skeleton(4, 60)); ETL.kosong(halaman);
      try {
        const d = await ETL.api('crm.list', { q: F.q, filter: { izin_notif: F.izin, opt_out: F.opt }, halaman: F.hal, per_halaman: 20 }); ETL.kosong(isi);
        if (!d.items.length) { isi.appendChild(ETL.kosongState('grup', 'Belum ada kontak', 'Tambah manual, atau “Sinkron dari penindakan” untuk pemilik yang memberi izin.')); return; }
        const lencanaIzin = (k) => k.opt_out === 'YA' ? h('span', { class: 'badge badge-batal' }, 'Opt-out') : k.izin_notif === 'YA' ? h('span', { class: 'badge badge-ok' }, 'Setuju') : h('span', { class: 'badge badge-draft' }, 'Belum setuju');
        const aksi = (k) => h('div', { class: 'flex gap-1 flex-wrap' }, h('button', { class: 'btn btn-sekunder btn-kecil', onclick: () => form(k) }, ETL.ikon('pensil', 14), 'Ubah'), h('button', { class: 'btn btn-sekunder btn-kecil', onclick: () => riwayat(k) }, ETL.ikon('riwayat', 14), 'Riwayat'),
          h('button', { class: 'btn btn-hantu btn-kecil', onclick: () => optout(k) }, k.opt_out === 'YA' ? 'Aktifkan lagi' : 'Opt-out'), h('button', { class: 'btn btn-hantu btn-kecil', style: { color: 'var(--error)' }, onclick: () => hapus(k) }, ETL.ikon('hapus', 14), 'Hapus'));
        isi.appendChild(h('div', { class: 'hanya-mobile grid gap-2' }, d.items.map((k) => h('div', { class: 'kartu', style: { display: 'grid', gap: '.4rem' } }, h('div', { class: 'flex justify-between gap-2' }, h('div', { class: 'font-semibold text-primary' }, k.nama), lencanaIzin(k)), h('div', { class: 'text-body-sm mono' }, k.wa || '–'), k.email ? h('div', { class: 'text-body-sm' }, k.email) : null, aksi(k)))));
        isi.appendChild(h('div', { class: 'hanya-desktop tabel-wrap kartu', style: { padding: 0 } }, h('table', { class: 'tabel' }, h('thead', null, h('tr', null, ['Kontak', 'WhatsApp', 'Email', 'Sumber', 'Tag', 'Izin', ''].map((t) => h('th', null, t)))),
          h('tbody', null, d.items.map((k) => h('tr', null, h('td', null, h('div', { class: 'flex items-center gap-3' }, h('div', { class: 'avatar' }, ETL.inisial(k.nama)), h('div', null, h('div', { class: 'font-semibold text-primary' }, k.nama), k.nopol_terkait ? h('div', { class: 'text-body-sm text-on-surface-variant' }, k.nopol_terkait) : null))), h('td', { class: 'mono' }, k.wa || '–'), h('td', null, k.email || '–'), h('td', null, k.sumber), h('td', null, k.tag || '–'), h('td', null, lencanaIzin(k)), h('td', null, aksi(k))))))));
        const maks = Math.max(1, Math.ceil(d.total / d.per_halaman));
        halaman.appendChild(h('div', { class: 'text-body-sm text-on-surface-variant' }, d.total + ' kontak • hal. ' + d.halaman + ' / ' + maks));
        halaman.appendChild(h('div', { class: 'flex gap-2' }, h('button', { class: 'btn btn-sekunder btn-kecil', disabled: d.halaman <= 1, onclick: () => { F.hal--; muat(); } }, 'Sebelumnya'), h('button', { class: 'btn btn-sekunder btn-kecil', disabled: d.halaman >= maks, onclick: () => { F.hal++; muat(); } }, 'Berikutnya')));
      } catch (e) { ETL.kosong(isi); isi.appendChild(h('div', { class: 'bahaya-kotak' }, e.pesan || 'Gagal memuat.')); }
    }
    function form(k) {
      const X = { nama: h('input', { class: 'input', maxlength: 100, value: k ? k.nama : '' }), wa: h('input', { class: 'input', inputmode: 'tel', placeholder: k && k.wa ? 'Kosongkan = tidak diubah' : '0812…' }), email: h('input', { class: 'input', type: 'email', value: k ? k.email : '' }), nopol: h('input', { class: 'input', maxlength: 100, value: k ? k.nopol_terkait : '' }), tag: h('input', { class: 'input', maxlength: 80, placeholder: 'pisahkan dengan koma', value: k ? k.tag : '' }), catatan: h('textarea', { class: 'textarea', maxlength: 300 }), izin: h('input', { type: 'checkbox', checked: k ? k.izin_notif === 'YA' : false }) };
      X.catatan.value = k ? k.catatan : '';
      ETL.modal({ judul: k ? 'Ubah kontak' : 'Tambah kontak', isi: [k && k.wa ? h('div', { class: 'info-kotak' }, 'Nomor tersimpan ditampilkan tersamar. Isi kolom WhatsApp hanya bila ingin menggantinya.') : null, medan('Nama', X.nama, null, { wajib: true }), medan('WhatsApp', X.wa), medan('Email', X.email, null, { opsi: 'opsional' }), medan('Nopol terkait', X.nopol, null, { opsi: 'opsional' }), medan('Tag', X.tag, null, { opsi: 'opsional' }), medan('Catatan', X.catatan, null, { opsi: 'opsional' }),
        h('label', { class: 'pilihan' }, X.izin, h('span', null, 'Kontak telah memberi izin menerima notifikasi (dasar pengiriman). Jangan centang tanpa persetujuan yang dapat dibuktikan.'))],
        tombol: [{ teks: 'Batal', kelas: 'btn-sekunder' }, { teks: 'Simpan', kelas: 'btn-primer', onClick: async () => { try {
          const dat = { id: k ? k.id : undefined, nama: X.nama.value, email: X.email.value, nopol_terkait: X.nopol.value, tag: X.tag.value, catatan: X.catatan.value, izin_notif: X.izin.checked ? 'YA' : 'TIDAK' };
          if (X.wa.value.trim()) dat.wa = X.wa.value; else if (k && k.wa) { const p = await ETL.api('crm.list', { q: k.nama, penuh: true, per_halaman: 100 }); const m = p.items.find((i) => i.id === k.id); dat.wa = m ? m.wa : ''; }
          await ETL.api('crm.save', dat, { ulang: false }); ETL.toast('Kontak tersimpan.', 'ok'); muat(); } catch (e) { ETL.toast(e.pesan || 'Gagal.', 'galat'); return false; } } }] });
    }
    async function optout(k) { const v = k.opt_out !== 'YA'; if (v && !(await ETL.konfirmasi('Tandai opt-out?', k.nama + ' tidak akan menerima pesan apa pun lagi.', 'Opt-out', 'btn-utama'))) return; try { await ETL.api('crm.optout', { id: k.id, nilai: v }, { ulang: false }); muat(); } catch (e) { ETL.toast(e.pesan || 'Gagal.', 'galat'); } }
    async function hapus(k) { if (!(await ETL.konfirmasi('Hapus permanen?', 'Kontak ' + k.nama + ' dan seluruh riwayat interaksinya dihapus (hak hapus data pribadi). Tindakan ini tidak dapat dibatalkan.', 'Hapus permanen', 'btn-bahaya'))) return; try { await ETL.api('crm.hapus', { id: k.id }, { ulang: false }); ETL.toast('Kontak dihapus.', 'ok'); muat(); } catch (e) { ETL.toast(e.pesan || 'Gagal.', 'galat'); } }
    async function riwayat(k) {
      const w = h('div', null, ETL.skeleton(3, 40)); ETL.modal({ judul: 'Riwayat — ' + k.nama, isi: w, tombol: [{ teks: 'Tutup', kelas: 'btn-sekunder' }] });
      try { const d = await ETL.api('crm.interaksi', { id: k.id }); ETL.kosong(w); if (!d.interaksi.length) { w.appendChild(ETL.kosongState('riwayat', 'Belum ada interaksi')); return; }
        d.interaksi.forEach((x) => w.appendChild(h('div', { class: 'py-2', style: { borderBottom: '1px solid var(--outline-var)' } }, h('div', { class: 'text-body-sm text-on-surface-variant' }, ETL.waktu(x.waktu) + ' • ' + x.kanal + ' • ' + x.arah + ' • ' + x.status), h('div', { class: 'text-body-md' }, x.isi)))); } catch (e) { ETL.kosong(w); w.appendChild(h('div', { class: 'bahaya-kotak' }, e.pesan || 'Gagal.')); }
    }
    el.appendChild(h('div', null, h('div', { class: 'flex items-end justify-between gap-3 flex-wrap mb-3' }, h('div', null, h('h1', { class: 'text-headline-lg-mobile md:text-headline-lg text-primary' }, 'CRM kontak'), h('p', { class: 'text-body-md text-on-surface-variant' }, 'Daftar kontak yang bersedia menerima informasi. Data pribadi: akses terbatas Admin.')),
      h('div', { class: 'flex gap-2 flex-wrap' }, h('button', { class: 'btn btn-sekunder', onclick: async (e) => { const b = e.currentTarget; ETL.tombolMuat(b, true, 'Menyinkronkan…'); try { const r = await ETL.api('crm.sinkron', {}, { ulang: false }); ETL.toast(r.diproses + ' kasus diproses.', 'ok'); muat(); } catch (er) { ETL.toast(er.pesan || 'Gagal.', 'galat'); } ETL.tombolMuat(b, false, 'Sinkron dari penindakan'); } }, 'Sinkron dari penindakan'), h('button', { class: 'btn btn-primer', onclick: () => form(null) }, ETL.ikon('tambah', 18), 'Tambah kontak'))),
      h('div', { class: 'kartu grid gap-2', style: { gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' } }, cari, selI, selO), isi, halaman));
    muat();
  } });
})();
