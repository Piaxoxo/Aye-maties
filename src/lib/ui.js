/* ============================================================
   AYE MATIES — global client behaviours
   reveal · parallax · custom cursor · magnetic
   ============================================================ */
export function initUI() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    || document.documentElement.dataset.motion === 'reduce';

  /* ---- reveal on scroll ---- */
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));

  /* ---- decode / glitch text reveal ---- */
  const CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%*<>[]/\\';
  function decode(el) {
    const final = el.dataset.decoded || el.textContent;
    el.dataset.decoded = final;
    if (reduced) { el.textContent = final; return; }
    let frame = 0;
    const id = setInterval(() => {
      frame += 1;
      el.textContent = final.split('').map((c, i) => {
        if (c === ' ' || c === '\n') return c;
        if (i < frame * 0.55) return final[i];
        return CH[(Math.random() * CH.length) | 0];
      }).join('');
      if (frame * 0.55 > final.length) { clearInterval(id); el.textContent = final; }
    }, 30);
  }
  const dio = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { decode(e.target); dio.unobserve(e.target); } });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-decode]').forEach((el) => dio.observe(el));

  if (reduced) return;

  /* ---- foreground bokeh (depth-of-field over content) ---- */
  (function bokeh() {
    const cv = document.createElement('canvas');
    cv.id = 'ocean-fg'; cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    let w, h;
    const size = () => { w = cv.width = innerWidth * dpr; h = cv.height = innerHeight * dpr; cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px'; };
    size(); addEventListener('resize', size);
    const cols = ['95,231,218', '223,250,255', '230,197,116'];
    const N = matchMedia('(hover:none)').matches ? 8 : 16;
    const ps = Array.from({ length: N }, () => ({
      x: Math.random(), y: Math.random(), r: 44 + Math.random() * 90, a: 0.04 + Math.random() * 0.1,
      c: cols[(Math.random() * cols.length) | 0], vy: -(0.00003 + Math.random() * 0.00008), depth: 0.25 + Math.random(), ph: Math.random() * 6.28,
    }));
    let bx = 0, by = 0, cbx = 0, cby = 0;
    addEventListener('mousemove', (e) => { bx = e.clientX / innerWidth - 0.5; by = e.clientY / innerHeight - 0.5; }, { passive: true });
    (function loop() {
      cbx += (bx - cbx) * 0.05; cby += (by - cby) * 0.05;
      ctx.clearRect(0, 0, w, h); ctx.globalCompositeOperation = 'lighter';
      const now = performance.now();
      for (const p of ps) {
        p.y += p.vy; if (p.y < -0.15) p.y = 1.15;
        const px = (p.x * innerWidth + cbx * 70 * p.depth) * dpr;
        const py = (p.y * innerHeight + cby * 45 * p.depth) * dpr;
        const r = p.r * p.depth * dpr;
        const aa = (p.a * (0.7 + 0.3 * Math.sin(now * 0.0006 + p.ph))).toFixed(3);
        const g = ctx.createRadialGradient(px, py, 0, px, py, r);
        g.addColorStop(0, `rgba(${p.c},${aa})`); g.addColorStop(1, `rgba(${p.c},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, r, 0, 6.2832); ctx.fill();
      }
      requestAnimationFrame(loop);
    })();
  })();


  /* ---- parallax (scroll depth + mouse depth) ---- */
  const sEls = [...document.querySelectorAll('[data-parallax]')];
  const dEls = [...document.querySelectorAll('[data-depth]')];
  let mx = 0, my = 0, cx = 0, cy = 0;
  addEventListener('mousemove', (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });
  (function loop() {
    cx += (mx - cx) * 0.06; cy += (my - cy) * 0.06;
    const vh = innerHeight;
    for (const el of sEls) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      const sp = (parseFloat(el.dataset.parallax) || 0.15) * 1.6;
      const center = r.top + r.height / 2 - vh / 2;
      el.style.transform = `translate3d(0, ${(-center * sp).toFixed(1)}px, 0)`;
    }
    for (const el of dEls) {
      const d = (parseFloat(el.dataset.depth) || 20) * 1.6;
      el.style.transform = `translate3d(${(cx * d).toFixed(1)}px, ${(cy * d).toFixed(1)}px, 0)`;
    }
    requestAnimationFrame(loop);
  })();

  /* ---- custom cursor ---- */
  if (!matchMedia('(hover:none)').matches) {
    const c = document.createElement('div'); c.className = 'cursor';
    const r = document.createElement('div'); r.className = 'cursor-ring';
    document.body.append(c, r);
    let px = 0, py = 0, rx = 0, ry = 0;
    addEventListener('mousemove', (e) => { px = e.clientX; py = e.clientY; c.style.transform = `translate(${px}px,${py}px)`; });
    (function ring() { rx += (px - rx) * 0.16; ry += (py - ry) * 0.16; r.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(ring); })();
    document.addEventListener('mouseover', (e) => {
      const hot = e.target.closest('a,button,input,[data-tilt],.tile');
      r.classList.toggle('big', !!hot);
    });
  }

  /* ---- magnetic buttons ---- */
  document.querySelectorAll('[data-magnetic]').forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });
}
