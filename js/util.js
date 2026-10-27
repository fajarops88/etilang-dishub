/* util.js : pembangun DOM aman (tanpa innerHTML), ikon, format, toast, modal, animasi kecil. */
(function () {
  'use strict';
  const ETL = (window.ETL = window.ETL || {});
  const SVGNS = 'http://www.w3.org/2000/svg';

  /** h('div', {class:'x', onclick:fn}, 'teks', child) — semua teks lewat TextNode (anti-XSS). */
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const k of Object.keys(attrs)) {
        const v = attrs[k];
        if (v === null || v === undefined || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k === 'dataset') Object.assign(el.dataset, v);
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k === 'value' || k === 'checked' || k === 'disabled' || k === 'selected' || k === 'readOnly') el[k] = v;
        else el.setAttribute(k, v === true ? '' : String(v));
      }
    }
    tambah(el, kids);
    return el;
  }
  function tambah(el, kids) {
    for (const c of kids) {
      if (c === null || c === undefined || c === false) continue;
      if (Array.isArray(c)) tambah(el, c);
      else if (c instanceof Node) el.appendChild(c);
      else el.appendChild(document.createTextNode(String(c)));
    }
  }
  function kosong(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
  function ikon(nama, ukuran, kelas) {
    const s = document.createElementNS(SVGNS, 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('width', ukuran || 20); s.setAttribute('height', ukuran || 20);
    s.setAttribute('aria-hidden', 'true'); s.setAttribute('class', 'ikon ' + (kelas || ''));
    const p = document.createElementNS(SVGNS, 'path');
    p.setAttribute('d', (window.ETL_IKON || {})[nama] || ''); p.setAttribute('fill', 'currentColor');
    s.appendChild(p);
    return s;
  }

  // ───────── penyimpanan aman ─────────
  const mem = {};
  const simpan = {
    get(k) { try { const v = sessionStorage.getItem(k); return v === null ? (mem[k] ?? null) : v; } catch (e) { return mem[k] ?? null; } },
    set(k, v) { mem[k] = v; try { sessionStorage.setItem(k, v); } catch (e) {} },
    del(k) { delete mem[k]; try { sessionStorage.removeItem(k); } catch (e) {} }
  };
  const lokal = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  // ───────── format ─────────
  const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const BLN_PANJANG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  function parseWaktu(s) { // 'yyyy-MM-dd HH:mm:ss' (sudah WITA dari server)
    const m = /^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2}))?/.exec(String(s || ''));
    if (!m) return null;
    return { y: +m[1], mo: +m[2], d: +m[3], jam: m[4] || '', mnt: m[5] || '', hari: HARI[new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).getUTCDay()] };
  }
  function tgl(s, panjang) {
    const p = parseWaktu(s); if (!p) return s || '–';
    return (panjang ? p.hari + ', ' : '') + p.d + ' ' + (panjang ? BLN_PANJANG : BLN)[p.mo - 1] + ' ' + p.y;
  }
  function waktu(s, panjang) {
    const p = parseWaktu(s); if (!p) return s || '–';
    return tgl(s, panjang) + (p.jam ? ' • ' + p.jam + ':' + p.mnt + ' WITA' : '');
  }
  function bulanLabel(ym) { const [y, m] = String(ym).split('-'); return BLN[+m - 1] + ' ' + String(y).slice(2); }
  function angka(n) { return new Intl.NumberFormat('id-ID').format(n || 0); }
  function formatNopol(n) {
    const m = /^([A-Z]{1,2})(\d{1,4})([A-Z]{0,3})$/.exec(String(n || '').toUpperCase().replace(/[^A-Z0-9]/g, ''));
    return m ? [m[1], m[2], m[3]].filter(Boolean).join(' ') : String(n || '');
  }
  function plat(n, kelas) { return h('span', { class: 'plat ' + (kelas || '') }, formatNopol(n)); }
  const STATUS_KELAS = { Draft: 'badge-draft', Terbit: 'badge-terbit', 'Tindak Lanjut': 'badge-tl', Selesai: 'badge-selesai', Dibatalkan: 'badge-batal' };
  function lencana(status) { return h('span', { class: 'badge ' + (STATUS_KELAS[status] || 'badge-draft') }, status); }
  function inisial(nama) { return String(nama || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase(); }
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms || 300); }; };
  const kurangGerak = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ───────── toast ─────────
  function toast(pesan, tipe) {
    let w = document.getElementById('toast-wadah');
    if (!w) { w = h('div', { id: 'toast-wadah', class: 'toast-wadah', 'aria-live': 'polite' }); document.body.appendChild(w); }
    const t = h('div', { class: 'toast toast-' + (tipe || 'info'), role: 'status' }, ikon(tipe === 'galat' ? 'awas' : tipe === 'ok' ? 'centang' : 'info', 20), h('span', null, pesan));
    w.appendChild(t);
    setTimeout(() => { t.classList.add('keluar'); setTimeout(() => t.remove(), 300); }, tipe === 'galat' ? 6000 : 3500);
  }

  // ───────── modal ─────────
  function modal(o) {
    const lapis = h('div', { class: 'modal-lapis', role: 'dialog', 'aria-modal': 'true', 'aria-label': o.judul });
    const tutup = () => { lapis.classList.add('keluar'); setTimeout(() => lapis.remove(), 200); document.removeEventListener('keydown', esc); document.body.classList.remove('kunci-gulir'); if (o.onTutup) o.onTutup(); };
    const esc = (e) => { if (e.key === 'Escape' && !o.wajib) tutup(); };
    const tombol = (o.tombol || []).map((b) => h('button', { type: 'button', class: 'btn ' + (b.kelas || 'btn-sekunder'), onclick: async (e) => {
      if (b.onClick) { const r = await b.onClick(e, ctl); if (r === false) return; }
      if (b.tutup !== false) tutup();
    } }, b.teks));
    const isi = h('div', { class: 'modal-isi' }, o.isi);
    const kotak = h('div', { class: 'modal-kotak ' + (o.lebar || '') },
      h('div', { class: 'modal-kepala' }, h('h2', { class: 'text-headline-md text-primary' }, o.judul),
        o.wajib ? null : h('button', { type: 'button', class: 'ikon-btn', 'aria-label': 'Tutup', onclick: tutup }, ikon('tutup'))),
      isi, tombol.length ? h('div', { class: 'modal-kaki' }, tombol) : null);
    lapis.appendChild(kotak);
    lapis.addEventListener('mousedown', (e) => { if (e.target === lapis && !o.wajib) tutup(); });
    document.addEventListener('keydown', esc);
    document.body.appendChild(lapis); document.body.classList.add('kunci-gulir');
    const ctl = { tutup, isi, lapis };
    const f = lapis.querySelector('input,select,textarea,button.btn'); if (f && !o.tanpaFokus) setTimeout(() => f.focus(), 50);
    return ctl;
  }
  function konfirmasi(judul, pesan, teksYa, kelas) {
    return new Promise((res) => {
      let selesai = false;
      modal({ judul, isi: h('p', { class: 'text-body-lg text-on-surface-variant' }, pesan), onTutup: () => { if (!selesai) res(false); },
        tombol: [{ teks: 'Batal', kelas: 'btn-sekunder', onClick: () => { selesai = true; res(false); } }, { teks: teksYa || 'Ya, lanjut', kelas: kelas || 'btn-utama', onClick: () => { selesai = true; res(true); } }] });
    });
  }

  // ───────── animasi ─────────
  function hitungNaik(el, target, durasi) {
    target = Number(target) || 0;
    if (kurangGerak() || target === 0) { el.textContent = angka(target); return; }
    const t0 = performance.now(), d = durasi || 900;
    const langkah = (t) => { const p = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - p, 3); el.textContent = angka(Math.round(target * e)); if (p < 1) requestAnimationFrame(langkah); };
    requestAnimationFrame(langkah);
  }
  let pengamat;
  function munculSaatTergulir(root) {
    (root || document).querySelectorAll('.reveal:not(.tampil)').forEach((el, i) => {
      if (kurangGerak() || !('IntersectionObserver' in window)) { el.classList.add('tampil'); return; }
      pengamat = pengamat || new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('tampil'); pengamat.unobserve(e.target); } }), { threshold: 0.08 });
      el.style.transitionDelay = Math.min(i, 6) * 60 + 'ms';
      pengamat.observe(el);
    });
  }
  /** efek riak pada tombol .btn */
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest && e.target.closest('.btn, .kartu-klik');
    if (!b || kurangGerak()) return;
    const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height);
    const rip = h('span', { class: 'riak', style: { width: s + 'px', height: s + 'px', left: e.clientX - r.left - s / 2 + 'px', top: e.clientY - r.top - s / 2 + 'px' } });
    b.appendChild(rip); setTimeout(() => rip.remove(), 600);
  });

  function skeleton(n, tinggi) { return h('div', { class: 'skeleton-wadah' }, Array.from({ length: n || 3 }, () => h('div', { class: 'skeleton', style: { height: (tinggi || 64) + 'px' } }))); }
  function kosongState(ik, judul, teks) { return h('div', { class: 'kosong-state' }, h('div', { class: 'kosong-ikon' }, ikon(ik || 'info', 32)), h('div', { class: 'text-headline-sm text-primary' }, judul), teks ? h('p', { class: 'text-body-md text-on-surface-variant' }, teks) : null); }
  function salin(teks) { return (navigator.clipboard ? navigator.clipboard.writeText(teks) : Promise.reject()).then(() => toast('Disalin', 'ok'), () => toast('Tidak dapat menyalin otomatis', 'galat')); }
  function unduhCsv(nama, kolom, baris) {
    const q = (v) => { v = String(v === null || v === undefined ? '' : v); if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; };
    const isi = '﻿' + [kolom].concat(baris).map((r) => r.map(q).join(',')).join('\r\n');
    const a = h('a', { href: URL.createObjectURL(new Blob([isi], { type: 'text/csv;charset=utf-8' })), download: nama });
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  Object.assign(ETL, { h, kosong, ikon, simpan, lokal, tgl, waktu, bulanLabel, angka, formatNopol, plat, lencana, inisial, debounce, kurangGerak, toast, modal, konfirmasi,
    hitungNaik, munculSaatTergulir, skeleton, kosongState, salin, unduhCsv, parseWaktu, BLN_PANJANG });
})();
