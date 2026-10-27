/* charts.js : grafik SVG ringan beranimasi (garis, donat, batang) tanpa pustaka. */
(function () {
  'use strict';
  const ETL = window.ETL, NS = 'http://www.w3.org/2000/svg';
  const el = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a || {}) e.setAttribute(k, a[k]); return e; };
  const WARNA = ['#1e2761', '#555b8e', '#f2994a', '#bbc3ff', '#2a9d8f', '#c0392b', '#8790d0'];

  function garis(wadah, data, opt) {
    opt = opt || {};
    ETL.kosong(wadah);
    const W = 640, H = 240, pl = 36, pr = 14, pt = 22, pb = 34;
    const maks = Math.max(4, ...data.map((d) => d.nilai)), langkah = Math.ceil(maks / 4), atas = langkah * 4;
    const x = (i) => pl + (data.length === 1 ? (W - pl - pr) / 2 : (i * (W - pl - pr)) / (data.length - 1)), y = (v) => H - pb - (v / atas) * (H - pt - pb);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'grafik', role: 'img', 'aria-label': opt.label || 'Grafik tren' });
    for (let i = 0; i <= 4; i++) {
      const yy = y(i * langkah);
      svg.appendChild(el('line', { x1: pl, x2: W - pr, y1: yy, y2: yy, class: 'g-grid' }));
      const t = el('text', { x: pl - 8, y: yy + 4, class: 'g-sumbu', 'text-anchor': 'end' }); t.textContent = i * langkah; svg.appendChild(t);
    }
    const pts = data.map((d, i) => [x(i), y(d.nilai)]), garisD = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const luasD = garisD + ` L${pts[pts.length - 1][0].toFixed(1)} ${H - pb} L${pts[0][0].toFixed(1)} ${H - pb} Z`;
    const defs = el('defs'), lg = el('linearGradient', { id: 'gradLuas', x1: 0, y1: 0, x2: 0, y2: 1 });
    lg.appendChild(el('stop', { offset: '0%', 'stop-color': '#1e2761', 'stop-opacity': '.25' })); lg.appendChild(el('stop', { offset: '100%', 'stop-color': '#1e2761', 'stop-opacity': '0' }));
    defs.appendChild(lg); svg.appendChild(defs);
    svg.appendChild(el('path', { d: luasD, fill: 'url(#gradLuas)', class: 'g-luas' }));
    const jalur = el('path', { d: garisD, class: 'g-garis', fill: 'none' }); svg.appendChild(jalur);
    const tip = ETL.h('div', { class: 'g-tip', role: 'tooltip' });
    data.forEach((d, i) => {
      const t = el('text', { x: x(i), y: H - 12, class: 'g-sumbu', 'text-anchor': 'middle' }); t.textContent = d.label; svg.appendChild(t);
      const c = el('circle', { cx: x(i), cy: y(d.nilai), r: 4.5, class: 'g-titik', tabindex: 0 }); c.style.animationDelay = 300 + i * 60 + 'ms';
      const tampil = () => { tip.textContent = d.label + ': ' + ETL.angka(d.nilai) + ' kasus'; tip.style.left = (x(i) / W) * 100 + '%'; tip.style.top = (y(d.nilai) / H) * 100 + '%'; tip.classList.add('on'); };
      c.addEventListener('mouseenter', tampil); c.addEventListener('focus', tampil); c.addEventListener('touchstart', tampil, { passive: true });
      c.addEventListener('mouseleave', () => tip.classList.remove('on')); c.addEventListener('blur', () => tip.classList.remove('on'));
      svg.appendChild(c);
    });
    wadah.classList.add('grafik-wadah'); wadah.appendChild(svg); wadah.appendChild(tip);
    const p = jalur.getTotalLength ? jalur.getTotalLength() : 0;
    if (p && !ETL.kurangGerak()) { jalur.style.strokeDasharray = p; jalur.style.strokeDashoffset = p; requestAnimationFrame(() => { jalur.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(.2,.7,.2,1)'; jalur.style.strokeDashoffset = 0; }); }
  }

  function donat(wadah, data, tengah) {
    ETL.kosong(wadah);
    const total = data.reduce((t, d) => t + d.n, 0), R = 70, C = 2 * Math.PI * R;
    const svg = el('svg', { viewBox: '0 0 200 200', class: 'donat', role: 'img', 'aria-label': 'Komposisi jenis pelanggaran' });
    svg.appendChild(el('circle', { cx: 100, cy: 100, r: R, fill: 'none', stroke: '#eceef2', 'stroke-width': 26 }));
    let acc = 0;
    data.forEach((d, i) => {
      if (!d.n) return;
      const pj = (d.n / total) * C, c = el('circle', { cx: 100, cy: 100, r: R, fill: 'none', stroke: WARNA[i % WARNA.length], 'stroke-width': 26, class: 'd-seg', transform: 'rotate(-90 100 100)' });
      c.setAttribute('stroke-dasharray', `${pj} ${C - pj}`); c.setAttribute('stroke-dashoffset', -acc);
      const ti = el('title'); ti.textContent = d.nama + ': ' + d.n; c.appendChild(ti);
      if (!ETL.kurangGerak()) { c.style.opacity = 0; c.style.animation = `donat-masuk .6s ${i * 120}ms ease-out forwards`; }
      svg.appendChild(c); acc += pj;
    });
    const t1 = el('text', { x: 100, y: 96, 'text-anchor': 'middle', class: 'd-angka' }); t1.textContent = ETL.angka(total);
    const t2 = el('text', { x: 100, y: 116, 'text-anchor': 'middle', class: 'd-label' }); t2.textContent = tengah || 'TOTAL KASUS';
    svg.appendChild(t1); svg.appendChild(t2);
    wadah.appendChild(svg);
    return data.map((d, i) => ({ warna: WARNA[i % WARNA.length], nama: d.nama, n: d.n, persen: total ? Math.round((d.n / total) * 100) : 0 }));
  }

  function batang(wadah, data) { // data: [{nama,n}] horizontal
    ETL.kosong(wadah);
    const maks = Math.max(1, ...data.map((d) => d.n));
    data.forEach((d, i) => {
      const bar = ETL.h('div', { class: 'batang-isi', style: { width: '0%' } });
      wadah.appendChild(ETL.h('div', { class: 'batang-baris' }, ETL.h('div', { class: 'batang-nama', title: d.nama }, d.nama), ETL.h('div', { class: 'batang-lajur' }, bar), ETL.h('div', { class: 'batang-n' }, ETL.angka(d.n))));
      setTimeout(() => { bar.style.width = (d.n / maks) * 100 + '%'; }, 80 + i * 50);
    });
  }
  ETL.chart = { garis, donat, batang, WARNA };
})();
