/* p-admin.js : W-12 Pengguna, W-13 Master & Pengaturan (+ rahasia, migrasi). */
(function () {
  'use strict';
  const ETL = window.ETL, h = ETL.h, medan = (...a) => ETL.medan(...a);
  const NAMA_PERAN = { Petugas: 'Petugas Lapangan', Pimpinan: 'Pimpinan', Admin: 'Admin Sistem' };

  function tampilPin(judul, nama, pin) {
    ETL.modal({ judul, wajib: true, isi: [h('p', { class: 'text-body-md' }, 'PIN sementara untuk ', h('b', null, nama), ':'),
      h('div', { class: 'mono', style: { fontSize: '2.4rem', fontWeight: 800, letterSpacing: '.3em', textAlign: 'center', padding: '1rem', background: 'var(--surface-low)', borderRadius: '.75rem', color: 'var(--primary)' } }, pin),
      h('div', { class: 'peringatan' }, 'PIN hanya ditampilkan SEKALI dan tidak disimpan dalam bentuk terbaca. Sampaikan langsung kepada yang bersangkutan; PIN wajib diganti saat masuk pertama.')],
      tombol: [{ teks: 'Salin PIN', kelas: 'btn-sekunder', tutup: false, onClick: () => ETL.salin(pin) }, { teks: 'Sudah saya catat', kelas: 'btn-primer' }] });
  }

  // ═════════════ W-12 Pengguna ═════════════
  ETL.rute('/pengguna', { layout: 'app', nav: 'pengguna', judul: 'Pengguna', peran: ['Admin'], render: async ({ el }) => {
    const p = ETL.sesi.profil(), isi = h('div', { class: 'mt-3' }), stat = h('div', { class: 'grid gap-3', style: { gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))' } });
    const F = { q: '', peran: '', status: '' }; let data = [];
    const cari = h('input', { class: 'input', placeholder: 'Cari nama, NIP, atau username…' }), selP = h('select', { class: 'select' }, h('option', { value: '' }, 'Semua peran'), Object.keys(NAMA_PERAN).map((k) => h('option', { value: k }, NAMA_PERAN[k]))), selS = h('select', { class: 'select' }, h('option', { value: '' }, 'Semua status'), h('option', { value: 'YA' }, 'Aktif'), h('option', { value: 'TIDAK' }, 'Nonaktif'), h('option', { value: 'kunci' }, 'Terkunci'));
    cari.addEventListener('input', ETL.debounce(() => { F.q = cari.value.toLowerCase(); gambar(); }, 250)); selP.addEventListener('change', () => { F.peran = selP.value; gambar(); }); selS.addEventListener('change', () => { F.status = selS.value; gambar(); });
    async function muat() { ETL.kosong(isi); isi.appendChild(ETL.skeleton(4, 64)); try { data = (await ETL.api('user.list')).pengguna; gambar(); } catch (e) { ETL.kosong(isi); isi.appendChild(h('div', { class: 'bahaya-kotak' }, e.pesan || 'Gagal memuat.')); } }
    function gambar() {
      ETL.kosong(stat);
      [['Total pengguna', data.length, 'rgba(30,39,97,.08)'], ['Petugas aktif', data.filter((u) => u.peran === 'Petugas' && u.status_aktif === 'YA').length, 'rgba(42,157,79,.12)'], ['Akun terkunci', data.filter((u) => u.terkunci).length, 'rgba(186,26,26,.1)'], ['Pimpinan', data.filter((u) => u.peran === 'Pimpinan').length, 'rgba(85,91,142,.12)']].forEach(([l, n, w]) => { const a = h('div', { class: 'angka' }, '0'); stat.appendChild(h('div', { class: 'kartu stat', style: { '--sv': w } }, h('div', { class: 'text-label-md text-on-surface-variant', style: { textTransform: 'uppercase' } }, l), a)); ETL.hitungNaik(a, n, 600); });
      const l = data.filter((u) => (!F.q || (u.nama + ' ' + u.nip + ' ' + u.username).toLowerCase().includes(F.q)) && (!F.peran || u.peran === F.peran) && (!F.status || (F.status === 'kunci' ? u.terkunci : u.status_aktif === F.status)));
      ETL.kosong(isi); if (!l.length) { isi.appendChild(ETL.kosongState('grup', 'Tidak ada pengguna', 'Ubah pencarian atau tambahkan pengguna baru.')); return; }
      const aksi = (u) => h('div', { class: 'flex gap-1 flex-wrap' }, h('button', { class: 'btn btn-sekunder btn-kecil', onclick: () => formUser(u) }, ETL.ikon('pensil', 14), 'Ubah'), h('button', { class: 'btn btn-sekunder btn-kecil', onclick: () => resetPin(u) }, ETL.ikon('resetKunci', 14), 'Reset PIN'),
        u.id_pengguna !== p.id ? h('button', { class: 'btn btn-kecil ' + (u.status_aktif === 'YA' ? 'btn-hantu' : 'btn-primer'), onclick: () => ubahStatus(u) }, ETL.ikon(u.status_aktif === 'YA' ? 'akunMati' : 'akun', 14), u.status_aktif === 'YA' ? 'Nonaktifkan' : 'Aktifkan') : null);
      const status = (u) => u.terkunci ? h('span', { class: 'badge badge-batal' }, 'Terkunci') : u.status_aktif === 'YA' ? h('span', { class: 'badge badge-ok' }, 'Aktif') : h('span', { class: 'badge badge-draft' }, 'Nonaktif');
      const orang = (u) => h('div', { class: 'flex items-center gap-3' }, h('div', { class: 'avatar' }, ETL.inisial(u.nama)), h('div', null, h('div', { class: 'font-semibold text-primary' }, u.nama), h('div', { class: 'text-body-sm text-on-surface-variant' }, u.nip ? 'NIP ' + u.nip : '–')));
      isi.appendChild(h('div', { class: 'hanya-mobile grid gap-2' }, l.map((u) => h('div', { class: 'kartu', style: { display: 'grid', gap: '.5rem' } }, h('div', { class: 'flex justify-between gap-2' }, orang(u), status(u)), h('div', { class: 'text-body-sm' }, h('span', { class: 'mono' }, u.username), ' • ', NAMA_PERAN[u.peran]), aksi(u)))));
      isi.appendChild(h('div', { class: 'hanya-desktop tabel-wrap kartu', style: { padding: 0 } }, h('table', { class: 'tabel' }, h('thead', null, h('tr', null, ['Personel', 'Username', 'Jabatan', 'Peran', 'Status', 'Login terakhir', ''].map((t) => h('th', null, t)))),
        h('tbody', null, l.map((u) => h('tr', null, h('td', null, orang(u)), h('td', null, h('span', { class: 'mono', style: { background: 'var(--surface-low)', padding: '2px 6px', borderRadius: '4px' } }, u.username)), h('td', null, u.jabatan || '–'), h('td', null, h('span', { class: 'badge badge-peran' }, NAMA_PERAN[u.peran])), h('td', null, status(u)), h('td', null, u.terakhir_login ? ETL.waktu(u.terakhir_login) : '–'), h('td', null, aksi(u))))))));
    }
    function formUser(u) {
      const baru = !u, F2 = { username: h('input', { class: 'input', maxlength: 40, placeholder: 'huruf kecil, angka, titik', disabled: !baru, value: u ? u.username : '' }), nama: h('input', { class: 'input', maxlength: 100, value: u ? u.nama : '' }), nip: h('input', { class: 'input', maxlength: 30, inputmode: 'numeric', value: u ? u.nip : '' }), jabatan: h('input', { class: 'input', maxlength: 80, value: u ? u.jabatan : '' }),
        peran: h('select', { class: 'select' }, Object.keys(NAMA_PERAN).map((k) => h('option', { value: k, selected: u ? u.peran === k : k === 'Petugas' }, NAMA_PERAN[k]))) };
      ETL.modal({ judul: baru ? 'Tambah pengguna' : 'Ubah pengguna', isi: [medan('Username', F2.username, null, { wajib: baru }), medan('Nama lengkap', F2.nama, null, { wajib: true }), medan('NIP', F2.nip, null, { opsi: 'opsional' }), medan('Jabatan / unit', F2.jabatan), medan('Peran', F2.peran, null, { wajib: true }), baru ? h('div', { class: 'info-kotak' }, 'PIN sementara dibuat otomatis dan ditampilkan sekali setelah disimpan.') : null],
        tombol: [{ teks: 'Batal', kelas: 'btn-sekunder' }, { teks: 'Simpan', kelas: 'btn-primer', onClick: async () => {
          try { const r = await ETL.api('user.save', { id_pengguna: u ? u.id_pengguna : undefined, username: F2.username.value, nama: F2.nama.value, nip: F2.nip.value, jabatan: F2.jabatan.value, peran: F2.peran.value }, { ulang: false }); ETL.toast('Pengguna tersimpan.', 'ok'); muat(); if (r.pin_sementara) setTimeout(() => tampilPin('PIN sementara', F2.nama.value, r.pin_sementara), 250); } catch (e) { ETL.toast(e.pesan || 'Gagal.', 'galat'); return false; } } }] });
    }
    async function resetPin(u) { if (!(await ETL.konfirmasi('Reset PIN?', 'PIN lama ' + u.nama + ' tidak berlaku lagi dan semua sesi aktifnya diakhiri.', 'Reset PIN', 'btn-primer'))) return; try { const r = await ETL.api('user.resetPin', { id_pengguna: u.id_pengguna }, { ulang: false }); muat(); tampilPin('PIN direset', u.nama, r.pin_sementara); } catch (e) { ETL.toast(e.pesan || 'Gagal.', 'galat'); } }
    async function ubahStatus(u) { const non = u.status_aktif === 'YA'; if (non && !(await ETL.konfirmasi('Nonaktifkan akun?', u.nama + ' tidak dapat masuk dan sesinya diakhiri. Riwayat kasus tetap tersimpan.', 'Nonaktifkan', 'btn-bahaya'))) return; try { await ETL.api('user.setStatus', { id_pengguna: u.id_pengguna, aktif: !non }, { ulang: false }); ETL.toast(non ? 'Akun dinonaktifkan.' : 'Akun diaktifkan.', 'ok'); muat(); } catch (e) { ETL.toast(e.pesan || 'Gagal.', 'galat'); } }
    el.appendChild(h('div', null, h('div', { class: 'flex items-end justify-between gap-3 flex-wrap mb-3' }, h('div', null, h('h1', { class: 'text-headline-lg-mobile md:text-headline-lg text-primary' }, 'Manajemen pengguna'), h('p', { class: 'text-body-md text-on-surface-variant' }, 'Kelola akun, peran, dan pemulihan PIN personel.')), h('button', { class: 'btn btn-primer', onclick: () => formUser(null) }, ETL.ikon('tambah', 18), 'Tambah pengguna')),
      stat, h('div', { class: 'kartu mt-3 grid gap-2', style: { gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' } }, cari, selP, selS), isi,
      h('div', { class: 'info-kotak mt-3' }, h('b', null, 'Kebijakan keamanan: '), 'akun terkunci otomatis setelah beberapa kali salah PIN (diatur di Pengaturan). PIN disimpan sebagai hash bergaram.')));
    muat();
  } });

  // ═════════════ W-13 Master & Pengaturan ═════════════
  const GRUP_SET = [['Instansi & surat', ['nama_dinas', 'nama_aplikasi', 'kop_alamat', 'pejabat_nama', 'pejabat_nip', 'pejabat_jabatan', 'format_nomor_surat', 'url_cek']], ['Keamanan akun', ['pin_maks_salah', 'kunci_menit', 'sesi_jam']], ['Tombol WhatsApp publik', ['wa_chat_nomor', 'wa_chat_pesan']]];
  const LABEL_SET = { nama_dinas: 'Nama dinas (kop)', nama_aplikasi: 'Nama aplikasi', kop_alamat: 'Alamat pada kop', pejabat_nama: 'Nama pejabat penandatangan', pejabat_nip: 'NIP pejabat', pejabat_jabatan: 'Jabatan pejabat', format_nomor_surat: 'Format nomor surat', url_cek: 'URL halaman Cek Status (untuk QR & pesan)', pin_maks_salah: 'Salah PIN maksimum', kunci_menit: 'Lama akun terkunci (menit)', sesi_jam: 'Masa sesi (jam, maks. 6)', wa_chat_nomor: 'Nomor WhatsApp chat (62812…)', wa_chat_pesan: 'Pesan awal chat' };

  ETL.rute('/master', { layout: 'app', nav: 'master', judul: 'Master & Pengaturan', peran: ['Admin'], render: async ({ el }) => {
    const tabs = [['jenis', 'Jenis pelanggaran'], ['set', 'Pengaturan'], ['rahasia', 'Rahasia & integrasi'], ['impor', 'Migrasi data']], isi = h('div', { class: 'mt-3' }); let aktif = 'jenis';
    const bar = h('div', { class: 'flex gap-2 flex-wrap' });
    function gambarTab() { ETL.kosong(bar); tabs.forEach(([k, l]) => bar.appendChild(h('button', { class: 'chip' + (k === aktif ? ' aktif' : ''), onclick: () => { aktif = k; gambarTab(); tampil(); } }, l))); }
    function tampil() { ETL.kosong(isi); ({ jenis: tabJenis, set: tabSet, rahasia: tabRahasia, impor: tabImpor })[aktif](isi); }
    el.appendChild(h('div', null, h('h1', { class: 'text-headline-lg-mobile md:text-headline-lg text-primary' }, 'Master pelanggaran & pengaturan'), h('p', { class: 'text-body-md text-on-surface-variant mb-3' }, 'Semua perubahan tercatat di log audit.'), bar, isi));
    gambarTab(); tampil();
  } });

  async function tabJenis(wadah) {
    wadah.appendChild(ETL.skeleton(4, 60));
    const muat = async () => {
      let d; try { d = await ETL.api('master.list'); } catch (e) { ETL.kosong(wadah); wadah.appendChild(h('div', { class: 'bahaya-kotak' }, e.pesan)); return; }
      ETL.kosong(wadah);
      wadah.appendChild(h('div', { class: 'peringatan mb-3' }, 'Rujukan pasal dan sanksi bersumber dari teks Perda Balikpapan No. 7 Tahun 2022 (Ps. 168-177). Uraian adalah ringkasan dan besaran uang berasal dari ekstraksi teks PDF, jadi ', h('b', null, 'perlu verifikasi Bagian Hukum'), '. Hanya pelanggaran terkait kendaraan yang dimuat. Jenis yang hanya berpidana nonaktif bawaan. Pilihan sanksi dipilih petugas per kasus.'));
      wadah.appendChild(h('div', { class: 'flex justify-end mb-2' }, h('button', { class: 'btn btn-primer', onclick: () => form(null) }, ETL.ikon('tambah', 18), 'Tambah jenis')));
      wadah.appendChild(h('div', { class: 'tabel-wrap kartu', style: { padding: 0 } }, h('table', { class: 'tabel' }, h('thead', null, h('tr', null, ['Kategori', 'Uraian & dasar', 'Pilihan sanksi & dasar', 'Bukti uji', 'Aktif', ''].map((t) => h('th', null, t)))),
        h('tbody', null, d.jenis.map((j) => h('tr', null, h('td', null, j.kategori), h('td', { style: { minWidth: '260px' } }, h('div', { class: 'font-semibold' }, j.uraian), h('div', { class: 'text-body-sm text-on-surface-variant' }, j.pasal_perda), j.catatan ? h('div', { class: 'text-body-sm', style: { color: '#92400e' } }, j.catatan) : null), h('td', { style: { minWidth: '240px' } }, (j.opsi && j.opsi.length) ? h('div', { class: 'flex gap-1 flex-wrap mb-1' }, j.opsi.map((o) => h('span', { class: 'badge badge-peran' }, o))) : h('div', { class: 'text-body-sm text-on-surface-variant mb-1' }, 'Tanpa pilihan sanksi'), j.sanksi ? h('div', { class: 'text-body-sm' }, j.sanksi) : h('span', { class: 'text-on-surface-variant' }, '(belum diisi)')), h('td', null, j.perlu_bukti_uji === 'YA' ? h('span', { class: 'badge badge-tl' }, 'Wajib') : '–'),
          h('td', null, h('label', { class: 'sakelar', 'aria-label': 'Aktif' }, h('input', { type: 'checkbox', checked: j.aktif === 'YA', onchange: async (e) => { try { await ETL.api('master.toggle', { id: j.id, aktif: e.target.checked }, { ulang: false }); ETL.toast('Diperbarui.', 'ok'); } catch (er) { e.target.checked = !e.target.checked; ETL.toast(er.pesan, 'galat'); } } }), h('span'))), h('td', null, h('button', { class: 'btn btn-sekunder btn-kecil', onclick: () => form(j) }, ETL.ikon('pensil', 14), 'Ubah'))))))));
    };
    function form(j) {
      const F = { kategori: h('input', { class: 'input', value: j ? j.kategori : '', maxlength: 60 }), uraian: h('textarea', { class: 'textarea', maxlength: 300 }), pasal_perda: h('input', { class: 'input', value: j ? j.pasal_perda : '', maxlength: 120 }), sanksi: h('textarea', { class: 'textarea', maxlength: 1000, placeholder: 'Isi sesuai Bab Sanksi Perda (tanpa menebak nominal)' }), catatan: h('textarea', { class: 'textarea', maxlength: 600, value: j ? j.catatan : '' }), opsi: h('textarea', { class: 'textarea', rows: 5, maxlength: 700, placeholder: 'Satu pilihan per baris, mis.\nPenempelan stiker\nPenguncian/penggembokan ban' }), uji: h('input', { type: 'checkbox', checked: j ? j.perlu_bukti_uji === 'YA' : false }) };
      F.uraian.value = j ? j.uraian : ''; F.sanksi.value = j ? j.sanksi : ''; F.catatan.value = j ? j.catatan : ''; F.opsi.value = j ? (j.opsi || []).join('\n') : '';
      ETL.modal({ judul: j ? 'Ubah jenis pelanggaran' : 'Tambah jenis pelanggaran', lebar: 'lebar', isi: [medan('Kategori', F.kategori, null, { wajib: true }), medan('Uraian pelanggaran', F.uraian, null, { wajib: true }), medan('Dasar (pasal Perda)', F.pasal_perda), medan('Dasar sanksi (teks Perda)', F.sanksi), medan('Pilihan sanksi (dipilih petugas, satu per baris; kosongkan bila tidak ada)', F.opsi), medan('Catatan', F.catatan, null, { opsi: 'opsional' }), h('label', { class: 'pilihan' }, F.uji, h('span', null, 'Wajib bukti uji (nomor, masa berlaku, dan foto bukti uji)'))],
        tombol: [{ teks: 'Batal', kelas: 'btn-sekunder' }, { teks: 'Simpan', kelas: 'btn-primer', onClick: async () => { try { await ETL.api('master.save', { id: j ? j.id : undefined, kategori: F.kategori.value, uraian: F.uraian.value, pasal_perda: F.pasal_perda.value, sanksi: F.sanksi.value, opsi_sanksi: F.opsi.value, catatan: F.catatan.value, perlu_bukti_uji: F.uji.checked ? 'YA' : 'TIDAK' }, { ulang: false }); ETL.toast('Tersimpan.', 'ok'); ETL.simpan.del('etl_swr_master.jenis_{}'); muat(); } catch (e) { ETL.toast(e.pesan || 'Gagal.', 'galat'); return false; } } }] });
    }
    muat();
  }

  async function tabSet(wadah) {
    wadah.appendChild(ETL.skeleton(3, 100));
    let d; try { d = await ETL.api('setting.get'); } catch (e) { ETL.kosong(wadah); wadah.appendChild(h('div', { class: 'bahaya-kotak' }, e.pesan)); return; }
    ETL.kosong(wadah); const nilai = {}; d.pengaturan.forEach((s) => { nilai[s.kunci] = s.nilai; }); const inp = {};
    GRUP_SET.forEach(([judul, kunci]) => wadah.appendChild(h('section', { class: 'kartu mb-3', style: { display: 'grid', gap: '.8rem' } }, h('h2', { class: 'text-headline-md text-primary' }, judul), h('div', { class: 'grid gap-3 md:grid-cols-2' }, kunci.map((k) => { inp[k] = k === 'wa_chat_pesan' ? h('textarea', { class: 'textarea', maxlength: 300 }) : h('input', { class: 'input', maxlength: 300 }); inp[k].value = nilai[k] || ''; return medan(LABEL_SET[k], inp[k], null, { bantuan: (d.pengaturan.find((s) => s.kunci === k) || {}).ket }); })))));
    const btn = h('button', { class: 'btn btn-utama', onclick: async () => { const ubah = {}; Object.keys(inp).forEach((k) => { if (inp[k].value !== (nilai[k] || '')) ubah[k] = inp[k].value; }); if (!Object.keys(ubah).length) { ETL.toast('Tidak ada perubahan.', 'info'); return; } ETL.tombolMuat(btn, true, 'Menyimpan…'); try { await ETL.api('setting.save', { pengaturan: ubah }, { ulang: false }); ETL.toast('Pengaturan tersimpan.', 'ok'); ETL.simpan.del('etl_cfg'); Object.assign(nilai, ubah); ETL.config(); } catch (e) { ETL.toast(e.pesan || 'Gagal.', 'galat'); } ETL.tombolMuat(btn, false, 'Simpan pengaturan'); } }, 'Simpan pengaturan');
    wadah.appendChild(btn);
  }

  async function tabRahasia(wadah) {
    wadah.appendChild(ETL.skeleton(3, 80));
    const muat = async () => {
      let d; try { d = await ETL.api('rahasia.status'); } catch (e) { ETL.kosong(wadah); wadah.appendChild(h('div', { class: 'bahaya-kotak' }, e.pesan)); return; }
      ETL.kosong(wadah);
      wadah.appendChild(h('div', { class: 'info-kotak mb-3' }, 'Semua rahasia disimpan di ', h('b', null, 'Script Properties'), ' Apps Script, bukan di kode, Sheets, atau browser. Nilai yang sudah tersimpan tidak pernah ditampilkan kembali.'));
      const baris = (k, label, ubah, ket) => { const inpt = ubah ? h('input', { class: 'input', type: 'password', autocomplete: 'off', placeholder: d.rahasia[k].terisi ? 'Isi untuk mengganti' : 'Belum diisi' }) : null;
        return h('div', { class: 'kartu', style: { display: 'grid', gap: '.5rem' } }, h('div', { class: 'flex items-center justify-between gap-2' }, h('div', { class: 'font-semibold text-primary' }, label), d.rahasia[k].terisi ? h('span', { class: 'badge badge-ok' }, 'Terisi: ' + d.rahasia[k].tampilan) : h('span', { class: 'badge badge-draft' }, 'Belum diisi')), ket ? h('div', { class: 'text-body-sm text-on-surface-variant' }, ket) : null,
          ubah ? h('div', { class: 'flex gap-2' }, inpt, h('button', { class: 'btn btn-primer', onclick: async () => { if (!inpt.value.trim()) return; try { await ETL.api('rahasia.simpan', { kunci: k, nilai: inpt.value }, { ulang: false }); ETL.toast(label + ' tersimpan.', 'ok'); muat(); } catch (e) { ETL.toast(e.pesan || 'Gagal.', 'galat'); } } }, 'Simpan')) : null); };
      wadah.appendChild(h('div', { class: 'grid gap-3 md:grid-cols-2' }, baris('FONNTE_TOKEN', 'Token Fonnte (WhatsApp)', true, 'Dari dashboard Fonnte. Diperlukan untuk modul notifikasi.'), baris('WEBHOOK_SECRET', 'Rahasia webhook WhatsApp', true, 'Dipakai pada URL webhook ?aksi=webhook&k=… (opt-out STOP).'), baris('EMAIL_ADMIN', 'Email admin (peringatan)', true, 'Menerima peringatan akun terkunci, gagal kirim, dan cadangan.'), baris('ID_FOLDER_CADANGAN', 'Folder cadangan Drive', true, 'Dibuat otomatis saat cadangan pertama bila kosong.'),
        baris('ID_DB', 'Spreadsheet database', false, 'Diatur oleh setupAwal().'), baris('ID_LOG', 'Spreadsheet log', false), baris('ID_FOLDER', 'Folder Drive foto bukti', false), baris('SESSION_SECRET', 'Kunci sesi (HMAC)', false, 'Dibuat otomatis. Tidak dapat dibaca.'), baris('PIN_PEPPER', 'Pepper PIN', false, 'Dibuat otomatis. Tidak dapat diputar (akan menggugurkan semua PIN).')));
      wadah.appendChild(h('div', { class: 'kartu mt-3 flex items-center justify-between gap-3 flex-wrap' }, h('div', null, h('div', { class: 'font-semibold text-primary' }, 'Putar kunci sesi'), h('div', { class: 'text-body-sm text-on-surface-variant' }, 'Mengakhiri semua sesi aktif (termasuk Anda). Pakai bila dicurigai ada token bocor.')), h('button', { class: 'btn btn-bahaya', onclick: async () => { if (!(await ETL.konfirmasi('Putar kunci sesi?', 'Semua pengguna harus masuk kembali.', 'Putar sekarang', 'btn-bahaya'))) return; try { await ETL.api('rahasia.putar', {}, { ulang: false }); } catch (e) { ETL.toast(e.pesan, 'galat'); } } }, ETL.ikon('kunci', 18), 'Putar sekarang')));
    };
    muat();
  }

  function tabImpor(wadah) {
    const id = h('input', { class: 'input mono', placeholder: 'ID spreadsheet lama (dari URL …/d/<ID>/edit)', autocomplete: 'off' }), hasil = h('div', { class: 'mt-3' }), mode = h('select', { class: 'select' }, h('option', { value: 'tambah' }, 'Tambah data baru saja (aman)'), h('option', { value: 'upsert' }, 'Tambah + perbarui yang sudah ada'));
    wadah.appendChild(h('div', { class: 'grid gap-3' }, h('div', { class: 'info-kotak' }, 'Impor dari database lama ke skema baru. Kolom dicocokkan lewat nama header. Aman diulang (upsert per kunci alami). ', h('b', null, 'Selalu pindai dulu'), '. Data pengguna tidak diimpor karena hash PIN tidak portabel; foto di Drive tidak disalin. Pastikan akun pemilik script punya akses ke spreadsheet lama.'),
      h('div', { class: 'kartu', style: { display: 'grid', gap: '.8rem' } }, medan('ID spreadsheet sumber', id), medan('Mode impor', mode), h('button', { class: 'btn btn-primer', id: 'btn-pindai', onclick: async (e) => { const b = e.currentTarget; ETL.tombolMuat(b, true, 'Memindai…'); ETL.kosong(hasil); try { const d = await ETL.api('import.scan', { id_sumber: id.value }, { ulang: false, timeout: 120000 }); gambar(d); } catch (er) { hasil.appendChild(h('div', { class: 'bahaya-kotak' }, er.pesan || 'Gagal memindai.')); } ETL.tombolMuat(b, false, 'Pindai (dry-run)'); } }, 'Pindai (dry-run)')), hasil));
    function gambar(d) {
      ETL.kosong(hasil);
      Object.keys(d.sumber).forEach((nama) => { const s = d.sumber[nama], prog = h('div', { class: 'text-body-sm' });
        hasil.appendChild(h('div', { class: 'kartu mb-2', style: { display: 'grid', gap: '.4rem' } }, h('div', { class: 'flex items-center justify-between gap-2 flex-wrap' }, h('div', { class: 'font-semibold text-primary' }, nama), s.ada ? h('button', { class: 'btn btn-utama btn-kecil', disabled: !s.baru && mode.value === 'tambah', onclick: (e) => jalan(nama, e.currentTarget, prog) }, ETL.ikon('impor', 16), 'Impor') : h('span', { class: 'badge badge-draft' }, 'Sheet tidak ada')),
          s.ada ? h('div', { class: 'text-body-sm' }, s.total + ' baris • ', h('b', null, s.baru + ' baru'), ' • ' + s.sudah_ada + ' sudah ada • ' + s.tanpa_kunci + ' tanpa kunci') : null, s.ada && s.kolom_tak_ditemukan.length ? h('div', { class: 'text-body-sm text-on-surface-variant' }, 'Kolom tidak ditemukan di sumber: ' + s.kolom_tak_ditemukan.join(', ')) : null, prog)); });
      (d.catatan || []).forEach((c) => hasil.appendChild(h('div', { class: 'text-body-sm text-on-surface-variant' }, '• ' + c)));
    }
    async function jalan(nama, btn, prog) {
      if (!(await ETL.konfirmasi('Mulai impor ' + nama + '?', 'Data ditambahkan ke database aktif. Proses dapat diulang dengan aman.', 'Mulai impor', 'btn-utama'))) return;
      btn.disabled = true; let mulai = 0, baru = 0, ubah = 0;
      try { for (;;) { const r = await ETL.api('import.run', { id_sumber: id.value, sheet: nama, mulai, batas: 300, mode: mode.value }, { ulang: false, timeout: 120000 }); baru += r.baru; ubah += r.diubah; prog.textContent = Math.min(r.berikut, r.total) + ' / ' + r.total + ' baris diproses • ' + baru + ' baru • ' + ubah + ' diperbarui'; if (r.selesai) break; mulai = r.berikut; } ETL.toast('Impor ' + nama + ' selesai.', 'ok'); }
      catch (e) { ETL.toast(e.pesan || 'Impor berhenti.', 'galat'); prog.textContent += ' — berhenti: ' + (e.pesan || ''); }
      btn.disabled = false;
    }
  }
})();