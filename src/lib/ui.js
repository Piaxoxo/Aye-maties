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

  if (reduced) return;

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
