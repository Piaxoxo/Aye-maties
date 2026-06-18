/* ============================================================
   AYE MATIES — Experience layer
   enter-gate · soundtrack · compass nav · parallax · reveals
   ============================================================ */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get: (k, d) => { try { const v = localStorage.getItem('aym_' + k); return v === null ? d : v; } catch (e) { return d; } },
    set: (k, v) => { try { localStorage.setItem('aym_' + k, v); } catch (e) {} }
  };

  /* ---------------- Brightness control ---------------- */
  (function brightness() {
    const order = ['cinematic', 'balanced', 'readable'];
    const labels = { cinematic: 'Cinematic', balanced: 'Balanced', readable: 'Readable' };
    let cur = store.get('bright', 'balanced');
    if (!order.includes(cur)) cur = 'balanced';
    function apply() {
      document.documentElement.dataset.bright = cur;
      const b = $('#bright');
      if (b) b.setAttribute('aria-label', 'Brightness: ' + labels[cur] + ' (click to change)');
    }
    apply();
    $('#bright')?.addEventListener('click', () => {
      cur = order[(order.indexOf(cur) + 1) % order.length];
      store.set('bright', cur); apply();
    });
  })();

  /* ---------------- Custom cursor ---------------- */
  (function cursor() {
    const c = $('.cursor'), ring = $('.cursor-ring');
    if (!c || matchMedia('(hover:none)').matches) return;
    let mx = 0, my = 0, rx = 0, ry = 0;
    addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; c.style.left = mx + 'px'; c.style.top = my + 'px'; });
    (function loop() { rx += (mx - rx) * .15; ry += (my - ry) * .15; ring.style.left = rx + 'px'; ring.style.top = ry + 'px'; requestAnimationFrame(loop); })();
    document.addEventListener('mouseover', e => {
      if (e.target.closest('a,button,.cast,.card,.fact,.compass-btn,[data-tilt],input')) { ring.classList.add('big'); c.style.background = 'var(--gold)'; }
      else { ring.classList.remove('big'); c.style.background = 'var(--aqua)'; }
    });
  })();

  /* ---------------- Reveal on scroll ---------------- */
  (function reveals() {
    const io = new IntersectionObserver((es) => {
      es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .15, rootMargin: '0px 0px -8% 0px' });
    $$('[data-reveal], .stagger').forEach(el => io.observe(el));
  })();

  /* ---------------- Counters ---------------- */
  (function counters() {
    const io = new IntersectionObserver((es) => {
      es.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target, target = parseFloat(el.dataset.counter), suf = el.dataset.suffix || '';
        const start = performance.now(), dur = 1700;
        (function tick(now) {
          const p = Math.min(1, (now - start) / dur), v = (1 - Math.pow(1 - p, 3)) * target;
          el.textContent = (target % 1 ? v.toFixed(1) : Math.floor(v)) + suf;
          if (p < 1) requestAnimationFrame(tick);
        })(start);
        io.unobserve(el);
      });
    }, { threshold: .6 });
    $$('[data-counter]').forEach(el => io.observe(el));
  })();

  /* ---------------- Parallax engine (scroll + mouse depth) ---------------- */
  (function parallax() {
    if (reduced) return;
    const sEls = $$('[data-parallax]'), dEls = $$('[data-depth]');
    let mx = 0, my = 0, cmx = 0, cmy = 0;
    addEventListener('mousemove', e => { mx = (e.clientX / innerWidth - .5); my = (e.clientY / innerHeight - .5); }, { passive: true });
    function loop() {
      cmx += (mx - cmx) * .06; cmy += (my - cmy) * .06;
      const vh = innerHeight;
      sEls.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const speed = parseFloat(el.dataset.parallax) || .15;
        const center = r.top + r.height / 2 - vh / 2;
        el.style.transform = `translate3d(0, ${(-center * speed).toFixed(1)}px, 0)`;
      });
      dEls.forEach(el => {
        const d = parseFloat(el.dataset.depth) || 20;
        el.style.transform = `translate3d(${(cmx * d).toFixed(1)}px, ${(cmy * d).toFixed(1)}px, 0)`;
      });
      requestAnimationFrame(loop);
    }
    loop();
  })();

  /* ---------------- 3D tilt cards ---------------- */
  (function tilt() {
    if (reduced || matchMedia('(hover:none)').matches) return;
    $$('[data-tilt]').forEach(el => {
      const max = parseFloat(el.dataset.tilt) || 8;
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        el.style.transform = `perspective(900px) rotateY(${px * max}deg) rotateX(${-py * max}deg) translateZ(0)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = 'perspective(900px) rotateY(0) rotateX(0)'; });
    });
  })();

  /* ---------------- Hero title reveal ---------------- */
  function revealHero() {
    $$('.hero-title .line>span').forEach((el, i) => setTimeout(() => el.classList.add('up'), 120 + i * 150));
    $$('.hero-inner [data-hero]').forEach((el, i) => setTimeout(() => { el.style.opacity = 1; el.style.transform = 'none'; }, 380 + i * 160));
  }

  /* ---------------- Compass navigation ---------------- */
  (function compass() {
    const btn = $('.compass-btn'), overlay = $('#nav-overlay');
    if (!btn || !overlay) return;
    const rose = $('.compass-rose', btn), needle = $('.compass-needle', btn);
    let spin = 0;
    $$('.nav-links a').forEach((a, i) => a.style.setProperty('--i', i));
    function toggle(open) {
      const willOpen = open ?? !overlay.classList.contains('open');
      overlay.classList.toggle('open', willOpen);
      document.body.style.overflow = willOpen ? 'hidden' : '';
      btn.classList.add('spun');
      spin += willOpen ? 135 : 90 + Math.round(Math.random() * 40);
      if (rose) rose.style.transform = `rotate(${spin}deg)`;
      if (needle) needle.style.transform = `rotate(${spin * 1.4}deg)`;
      if (window.AYM && AYM.tick) AYM.tick(); // optional click sound
    }
    btn.addEventListener('click', () => toggle());
    $('.nav-close', overlay)?.addEventListener('click', () => toggle(false));
    $$('.nav-links a', overlay).forEach(a => a.addEventListener('click', () => setTimeout(() => toggle(false), 60)));
    addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('open')) toggle(false); });
  })();

  /* ---------------- Cinematic page transitions ---------------- */
  (function transitions() {
    const dive = $('#dive');
    if (!dive) return;
    $$('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel') || a.target === '_blank') return;
      a.addEventListener('click', e => {
        e.preventDefault();
        // remember audio position so it can resume on the next page
        if (window.AYM) AYM.savePos();
        dive.classList.add('show');
        setTimeout(() => { location.href = href; }, 620);
      });
    });
    addEventListener('pageshow', () => dive.classList.remove('show'));
  })();

  /* ============================================================
     SOUNDTRACK  (SoundCloud Widget API)
     ============================================================ */
  const AYM = window.AYM = {};
  (function soundtrack() {
    const dock = $('#sound-dock'), btn = $('#sound-btn'), frame = $('#sc-frame');
    const muteBtn = $('#sound-mute'), vol = $('#sound-vol');
    let widget = null, ready = false, playing = false, muted = store.get('mute', '0') === '1';
    let target = parseInt(store.get('vol', '70'), 10);
    if (isNaN(target)) target = 70;
    if (vol) vol.value = target;

    // optional soft "tick" for the compass using WebAudio (no asset needed)
    let actx = null;
    AYM.tick = function () {
      if (store.get('sound', 'off') !== 'on') return;
      try {
        actx = actx || new (window.AudioContext || window.webkitAudioContext)();
        const o = actx.createOscillator(), g = actx.createGain();
        o.frequency.value = 880; o.type = 'sine'; g.gain.value = .04;
        o.connect(g); g.connect(actx.destination); o.start();
        g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime + .18); o.stop(actx.currentTime + .2);
      } catch (e) {}
    };

    function loadAPI() {
      return new Promise((res) => {
        if (window.SC && window.SC.Widget) return res();
        const s = document.createElement('script');
        s.src = 'https://w.soundcloud.com/player/api.js';
        s.onload = res; s.onerror = res;
        document.head.appendChild(s);
      });
    }

    async function ensureWidget() {
      if (widget || !frame) return widget;
      await loadAPI();
      if (!window.SC || !window.SC.Widget) return null;
      widget = SC.Widget(frame);
      widget.bind(SC.Widget.Events.READY, () => {
        ready = true;
        widget.setVolume(0);
        const pos = parseInt(store.get('pos', '0'), 10);
        const trk = parseInt(store.get('track', '0'), 10);
        if (trk) widget.skip(trk);
        if (pos) widget.seekTo(pos);
      });
      widget.bind(SC.Widget.Events.PLAY, () => { playing = true; paint(); });
      widget.bind(SC.Widget.Events.PAUSE, () => { playing = false; paint(); });
      // loop the soundtrack so it plays continuously while exploring
      widget.bind(SC.Widget.Events.FINISH, () => { widget.seekTo(0); widget.play(); });
      return widget;
    }

    let _vol = 0;
    function fade(v, ms = 1800) {
      const start = performance.now(), from = _vol;
      (function step(now) {
        const p = Math.min(1, (now - start) / ms);
        _vol = from + (v - from) * p; if (widget) widget.setVolume(_vol);
        if (p < 1) requestAnimationFrame(step);
      })(start);
    }

    function paint() {
      if (!btn) return;
      btn.classList.toggle('on', playing && !muted);
      dock.classList.toggle('expanded', store.get('activated', '0') === '1');
      if (muteBtn) muteBtn.textContent = muted ? '🔇' : '🔊';
    }

    async function activate(autostart) {
      store.set('activated', '1');
      await ensureWidget();
      if (!widget) { dock.classList.add('expanded'); return; }
      store.set('sound', 'on');
      const wait = ready ? Promise.resolve() : new Promise(r => widget.bind(SC.Widget.Events.READY, r));
      await wait;
      widget.play();
      fade(muted ? 0 : target, 2200);
      dock.classList.add('expanded');
      paint();
    }

    AYM.savePos = function () {
      if (widget && ready) {
        widget.getPosition(p => store.set('pos', Math.round(p || 0)));
        widget.getCurrentSoundIndex(i => store.set('track', i || 0));
      }
    };

    // main button: first click activates, later clicks toggle play/pause
    btn?.addEventListener('click', () => {
      if (store.get('activated', '0') !== '1') { activate(true); return; }
      if (!widget) return;
      if (playing) { widget.pause(); } else { widget.play(); fade(muted ? 0 : target, 800); }
    });
    muteBtn?.addEventListener('click', () => {
      muted = !muted; store.set('mute', muted ? '1' : '0');
      fade(muted ? 0 : target, 500); paint();
    });
    vol?.addEventListener('input', () => {
      target = parseInt(vol.value, 10); store.set('vol', target);
      if (!muted) { _vol = target; if (widget) widget.setVolume(target); }
    });
    addEventListener('beforeunload', AYM.savePos);

    // If the user had sound ON from a previous page, auto-resume on first interaction here.
    if (store.get('sound', 'off') === 'on') {
      dock.classList.add('expanded');
      const resume = () => { activate(true); removeEventListener('pointerdown', resume); };
      addEventListener('pointerdown', resume, { once: true });
    }
    paint();

    AYM.activate = activate;
  })();

  /* ============================================================
     ENTER THE EXPERIENCE  (cinematic gate)
     ============================================================ */
  (function enterGate() {
    const enter = $('#enter'), btn = $('#enter-btn'), btnMuted = $('#enter-muted');
    if (!enter) { revealHero(); return; }
    function go(withSound) {
      enter.classList.add('gone');
      document.body.style.overflow = '';
      setTimeout(revealHero, 200);
      if (withSound && AYM.activate) AYM.activate(true);
      setTimeout(() => enter.remove(), 1200);
    }
    document.body.style.overflow = 'hidden';
    btn?.addEventListener('click', () => go(true));
    btnMuted?.addEventListener('click', () => go(false));
  })();

})();
