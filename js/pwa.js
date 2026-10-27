/* PWA: daftar service worker, tangkap tombol pasang, beri tahu bila ada versi baru. */
(function () {
  'use strict';
  const P = { tawaran: null, terpasang: false, versiBaru: false };
  const mandiri = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  P.terpasang = mandiri();
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;

  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); P.tawaran = e; });
  window.addEventListener('appinstalled', () => { P.terpasang = true; P.tawaran = null; if (window.ETL && ETL.toast) ETL.toast('Aplikasi terpasang di layar utama.', 'ok'); });

  /** Status untuk tampilan: 'terpasang' | 'bisa' (dialog bawaan tersedia) | 'ios' (petunjuk manual) | 'tidak' */
  P.status = () => (mandiri() || P.terpasang ? 'terpasang' : P.tawaran ? 'bisa' : ios ? 'ios' : 'tidak');
  P.pasang = async () => {
    if (!P.tawaran) return false;
    P.tawaran.prompt(); const r = await P.tawaran.userChoice; P.tawaran = null; return r && r.outcome === 'accepted';
  };
  P.muatUlang = () => { navigator.serviceWorker.getRegistration().then((r) => { if (r && r.waiting) r.waiting.postMessage('ambil-alih'); setTimeout(() => location.reload(), 200); }); };
  window.ETL = window.ETL || {}; ETL.pwa = P;

  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then((reg) => {
      reg.addEventListener('updatefound', () => {
        const baru = reg.installing; if (!baru) return;
        baru.addEventListener('statechange', () => {
          if (baru.state === 'installed' && navigator.serviceWorker.controller) {
            P.versiBaru = true;
            if (ETL.toast) ETL.toast('Versi baru tersedia. Tutup dan buka lagi aplikasi, atau buka menu Akun lalu tekan Muat ulang.', 'info');
          }
        });
      });
    }).catch(() => { /* tanpa service worker aplikasi tetap berjalan seperti biasa */ });
  });
})();
