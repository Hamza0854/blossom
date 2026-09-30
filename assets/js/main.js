if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

window.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine    = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const animate = hasGSAP && !reduce;
  const WA = '233502985863';

  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
  }
  const refresh = () => { if (hasGSAP) ScrollTrigger.refresh(); };

  $('#year').textContent = new Date().getFullYear();
  if (!location.hash) window.scrollTo(0, 0);

  /* ---------- Split text into animated words ---------- */
  function splitWords(el) {
    if (el.dataset.splitDone) return $$('.wi', el);
    const walk = node => {
      if (node.nodeType === 1 && node.tagName === 'EM') node.classList.add('is-split');
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const i = document.createElement('span'); i.className = 'wi'; i.textContent = part;
            w.appendChild(i); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
    el.dataset.splitDone = '1';
    return $$('.wi', el);
  }

  /* ---------- Smooth anchor scrolling (JS, not CSS) ---------- */
  const header = $('.site-header');
  function scrollToTarget(el, smooth = true) {
    const offset = el.id === 'rituals' || el.id === 'top' ? 0 : 84;
    const y = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(0, y), behavior: smooth && !reduce ? 'smooth' : 'auto' });
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const go = () => { scrollToTarget(target); history.replaceState(null, '', id); };
    const oc = a.closest('.offcanvas');
    if (oc && window.bootstrap) {
      oc.addEventListener('hidden.bs.offcanvas', go, { once: true });
      bootstrap.Offcanvas.getOrCreateInstance(oc).hide();
    } else go();
  });

  /* ---------- Hero intro ---------- */
  function heroIntro() {
    const tl = gsap.timeline();
    const words = splitWords($('.hero__title'));
    tl.from(words, { yPercent: 120, duration: 1.3, stagger: .07, ease: 'expo.out', clearProps: 'transform' })
      .from('.hero [data-hero-fade]', { y: 34, autoAlpha: 0, duration: 1, stagger: .1, ease: 'power3.out', clearProps: 'transform' }, '-=1')
      .from('.hero__arch', { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut', clearProps: 'clipPath' }, 0)
      .from('.hero__arch img', { scale: 1.4, duration: 2, ease: 'expo.out', clearProps: 'transform' }, .35)
      .from('.hero__thumb, .float-card, .spin-badge', { scale: .5, autoAlpha: 0, duration: 1.1, stagger: .12, ease: 'back.out(1.7)' }, '-=1.2')
      .from('.scroll-cue', { autoAlpha: 0, duration: .8 }, '-=.6');
    return tl;
  }

  /* ---------- Preloader ---------- */
  const preloader = $('.preloader');
  function afterLoad() {
    document.body.classList.remove('is-loading');
    hMeasure();
    refresh();
    if (location.hash) {
      const t = document.querySelector(location.hash);
      if (t) requestAnimationFrame(() => scrollToTarget(t, false));
    }
  }

  if (preloader && animate) {
    const countEl = $('.preloader__count span');
    const counter = { v: 0 };
    let loaded = document.readyState === 'complete', played = false, exited = false;

    const intro = gsap.timeline();
    intro.from('.preloader__petal', { scale: 0, rotate: -120, transformOrigin: '50% 0%', opacity: 0, duration: 1, stagger: .09, ease: 'back.out(1.8)' })
         .from('.preloader__word span', { yPercent: 110, duration: .9, stagger: .05, ease: 'expo.out' }, '-=.6')
         .from('.preloader__tag', { opacity: 0, y: 10, duration: .6 }, '-=.4')
         .to(counter, { v: 100, duration: 1.8, ease: 'power2.inOut', onUpdate: () => (countEl.textContent = Math.round(counter.v)) }, 0)
         .to('.preloader__flower', { rotate: 72, duration: 1.8, ease: 'power2.inOut' }, 0);

    const exit = () => {
      if (!loaded || !played || exited) return;
      exited = true;
      gsap.timeline({ onComplete: () => { preloader.remove(); afterLoad(); } })
        .to('.preloader__inner', { y: -50, opacity: 0, duration: .7, ease: 'power3.in' })
        .to('.preloader__count', { opacity: 0, duration: .4 }, '<')
        .to(preloader, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut' }, '-=.15')
        .add(heroIntro(), '-=.6');
    };
    intro.eventCallback('onComplete', () => { played = true; exit(); });
    window.addEventListener('load', () => { loaded = true; exit(); });
    setTimeout(() => { loaded = true; exit(); }, 5000);
  } else {
    preloader && preloader.remove();
    afterLoad();
  }

  /* ---------- Falling petals ---------- */
  const petalBox = $('.petals');
  if (petalBox && !reduce) {
    const n = window.innerWidth < 768 ? 8 : 16;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('span');
      p.className = 'petal';
      p.style.left = Math.random() * 100 + '%';
      p.style.setProperty('--d', 11 + Math.random() * 12 + 's');
      p.style.setProperty('--delay', -Math.random() * 22 + 's');
      p.style.setProperty('--s', (.45 + Math.random() * .9).toFixed(2));
      p.style.setProperty('--x', Math.round(Math.random() * 140 - 70) + 'px');
      petalBox.appendChild(p);
    }
  }

  /* ---------- Header + back-to-top progress ---------- */
  const toTop = $('.to-top');
  const ring = $('.to-top circle');
  let lastY = window.scrollY, ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 40);
    if (Math.abs(y - lastY) > 6) {
      header.classList.toggle('is-hidden', y > lastY && y > 600);
      lastY = y;
    }
    const max = document.documentElement.scrollHeight - window.innerHeight;
    ring.style.strokeDashoffset = 151 - 151 * (max > 0 ? y / max : 0);
    toTop.classList.toggle('show', y > 700);
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));

  /* ---------- Active nav link ---------- */
  const navLinks = $$('.nav-links a');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['top', 'about', 'menu', 'rituals', 'laser', 'book', 'policy', 'careers', 'visit'].forEach(id => { const s = document.getElementById(id); s && io.observe(s); });

  /* ---------- Custom cursor ---------- */
  if (fine && !reduce) {
    const dot = $('.cursor-dot'), cRing = $('.cursor-ring');
    let mx = -100, my = -100, rx = mx, ry = my;
    window.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      document.body.classList.add('has-cursor');
    }, { passive: true });
    document.addEventListener('mouseleave', () => document.body.classList.remove('has-cursor'));
    (function loop() {
      rx += (mx - rx) * .16; ry += (my - ry) * .16;
      cRing.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      requestAnimationFrame(loop);
    })();
    $$('a, button, .tab-btn, [data-cursor], input, select, textarea').forEach(el => {
      el.addEventListener('mouseenter', () => cRing.classList.add(el.dataset.cursor === 'view' ? 'is-view' : 'is-hover'));
      el.addEventListener('mouseleave', () => cRing.classList.remove('is-hover', 'is-view'));
    });
  }

  /* ---------- Magnetic buttons, tilt cards, hero depth ---------- */
  if (fine && animate) {
    $$('.magnetic').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * .3, y: (e.clientY - r.top - r.height / 2) * .4, duration: .6, ease: 'power3.out' });
      });
      el.addEventListener('mouseleave', () => gsap.to(el, { x: 0, y: 0, duration: .9, ease: 'elastic.out(1, .4)' }));
    });

    $$('[data-tilt]').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        card.style.setProperty('--mx', (px + .5) * 100 + '%');
        card.style.setProperty('--my', (py + .5) * 100 + '%');
        gsap.to(card, { rotateY: px * 10, rotateX: -py * 10, transformPerspective: 900, duration: .6, ease: 'power2.out' });
      });
      card.addEventListener('mouseleave', () => gsap.to(card, { rotateX: 0, rotateY: 0, duration: 1, ease: 'elastic.out(1, .5)' }));
    });

    const hero = $('.hero');
    hero.addEventListener('mousemove', e => {
      const cx = e.clientX / window.innerWidth - .5, cy = e.clientY / window.innerHeight - .5;
      $$('[data-depth]', hero).forEach(el => {
        const d = parseFloat(el.dataset.depth);
        gsap.to(el, { x: cx * d, y: cy * d, duration: 1.2, ease: 'power3.out' });
      });
    });
  }

  /* ---------- Scroll-triggered animations (play once, never break on scroll-back) ---------- */
  if (animate) {
    $$('[data-split]').forEach(el => {
      const words = splitWords(el);
      gsap.from(words, { yPercent: 115, duration: 1.2, stagger: .045, ease: 'expo.out', clearProps: 'transform',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });

    $$('[data-reveal]').forEach(el => {
      gsap.from(el, { y: 50, autoAlpha: 0, duration: 1.1, ease: 'power3.out', delay: parseFloat(el.dataset.delay || 0), clearProps: 'transform,opacity,visibility',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
    });

    $$('[data-clip]').forEach(el => {
      const img = $('img', el);
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
      tl.from(el, { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut', clearProps: 'clipPath' });
      if (img) tl.from(img, { scale: 1.45, duration: 2, ease: 'expo.out', clearProps: 'transform' }, '-=1.1');
    });

    // Gentle parallax (on wrappers that are never used by other animations)
    gsap.to('.collage__b-wrap', { yPercent: -10, ease: 'none', scrollTrigger: { trigger: '.collage', start: 'top bottom', end: 'bottom top', scrub: .6 } });
    gsap.to('.hero__media', { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .6 } });

    // Counters
    $$('[data-count]').forEach(el => {
      const end = +el.dataset.count, o = { v: 0 };
      el.textContent = '0';
      ScrollTrigger.create({ trigger: el, start: 'top 95%', once: true, onEnter: () =>
        gsap.to(o, { v: end, duration: 2.2, ease: 'power3.out', onUpdate: () => (el.textContent = Math.round(o.v)) }) });
    });

    // Marquee with scroll-velocity boost
    $$('.marquee__track').forEach((track, i) => {
      const left = i % 2 === 0;
      const tw = gsap.fromTo(track, { xPercent: left ? 0 : -50 }, { xPercent: left ? -50 : 0, duration: left ? 36 : 44, ease: 'none', repeat: -1 });
      ScrollTrigger.create({
        trigger: track, start: 'top bottom', end: 'bottom top',
        onUpdate: self => {
          const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 350, 5);
          gsap.to(tw, { timeScale: boost, duration: .25, overwrite: true, onComplete: () => gsap.to(tw, { timeScale: 1, duration: 1.2 }) });
        }
      });
    });

    // Ritual cards entrance
    gsap.from('.pkg-card', { y: 80, autoAlpha: 0, duration: 1.2, stagger: .1, ease: 'power3.out', clearProps: 'transform,opacity,visibility',
      scrollTrigger: { trigger: '.rituals', start: 'top 75%', once: true } });

    // Footer wordmark
    gsap.from('.footer-word span', { yPercent: 100, autoAlpha: 0, duration: 1.2, stagger: .06, ease: 'expo.out', clearProps: 'transform,opacity,visibility',
      scrollTrigger: { trigger: '.footer-word', start: 'top 98%', once: true } });
  }

  /* ---------- Rituals: sticky horizontal scroll (desktop) ---------- */
  const rit = $('.rituals'), hvp = $('.h-viewport'), htrack = $('.h-track'), hbar = $('.h-progress span');
  const hImgs = $$('.pkg-card img');
  const desktopMQ = window.matchMedia('(min-width: 992px)');
  let hDist = 0, hCur = 0, hRaf = null;

  function hLoop() {
    const r = rit.getBoundingClientRect();
    const p = hDist ? Math.min(1, Math.max(0, -r.top / hDist)) : 0;
    const target = p * hDist;
    hCur += (target - hCur) * (reduce ? 1 : .12);
    if (Math.abs(target - hCur) < .1) hCur = target;
    htrack.style.transform = `translate3d(${-hCur.toFixed(2)}px,0,0)`;
    if (hbar) hbar.style.transform = `scaleX(${hDist ? (hCur / hDist).toFixed(4) : 0})`;
    if (!reduce && r.bottom > 0 && r.top < window.innerHeight) {
      const vw = window.innerWidth;
      hImgs.forEach(img => {
        const cr = img.parentElement.getBoundingClientRect();
        const off = (cr.left + cr.width / 2) / vw - .5;
        img.style.transform = `translate3d(${(off * -12).toFixed(2)}%,0,0)`;
      });
    }
    hRaf = requestAnimationFrame(hLoop);
  }

  function hMeasure() {
    if (desktopMQ.matches) {
      rit.classList.add('is-sticky');
      hDist = Math.max(0, htrack.scrollWidth - hvp.clientWidth);
      rit.style.height = (window.innerHeight + hDist) + 'px';
      if (!hRaf) hLoop();
    } else {
      rit.classList.remove('is-sticky');
      rit.style.height = '';
      htrack.style.transform = '';
      hImgs.forEach(img => (img.style.transform = ''));
      hDist = 0;
      if (hRaf) { cancelAnimationFrame(hRaf); hRaf = null; }
    }
  }
  hMeasure();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { hMeasure(); moveIndicator($('.tab-btn.active')); refresh(); }, 180);
  });
  window.addEventListener('load', () => { hMeasure(); refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { hMeasure(); moveIndicator($('.tab-btn.active')); refresh(); });

  /* ---------- Menu tabs ---------- */
  const tabs = $$('.tab-btn'), panels = $$('.menu-panel'), indicator = $('.tab-indicator');
  function moveIndicator(btn) {
    if (!btn) return;
    indicator.style.width = btn.offsetWidth + 'px';
    indicator.style.transform = `translateX(${btn.offsetLeft}px)`;
  }
  function activateTab(btn, focus = false) {
    if (!btn || btn.classList.contains('active')) return;
    tabs.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); b.tabIndex = -1; });
    btn.classList.add('active'); btn.setAttribute('aria-selected', 'true'); btn.tabIndex = 0;
    if (focus) btn.focus({ preventScroll: true });
    moveIndicator(btn);
    const wrap = $('.tabs-wrap');
    wrap.scrollTo({ left: btn.offsetLeft - wrap.clientWidth / 2 + btn.offsetWidth / 2, behavior: reduce ? 'auto' : 'smooth' });
    const target = btn.getAttribute('aria-controls');
    panels.forEach(p => (p.hidden = p.id !== target));
    const panel = document.getElementById(target);
    if (animate) {
      gsap.fromTo($$('.menu-item, .menu-intro, .menu-sub, .panel-note', panel),
        { y: 30, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: .7, stagger: .03, ease: 'power3.out', clearProps: 'transform,opacity,visibility' });
    }
    requestAnimationFrame(() => { hMeasure(); refresh(); });
  }
  tabs.forEach((btn, i) => {
    btn.addEventListener('click', () => activateTab(btn));
    btn.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); activateTab(tabs[(i + 1) % tabs.length], true); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); activateTab(tabs[(i - 1 + tabs.length) % tabs.length], true); }
    });
  });
  moveIndicator($('.tab-btn.active'));
  $$('[data-open-tab]').forEach(a => a.addEventListener('click', () => activateTab(document.getElementById(a.dataset.openTab))));

  /* ---------- Booking form ---------- */
  const select = $('#bk-service');
  const fmt = n => Number(n).toLocaleString('en-GH');
  const addGroup = (label, items) => {
    const g = document.createElement('optgroup'); g.label = label;
    items.forEach(it => {
      const o = document.createElement('option');
      o.value = `${it.dataset.name} (GH₵${fmt(it.dataset.price)})`;
      o.textContent = `${it.dataset.name} — GH₵${fmt(it.dataset.price)}`;
      o.dataset.name = it.dataset.name;
      g.appendChild(o);
    });
    select.appendChild(g);
  };
  panels.forEach(p => addGroup(p.dataset.label, $$('.menu-item', p)));
  addGroup('Spa Rituals', $$('.pkg-card[data-name]'));

  $$('[data-book]').forEach(btn => btn.addEventListener('click', e => {
    e.preventDefault();
    const opt = $$('option', select).find(o => o.dataset.name === btn.dataset.book);
    if (opt) select.value = opt.value;
    scrollToTarget(document.getElementById('book'));
    setTimeout(() => $('#bk-name').focus({ preventScroll: true }), 1000);
  }));

  const today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  $('#bk-date').min = today.toISOString().split('T')[0];

  $('#bookForm').addEventListener('submit', e => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) { form.classList.add('was-validated'); return; }
    const d = new FormData(form);
    const lines = [
      'Hello Blossom 🌸, I would like to book an appointment.', '',
      `Name: ${d.get('name')}`, `Phone: ${d.get('phone')}`, `Service: ${d.get('service')}`,
      `Date: ${d.get('date')}`, `Time: ${d.get('time')}`
    ];
    if (d.get('notes')) lines.push(`Notes: ${d.get('notes')}`);
    lines.push('', 'Please confirm slot availability. Thank you!');
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener');
    toast('Opening WhatsApp with your booking…');
  });

  /* ---------- Copy MoMo + toast ---------- */
  const toastEl = $('.toast-bloom');
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }
  $$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); toast('MoMo number copied ✓'); }
    catch { toast('MoMo: ' + b.dataset.copy); }
  }));
});