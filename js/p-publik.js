/* p-publik.js : W-01 Cek Status Surat, W-02 Login, W-03 Ganti PIN. */
(function () {
  'use strict';
  const ETL = window.ETL, h = ETL.h;

  function tombolMuat(btn, aktif, teks) {
    btn.disabled = aktif; ETL.kosong(btn);
    if (aktif) btn.appendChild(h('span', { class: 'spin' })); btn.appendChild(document.createTextNode(teks));
  }
  function medan(label, input, galatEl, opsi) {
    return h('div', null, h('label', { class: 'label', for: input.id }, label, opsi && opsi.wajib ? h('span', { class: 'wajib' }, ' *') : null, opsi && opsi.opsi ? h('span', { class: 'opsi' }, ' (' + opsi.opsi + ')') : null), input, galatEl || null, opsi && opsi.bantuan ? h('div', { class: 'bantuan' }, opsi.bantuan) : null);
  }
  ETL.medan = medan; ETL.tombolMuat = tombolMuat;

  // ═════════════ W-01 Cek status ═════════════
  const LANGKAH = [['Terbit', 'Surat terbit', 'berkas'], ['Tindak Lanjut', 'Tindak lanjut', 'palu'], ['Selesai', 'Selesai', 'centangKecil']];
  function hasilCek(d) {
    const idx = Math.max(0, LANGKAH.findIndex((l) => l[0] === d.status)), batal = d.status === 'Dibatalkan';
    const grid = h('div', { class: 'langkah-status' + (batal ? ' batal' : ''), style: { gridTemplateColumns: 'repeat(3,1fr)' } },
      LANGKAH.map((l, i) => h('div', { class: 'lk ' + (batal ? (i === 0 ? 'kini' : '') : i < idx ? 'sudah' : i === idx ? (d.status === 'Selesai' ? 'sudah' : 'kini') : '') },
        h('div', { class: 'bulat' }, batal && i === 0 ? ETL.ikon('tutup', 18) : (i < idx || (i === idx && d.status === 'Selesai')) ? ETL.ikon('centangKecil', 18) : String(i + 1)), l[1])));
    return h('section', { class: 'kartu reveal', 'aria-live': 'polite' },
      h('div', { class: 'flex items-center justify-between flex-wrap gap-2' }, h('div', { class: 'bagian-nomor' }, 'Status perkara'), ETL.lencana(d.status)),
      h('div', { class: 'text-headline-md text-primary mt-1' }, batal ? 'Surat dibatalkan' : d.status === 'Selesai' ? 'Perkara selesai' : d.status === 'Tindak Lanjut' ? 'Sedang dalam tindak lanjut' : 'Surat aktif'),
      h('p', { class: 'text-body-md text-on-surface-variant mb-3' }, d.keterangan), grid,
      h('div', { class: 'kartu', style: { background: 'var(--surface-low)', boxShadow: 'none' } },
        [['Nomor surat', d.nomor_surat], ['Tanggal terbit', ETL.tgl(d.tanggal, true)], ['Jenis pelanggaran', d.jenis], ['Lokasi (tingkat jalan)', d.lokasi || '–']].map(([k, v]) =>
          h('div', { class: 'flex justify-between gap-3 py-2', style: { borderBottom: '1px solid #e3e5ea' } }, h('span', { class: 'text-body-sm text-on-surface-variant' }, k), h('span', { class: 'text-body-md font-semibold text-right' }, v)))));
  }
  const FAQ = [
    ['Mengapa saya harus mengisi nomor polisi juga?', 'Agar surat orang lain tidak dapat ditelusuri sembarangan. Nomor surat dan nomor polisi harus cocok.'],
    ['Data apa yang ditampilkan?', 'Hanya status surat, jenis pelanggaran, tanggal, dan lokasi setingkat jalan. Nama dan alamat tidak ditampilkan.'],
    ['Surat saya tidak ditemukan, apa yang harus dilakukan?', 'Periksa kembali nomor surat pada lembar fisik (termasuk garis miring dan angka nol di depan). Jika tetap tidak ditemukan, hubungi Dishub lewat tombol WhatsApp.']
  ];
  ETL.rute('/cek', { publik: true, judul: 'Cek Status Surat', render: async ({ el, query }) => {
    const nomor = h('input', { class: 'input', id: 'in-nomor', placeholder: 'Contoh: 0012/ETL/DISHUB/X/2026', autocomplete: 'off', autocapitalize: 'characters', value: query.no || '' });
    const nopol = h('input', { class: 'input input-plat', id: 'in-nopol', placeholder: 'KT 8421 LQ', autocomplete: 'off', autocapitalize: 'characters', maxlength: 12 });
    const galat = h('div', { class: 'galat-teks', role: 'alert' }), hasil = h('div', { class: 'mt-4' });
    const btn = h('button', { class: 'btn btn-primer btn-blok', type: 'submit' }, ETL.ikon('cari', 20), 'Periksa Status Surat');
    const form = h('form', { class: 'kartu', style: { display: 'grid', gap: '.9rem' }, onsubmit: async (e) => {
      e.preventDefault(); ETL.kosong(hasil); galat.textContent = '';
      if (!nomor.value.trim() || !nopol.value.trim()) { galat.textContent = 'Isi nomor surat dan nomor polisi.'; return; }
      tombolMuat(btn, true, 'Memeriksa…');
      try { const d = await ETL.api('publik.cek', { nomor_surat: nomor.value, nopol: nopol.value }, { publik: true, ulang: false }); hasil.appendChild(hasilCek(d)); ETL.munculSaatTergulir(hasil); hasil.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      catch (er) { galat.textContent = er.pesan || 'Gagal memeriksa.'; nopol.classList.add('salah'); setTimeout(() => nopol.classList.remove('salah'), 600); }
      tombolMuat(btn, false, ' Periksa Status Surat'); btn.prepend(ETL.ikon('cari', 20));
    } },
      h('div', { class: 'flex items-center gap-2 text-primary' }, ETL.ikon('cari', 22), h('h2', { class: 'text-headline-md' }, 'Formulir pencarian')),
      medan('Nomor surat penindakan', nomor, null, { wajib: true }), medan('Nomor polisi kendaraan', nopol, null, { wajib: true }), galat,
      h('div', { class: 'info-kotak flex gap-2' }, ETL.ikon('perisaiKunci', 20), h('span', null, 'Data pribadi (nama, alamat) tidak ditampilkan di halaman ini, sesuai ketentuan pelindungan data pribadi.')), btn);
    const faq = h('section', { class: 'kartu reveal mt-4' }, h('h2', { class: 'text-headline-md text-primary mb-2' }, 'Pertanyaan umum'),
      FAQ.map(([q, a]) => { const det = h('details', { style: { borderTop: '1px solid #eceef2', padding: '.7rem 0' } }, h('summary', { class: 'font-semibold cursor-pointer text-primary' }, q), h('p', { class: 'text-body-md text-on-surface-variant mt-2' }, a)); return det; }));
    const panduan = h('section', { class: 'kartu reveal mt-4' }, h('h2', { class: 'text-headline-md text-primary mb-2' }, 'Arti status'),
      [['Terbit', 'badge-terbit', 'Surat sudah diterbitkan petugas.'], ['Tindak Lanjut', 'badge-tl', 'Dishub sedang memproses (teguran/panggilan).'], ['Selesai', 'badge-selesai', 'Perkara telah diselesaikan.'], ['Dibatalkan', 'badge-batal', 'Surat dibatalkan oleh Dishub setelah verifikasi.']].map(([n, k, t]) =>
        h('div', { class: 'flex items-start gap-3 py-2' }, h('span', { class: 'badge ' + k, style: { minWidth: '96px', justifyContent: 'center' } }, n), h('span', { class: 'text-body-md text-on-surface-variant' }, t))));
    el.appendChild(h('div', null,
      h('header', { class: 'hero' }, h('div', { class: 'perisai-hero' }, ETL.ikon('perisai', 190)),
        h('div', { class: 'flex items-center justify-between px-4 py-3', style: { position: 'relative', maxWidth: '980px', margin: '0 auto' } },
          h('div', { class: 'flex items-center gap-2' }, ETL.logo(36), h('div', null, h('div', { class: 'font-bold', style: { lineHeight: 1.1 } }, ETL_CONFIG.NAMA_APP), h('div', { style: { fontSize: '.72rem', color: '#bbc3ff' } }, 'Kota Balikpapan'))),
          h('a', { href: '#/login', class: 'btn btn-sekunder btn-kecil' }, ETL.ikon('akun', 16), 'Login petugas')),
        h('div', { class: 'px-4 pt-6 pb-16', style: { position: 'relative', maxWidth: '980px', margin: '0 auto' } },
          h('span', { class: 'badge', style: { background: 'rgba(255,255,255,.15)', color: '#fff' } }, 'Layanan transparansi publik'),
          h('h1', { class: 'text-headline-lg-mobile md:text-headline-lg mt-3', style: { maxWidth: '640px' } }, 'Cek status surat penindakan kendaraan'),
          h('p', { class: 'mt-2', style: { color: '#c9cdf3', maxWidth: '560px' } }, 'Periksa status surat penindakan Dishub Kota Balikpapan tanpa perlu datang ke kantor.'))),
      h('div', { class: 'px-4 pb-24', style: { maxWidth: '640px', margin: '-3rem auto 0', position: 'relative' } }, form, hasil, panduan, faq,
        h('footer', { class: 'text-center text-body-sm text-on-surface-variant mt-6' }, ETL_CONFIG.NAMA_INSTANSI + ' • Portal layanan tanpa antrean'))));
    if (query.no) nopol.focus();
  } });

  // ═════════════ W-02 Login ═════════════
  ETL.rute('/login', { publik: true, judul: 'Masuk', render: async ({ el }) => {
    if (ETL.sesi.ada()) { location.replace(ETL.beranda()); return; }
    const user = h('input', { class: 'input', id: 'in-user', autocomplete: 'username', autocapitalize: 'none', spellcheck: false, placeholder: 'contoh: ridwan.dalops' });
    const pin = h('input', { class: 'input', id: 'in-pin', type: 'password', inputmode: 'numeric', pattern: '[0-9]*', maxlength: 6, autocomplete: 'current-password', placeholder: '••••••', style: { letterSpacing: '.35em', fontWeight: 700 } });
    const titik = h('div', { class: 'titik-pin', 'aria-hidden': 'true' }, Array.from({ length: 6 }, () => h('i')));
    pin.addEventListener('input', () => { pin.value = pin.value.replace(/\D/g, '').slice(0, 6); [...titik.children].forEach((t, i) => t.classList.toggle('isi', i < pin.value.length)); });
    const mata = h('button', { type: 'button', class: 'ikon-btn', 'aria-label': 'Tampilkan PIN', style: { position: 'absolute', right: '.3rem', top: '.4rem', color: '#767681' }, onclick: () => { const s = pin.type === 'password'; pin.type = s ? 'text' : 'password'; ETL.kosong(mata); mata.appendChild(ETL.ikon(s ? 'mataCoret' : 'mata', 20)); } }, ETL.ikon('mata', 20));
    const galat = h('div', { class: 'bahaya-kotak', role: 'alert', style: { display: 'none' } });
    const btn = h('button', { class: 'btn btn-primer btn-blok', type: 'submit' }, 'Masuk ke akun');
    const form = h('form', { class: 'kartu', style: { display: 'grid', gap: '1rem', padding: '1.4rem' }, onsubmit: async (e) => {
      e.preventDefault(); galat.style.display = 'none';
      if (!user.value.trim() || pin.value.length !== 6) { galat.textContent = 'Isi username dan PIN 6 angka.'; galat.style.display = 'block'; return; }
      tombolMuat(btn, true, 'Memeriksa…');
      try {
        const d = await ETL.api('auth.login', { username: user.value.trim(), pin: pin.value }, { publik: true, ulang: false });
        ETL.sesi.set(d.token, d.profil); pin.value = '';
        location.hash = d.profil.wajib_ganti_pin ? '#/ganti-pin' : ETL.beranda();
      } catch (er) { galat.textContent = er.pesan || 'Gagal masuk.'; galat.style.display = 'block'; pin.value = ''; pin.dispatchEvent(new Event('input')); pin.focus(); tombolMuat(btn, false, 'Masuk ke akun'); }
    } },
      medan('Username', h('div', { class: 'ikon-di-input' }, ETL.ikon('akun', 20), user)), medan('PIN (6 angka)', h('div', { style: { position: 'relative' } }, pin, mata), titik), galat, btn,
      h('p', { class: 'text-body-sm text-on-surface-variant text-center' }, 'Lupa PIN atau akun terkunci? Hubungi Admin Dishub.'));
    el.appendChild(h('div', { class: 'min-h-screen', style: { background: 'linear-gradient(180deg, #e8eaff, var(--surface) 40%)' } },
      h('div', { style: { maxWidth: '420px', margin: '0 auto', padding: '2.2rem 1rem 3rem' } },
        h('div', { class: 'flex flex-col items-center text-center gap-2 mb-5' }, ETL.logo(64), h('span', { class: 'badge badge-peran' }, 'Portal resmi Dishub'), h('h1', { class: 'text-headline-lg-mobile text-primary' }, 'Masuk ke ' + ETL_CONFIG.NAMA_APP),
          h('p', { class: 'text-body-md text-on-surface-variant' }, ETL_CONFIG.NAMA_INSTANSI + ' — penindakan pelanggaran lalu lintas dan angkutan jalan')),
        form, h('div', { class: 'text-center mt-4' }, h('a', { href: '#/cek', class: 'btn btn-hantu btn-kecil' }, ETL.ikon('cari', 16), 'Cek status surat (untuk warga)')))));
    setTimeout(() => user.focus(), 100);
  } });

  // ═════════════ W-03 Ganti PIN ═════════════
  ETL.rute('/ganti-pin', { judul: 'Ganti PIN', render: async ({ el }) => {
    const p = ETL.sesi.profil(), wajib = !!p.wajib_ganti_pin;
    const mk = (id, ph) => h('input', { class: 'input', id, type: 'password', inputmode: 'numeric', maxlength: 6, placeholder: ph, autocomplete: 'off', style: { letterSpacing: '.3em', fontWeight: 700 } });
    const lama = mk('pin-lama', '••••••'), baru = mk('pin-baru', '••••••'), ulang = mk('pin-ulang', '••••••');
    [lama, baru, ulang].forEach((i) => i.addEventListener('input', () => { i.value = i.value.replace(/\D/g, ''); cek(); }));
    const syarat = h('ul', { class: 'text-body-sm', style: { display: 'grid', gap: '.25rem', listStyle: 'none', padding: 0, margin: 0 } });
    const galat = h('div', { class: 'bahaya-kotak', style: { display: 'none' }, role: 'alert' });
    const btn = h('button', { class: 'btn btn-utama btn-blok', type: 'submit', disabled: true }, 'Simpan PIN baru');
    function cek() {
      const n = baru.value, aturan = [['6 angka', /^\d{6}$/.test(n)], ['Bukan angka sama / berurutan (111111, 123456)', /^\d{6}$/.test(n) && !/^(\d)\1{5}$/.test(n) && '0123456789012'.indexOf(n) < 0 && '9876543210987'.indexOf(n) < 0], ['Berbeda dari PIN lama', n.length > 0 && n !== lama.value], ['Pengulangan PIN cocok', n.length === 6 && n === ulang.value]];
      ETL.kosong(syarat); aturan.forEach(([t, ok]) => syarat.appendChild(h('li', { style: { color: ok ? '#166534' : '#767681', display: 'flex', gap: '.4rem', alignItems: 'center' } }, ETL.ikon(ok ? 'centang' : 'info', 16), t)));
      btn.disabled = !(lama.value.length === 6 && aturan.every((a) => a[1]));
    }
    cek();
    const form = h('form', { class: 'kartu', style: { display: 'grid', gap: '1rem', padding: '1.4rem' }, onsubmit: async (e) => {
      e.preventDefault(); galat.style.display = 'none'; tombolMuat(btn, true, 'Menyimpan…');
      try { const d = await ETL.api('auth.gantiPin', { pin_lama: lama.value, pin_baru: baru.value }, { ulang: false }); ETL.sesi.set(d.token, d.profil); ETL.toast('PIN berhasil diganti.', 'ok'); location.hash = ETL.beranda(); }
      catch (er) { galat.textContent = er.pesan || 'Gagal.'; galat.style.display = 'block'; tombolMuat(btn, false, 'Simpan PIN baru'); }
    } }, wajib ? h('div', { class: 'peringatan' }, 'Ini login pertama atau PIN Anda baru direset. Buat PIN pribadi sebelum melanjutkan.') : null,
      medan(wajib ? 'PIN sementara' : 'PIN saat ini', lama), medan('PIN baru', baru), medan('Ulangi PIN baru', ulang), syarat, galat, btn,
      wajib ? h('button', { type: 'button', class: 'btn btn-hantu btn-blok', onclick: ETL.keluar }, 'Keluar') : h('a', { href: ETL.beranda(), class: 'btn btn-hantu btn-blok' }, 'Batal'));
    el.appendChild(h('div', { class: 'min-h-screen', style: { background: 'linear-gradient(180deg, #e8eaff, var(--surface) 40%)' } }, h('div', { style: { maxWidth: '420px', margin: '0 auto', padding: '2.2rem 1rem 3rem' } },
      h('div', { class: 'flex flex-col items-center text-center gap-2 mb-5' }, ETL.logo(56), h('h1', { class: 'text-headline-lg-mobile text-primary' }, 'Ganti PIN'), h('p', { class: 'text-body-md text-on-surface-variant' }, 'Halo, ' + p.nama)), form)));
  } });
})();
