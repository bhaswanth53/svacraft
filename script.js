/* ============================================================
   SVACRAFT — Interactions
   Vanilla JS, no dependencies.
   ============================================================ */

(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const pad = (n) => String(n).padStart(2, '0');

  /* ---------------------------------------------------------
     Tiny toast
     --------------------------------------------------------- */
  const toastEl = $('#toast');
  let toastTimer = null;
  function toast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-show'), 2400);
  }

  /* ---------------------------------------------------------
     Boot sequence
     --------------------------------------------------------- */
  function initBoot() {
    const boot = $('#boot');
    if (!boot) return;

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      boot.classList.add('is-done');
      try { window.sessionStorage.setItem('svacraft:booted', '1'); } catch (_) {}
      setTimeout(() => boot.remove(), 700);
    };

    let alreadyBooted = false;
    try { alreadyBooted = window.sessionStorage.getItem('svacraft:booted') === '1'; } catch (_) {}

    if (reducedMotion || alreadyBooted) {
      boot.classList.add('is-done');
      setTimeout(() => boot.remove(), 50);
      return;
    }

    const log = $('#bootLog');
    const bar = $('#bootBar');
    const lines = [
      'initialising hunter link...',
      'loading local database...',
      'calibrating five attributes...',
      'candidate accepted.',
    ];

    let lineIndex = 0;
    const addLine = () => {
      if (finished || !log) return;
      const span = document.createElement('span');
      span.textContent = lines[lineIndex];
      log.appendChild(span);
      lineIndex += 1;
      if (lineIndex < lines.length) setTimeout(addLine, 390);
    };
    setTimeout(addLine, 180);

    let progress = 0;
    const progressTimer = setInterval(() => {
      if (finished) { clearInterval(progressTimer); return; }
      progress = Math.min(100, progress + 10 + Math.random() * 14);
      if (bar) bar.style.width = `${progress}%`;
      if (progress >= 100) {
        clearInterval(progressTimer);
        setTimeout(finish, 320);
      }
    }, 240);

    boot.addEventListener('click', finish);
    setTimeout(finish, 2750);
  }

  /* ---------------------------------------------------------
     Header, mobile nav, scroll progress, active section
     --------------------------------------------------------- */
  function initNavigation() {
    const header = $('#siteHeader');
    const nav = $('#primaryNav');
    const navToggle = $('#navToggle');
    const progress = $('#scrollProgress');
    const navLinks = $$('.nav__link');
    const sections = $$('main section[id]');

    if (!header || !nav || !navToggle) return;

    const closeNav = () => {
      nav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open menu');
      document.body.classList.remove('nav-open', 'no-scroll');
    };

    const openNav = () => {
      nav.classList.add('is-open');
      navToggle.setAttribute('aria-expanded', 'true');
      navToggle.setAttribute('aria-label', 'Close menu');
      document.body.classList.add('nav-open', 'no-scroll');
    };

    navToggle.addEventListener('click', () => {
      if (navToggle.getAttribute('aria-expanded') === 'true') closeNav();
      else openNav();
    });

    $$('a', nav).forEach((link) => link.addEventListener('click', closeNav));

    let ticking = false;
    const update = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      header.classList.toggle('is-scrolled', scrollY > 24);

      if (progress) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = `${max > 0 ? clamp((scrollY / max) * 100, 0, 100) : 0}%`;
      }

      const probe = scrollY + 150;
      let currentId = '';
      sections.forEach((section) => {
        if (section.offsetTop <= probe) currentId = section.id;
      });
      navLinks.forEach((link) => {
        link.classList.toggle('is-active', link.getAttribute('href') === `#${currentId}`);
      });
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    window.addEventListener('resize', update);
    update();

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) closeNav();
    });
  }

  /* ---------------------------------------------------------
     Scroll reveals + counters
     --------------------------------------------------------- */
  function initReveals() {
    const elements = $$('.reveal');

    $$('.chapters .chapter').forEach((el, i) => {
      el.style.setProperty('--delay', `${Math.min(i, 4) * 70}ms`);
    });
    $$('.bento .feature').forEach((el, i) => {
      el.style.setProperty('--delay', `${Math.min(i, 5) * 60}ms`);
    });
    $$('.trial__copy > *').forEach((el, i) => {
      el.style.setProperty('--delay', `${Math.min(i, 4) * 60}ms`);
    });

    const revealAll = () => elements.forEach((el) => el.classList.add('is-visible'));

    if (!('IntersectionObserver' in window) || reducedMotion) {
      revealAll();
    } else {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      elements.forEach((el) => observer.observe(el));
    }

    // Number counters in the hero.
    const counters = $$('[data-count-to]');
    const setFinal = (el) => {
      el.textContent = `${el.dataset.countTo}${el.dataset.suffix || ''}`;
    };

    if (reducedMotion || !('IntersectionObserver' in window)) {
      counters.forEach(setFinal);
      return;
    }

    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        counterObserver.unobserve(el);
        const target = Number(el.dataset.countTo);
        const suffix = el.dataset.suffix || '';
        const duration = 1100;
        const start = performance.now();
        const tick = (now) => {
          const t = clamp((now - start) / duration, 0, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = `${Math.round(target * eased)}${suffix}`;
          if (t < 1) requestAnimationFrame(tick);
          else setFinal(el);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.7 });

    counters.forEach((el) => counterObserver.observe(el));
  }

  /* ---------------------------------------------------------
     Starfield
     --------------------------------------------------------- */
  function initStarfield() {
    const canvas = $('#starfield');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement;
    const palette = ['#E8F4FD', '#A898F8', '#00D4FF', '#D8C8F8'];
    let stars = [];
    let width = 0;
    let height = 0;
    let raf = 0;

    const makeStars = () => {
      const count = clamp(Math.round((width * height) / 10500), 35, 150);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.25 + 0.25,
        vx: (Math.random() - 0.5) * 0.045,
        vy: Math.random() * 0.09 + 0.012,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.0009 + 0.0003,
        color: palette[Math.floor(Math.random() * palette.length)],
      }));
    };

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeStars();
      if (reducedMotion) draw(0);
    };

    const draw = (time) => {
      ctx.clearRect(0, 0, width, height);
      stars.forEach((star) => {
        const twinkle = 0.28 + 0.58 * Math.abs(Math.sin(time * star.speed + star.phase));
        ctx.globalAlpha = twinkle;
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    };

    const loop = (time) => {
      stars.forEach((star) => {
        star.x += star.vx;
        star.y += star.vy;
        if (star.y > height + 3) { star.y = -3; star.x = Math.random() * width; }
        if (star.x > width + 3) star.x = -3;
        if (star.x < -3) star.x = width + 3;
      });
      draw(time);
      raf = requestAnimationFrame(loop);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else if (!reducedMotion) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(loop);
      }
    });

    if (!reducedMotion) raf = requestAnimationFrame(loop);
  }

  /* ---------------------------------------------------------
     Pointer glow, portal tilt, feature spotlights
     --------------------------------------------------------- */
  function initPointerFx() {
    const glow = $('#cursorGlow');
    if (glow && finePointer && !reducedMotion) {
      let targetX = window.innerWidth / 2;
      let targetY = window.innerHeight / 2;
      let x = targetX;
      let y = targetY;

      window.addEventListener('pointermove', (event) => {
        targetX = event.clientX;
        targetY = event.clientY;
        glow.classList.add('is-on');
      }, { passive: true });

      const loop = () => {
        x += (targetX - x) * 0.12;
        y += (targetY - y) * 0.12;
        glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        requestAnimationFrame(loop);
      };
      loop();
    }

    const scene = $('#portalScene');
    const portal = scene ? $('.portal', scene) : null;
    if (scene && portal && finePointer && !reducedMotion) {
      portal.style.transition = 'transform 0.6s cubic-bezier(0.22, 0.61, 0.36, 1)';
      scene.addEventListener('pointermove', (event) => {
        const rect = scene.getBoundingClientRect();
        const nx = (event.clientX - rect.left) / rect.width - 0.5;
        const ny = (event.clientY - rect.top) / rect.height - 0.5;
        portal.style.transform = `perspective(900px) rotateX(${(-ny * 6).toFixed(2)}deg) rotateY(${(nx * 8).toFixed(2)}deg)`;
      });
      scene.addEventListener('pointerleave', () => { portal.style.transform = ''; });
    }

    if (finePointer && !reducedMotion) {
      $$('.spotlight').forEach((card) => {
        card.addEventListener('pointermove', (event) => {
          const rect = card.getBoundingClientRect();
          card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
          card.style.setProperty('--my', `${event.clientY - rect.top}px`);
        });
      });
    }
  }

  /* ---------------------------------------------------------
     Demo data
     --------------------------------------------------------- */
  const RANKS = [
    { rank: 'E', label: 'E-Rank Hunter', level: 1, color: '#9E9E9E', desc: 'The beginning. The System acknowledges your existence. Everything from here is earned.' },
    { rank: 'D', label: 'D-Rank Hunter', level: 10, color: '#4CAF50', desc: 'No longer a bystander. The first gate has been cleared.' },
    { rank: 'C', label: 'C-Rank Hunter', level: 20, color: '#2196F3', desc: 'Competence becomes visible. Other hunters begin to notice.' },
    { rank: 'B', label: 'B-Rank Hunter', level: 35, color: '#9C27B0', desc: 'You are no longer the weakest in the room. The room knows it.' },
    { rank: 'A', label: 'A-Rank Hunter', level: 50, color: '#FF9800', desc: 'The elite tier. Few make it this far, and fewer stay.' },
    { rank: 'S', label: 'S-Rank Hunter', level: 70, color: '#FFD700', desc: 'A force of nature. Your name is spoken in whispers.' },
    { rank: 'SS', label: 'SS-Rank Hunter', level: 90, color: '#FF6B6B', desc: 'Beyond the chart. A hunter of legend, still climbing.' },
    { rank: 'N', label: 'National Level Hunter', level: 99, color: '#00F5FF', desc: 'National Level. The System bows. There is nothing left to prove — only more to become.' },
  ];

  const BELTS = [
    { name: 'White', level: 1, color: '#E8F4FD', desc: 'The first knot. Every master started here.' },
    { name: 'Yellow', level: 5, color: '#FFD700', desc: 'The first sign of dawn. Habits are forming.' },
    { name: 'Orange', level: 10, color: '#FF9800', desc: 'The fire catches. Technique becomes intent.' },
    { name: 'Green', level: 16, color: '#4CAF50', desc: 'Growth becomes visible. The roots hold.' },
    { name: 'Blue', level: 24, color: '#2196F3', desc: 'Calm under pressure. The water finds its path.' },
    { name: 'Purple', level: 34, color: '#9C27B0', desc: 'Mastery in motion. Instinct sharpens.' },
    { name: 'Brown', level: 46, color: '#8D6E63', desc: 'The work is worn into the hands.' },
    { name: 'Red', level: 60, color: '#FF4757', desc: 'Controlled force. The edge is earned.' },
    { name: 'Black', level: 75, color: '#5A6B85', desc: 'Not an ending. A beginning you can no longer unsee.' },
  ];

  const STAT_META = [
    { key: 'strength', label: 'Strength', color: '#FF6B6B' },
    { key: 'agility', label: 'Agility', color: '#00BCD4' },
    { key: 'endurance', label: 'Endurance', color: '#4CAF50' },
    { key: 'intelligence', label: 'Intelligence', color: '#AB47BC' },
    { key: 'vitality', label: 'Vitality', color: '#FF9800' },
  ];

  /* ---------------------------------------------------------
     Rank explorer
     --------------------------------------------------------- */
  function initRanks() {
    const detail = $('#rankDetail');
    const cards = $$('.rank-card');
    if (!detail || !cards.length) return;

    const rankIndex = $('#rankIndex');
    const rankLetter = $('#rankLetter');
    const rankName = $('#rankName');
    const rankDesc = $('#rankDesc');
    const rankLevel = $('#rankLevel');
    const rankNext = $('#rankNext');
    const rankStatus = $('#rankStatus');

    const select = (index) => {
      const rank = RANKS[index];
      if (!rank) return;
      detail.style.setProperty('--rank-color', rank.color);
      if (rankIndex) rankIndex.textContent = pad(index + 1);
      if (rankLetter) rankLetter.textContent = rank.rank;
      if (rankName) rankName.textContent = rank.label;
      if (rankDesc) rankDesc.textContent = rank.desc;
      if (rankLevel) rankLevel.textContent = rank.level;
      if (rankNext) {
        const next = RANKS[index + 1];
        rankNext.textContent = next
          ? `Next: ${next.label} at level ${next.level}`
          : 'Maximum rank. The System acknowledges your supremacy.';
      }
      if (rankStatus) {
        rankStatus.innerHTML = index === 0 ? '<i></i> CURRENT' : '<i></i> TARGET';
      }
      cards.forEach((card, i) => {
        const active = i === index;
        card.classList.toggle('is-active', active);
        card.setAttribute('aria-pressed', String(active));
        const mark = $('.rank-card__mark', card);
        if (mark) mark.textContent = active ? (i === 0 ? 'YOU' : 'SELECTED') : '';
      });
    };

    cards.forEach((card) => {
      card.addEventListener('click', () => select(Number(card.dataset.rankIndex)));
    });

    select(0);
  }

  /* ---------------------------------------------------------
     Belt explorer
     --------------------------------------------------------- */
  function initBelts() {
    const rack = $('#beltRack');
    if (!rack) return;
    const buttons = $$('.belt', rack);
    const swatch = $('#beltSwatch');
    const level = $('#beltLevel');
    const name = $('#beltName');
    const desc = $('#beltDesc');
    const next = $('#beltNext');

    const select = (index) => {
      const belt = BELTS[index];
      if (!belt) return;
      buttons.forEach((button, i) => {
        const active = i === index;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      if (swatch) swatch.style.setProperty('--c', belt.color);
      if (level) level.textContent = belt.level;
      if (name) name.textContent = `${belt.name} Belt`;
      if (desc) desc.textContent = belt.desc;
      if (next) {
        const following = BELTS[index + 1];
        next.textContent = following
          ? `Next: ${following.name} Belt at proficiency level ${following.level}`
          : 'The ladder ends here. The practice does not.';
      }
    };

    buttons.forEach((button) => {
      button.addEventListener('click', () => select(Number(button.dataset.beltIndex)));
    });

    select(0);
  }

  /* ---------------------------------------------------------
     Radar chart
     --------------------------------------------------------- */
  const radarState = {
    svg: null,
    polygon: null,
    dots: [],
    valueTexts: {},
    display: { strength: 10, agility: 10, endurance: 10, intelligence: 10, vitality: 10 },
    max: 50,
    cx: 210,
    cy: 190,
    radius: 126,
    meta: STAT_META,
    angle: (i) => -Math.PI / 2 + (Math.PI * 2 / 5) * i,
  };

  function radarPoint(i, ratio) {
    const angle = radarState.angle(i);
    return [
      radarState.cx + Math.cos(angle) * radarState.radius * ratio,
      radarState.cy + Math.sin(angle) * radarState.radius * ratio,
    ];
  }

  function initRadar() {
    const svg = document.getElementById('radar');
    if (!svg) return;
    const NS = 'http://www.w3.org/2000/svg';
    radarState.svg = svg;

    const add = (tag, attrs) => {
      const el = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, String(value)));
      svg.appendChild(el);
      return el;
    };

    const defs = add('defs', {});
    const gradient = document.createElementNS(NS, 'linearGradient');
    gradient.setAttribute('id', 'radarFill');
    gradient.setAttribute('x1', '0');
    gradient.setAttribute('y1', '0');
    gradient.setAttribute('x2', '1');
    gradient.setAttribute('y2', '1');
    const stopA = document.createElementNS(NS, 'stop');
    stopA.setAttribute('offset', '0%');
    stopA.setAttribute('stop-color', '#00D4FF');
    stopA.setAttribute('stop-opacity', '0.32');
    const stopB = document.createElementNS(NS, 'stop');
    stopB.setAttribute('offset', '100%');
    stopB.setAttribute('stop-color', '#7858F8');
    stopB.setAttribute('stop-opacity', '0.18');
    gradient.append(stopA, stopB);
    defs.appendChild(gradient);

    // Rings
    [0.2, 0.4, 0.6, 0.8, 1].forEach((ratio) => {
      const points = radarState.meta
        .map((_, i) => radarPoint(i, ratio).map((n) => n.toFixed(2)).join(','))
        .join(' ');
      add('polygon', {
        points,
        fill: 'none',
        stroke: ratio === 1 ? 'rgba(26,58,92,0.95)' : 'rgba(26,58,92,0.55)',
        'stroke-width': 1,
        'stroke-dasharray': ratio === 1 ? '0' : '3 5',
      });
    });

    // Axes
    radarState.meta.forEach((_, i) => {
      const [x, y] = radarPoint(i, 1);
      add('line', {
        x1: radarState.cx,
        y1: radarState.cy,
        x2: x,
        y2: y,
        stroke: 'rgba(26,58,92,0.65)',
        'stroke-width': 1,
      });
    });

    // Center glow
    add('circle', { cx: radarState.cx, cy: radarState.cy, r: 3, fill: 'rgba(0,212,255,0.6)' });

    // Data polygon
    radarState.polygon = add('polygon', {
      points: '',
      fill: 'url(#radarFill)',
      stroke: '#00D4FF',
      'stroke-width': 1.6,
      'stroke-linejoin': 'round',
      filter: 'drop-shadow(0 0 8px rgba(0,212,255,0.35))',
    });

    // Dots + labels
    radarState.meta.forEach((stat, i) => {
      const dot = add('circle', {
        cx: radarState.cx,
        cy: radarState.cy,
        r: 3.2,
        fill: stat.color,
        stroke: '#080C24',
        'stroke-width': 1.5,
        filter: `drop-shadow(0 0 5px ${stat.color})`,
      });
      radarState.dots.push(dot);

      const [lx, ly] = radarPoint(i, 1.23);
      const cos = Math.cos(radarState.angle(i));
      const anchor = Math.abs(cos) < 0.22 ? 'middle' : cos > 0 ? 'start' : 'end';
      const label = add('text', {
        x: lx,
        y: ly,
        fill: stat.color,
        'text-anchor': anchor,
        'font-family': 'Share Tech Mono, monospace',
        'font-size': 9.5,
        'letter-spacing': '1.2',
      });
      label.textContent = stat.label.toUpperCase();

      const value = add('text', {
        x: lx,
        y: ly + 14,
        fill: '#E8F4FD',
        'text-anchor': anchor,
        'font-family': 'Orbitron, sans-serif',
        'font-size': 11,
        'font-weight': 600,
      });
      value.textContent = '0';
      radarState.valueTexts[stat.key] = value;
    });

    renderRadar(radarState.display);
  }

  function renderRadar(stats) {
    if (!radarState.polygon) return;
    const points = radarState.meta.map((stat, i) => {
      const value = clamp(stats[stat.key] || 0, 0, radarState.max);
      return radarPoint(i, value / radarState.max).map((n) => n.toFixed(2)).join(',');
    }).join(' ');
    radarState.polygon.setAttribute('points', points);

    radarState.meta.forEach((stat, i) => {
      const value = clamp(stats[stat.key] || 0, 0, radarState.max);
      const [x, y] = radarPoint(i, value / radarState.max);
      const dot = radarState.dots[i];
      if (dot) {
        dot.setAttribute('cx', x.toFixed(2));
        dot.setAttribute('cy', y.toFixed(2));
      }
      const text = radarState.valueTexts[stat.key];
      if (text) text.textContent = String(Math.round(stats[stat.key] || 0));
    });
  }

  function animateRadar(target) {
    const start = { ...radarState.display };
    const duration = reducedMotion ? 0 : 600;
    const started = performance.now();
    const from = { ...start };

    if (duration === 0) {
      radarState.display = { ...target };
      renderRadar(target);
      return;
    }

    const tick = (now) => {
      const t = clamp((now - started) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      STAT_META.forEach((stat) => {
        radarState.display[stat.key] = from[stat.key] + (target[stat.key] - from[stat.key]) * eased;
      });
      renderRadar(radarState.display);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------------------------------------------------------
     Interactive demo / trial
     --------------------------------------------------------- */
  const demo = {
    totalExp: 0,
    level: 1,
    stats: { strength: 10, agility: 10, endurance: 10, intelligence: 10, vitality: 10 },
    bonusAwarded: false,
    titleShown: false,
    timers: [],
  };
  const BASE_STATS = { ...demo.stats };

  const expForLevel = (level) => Math.floor(100 * Math.pow(level, 1.5));

  function levelFromExp(total) {
    let level = 1;
    let remaining = Math.max(0, total);
    while (level < 100) {
      const needed = expForLevel(level);
      if (remaining < needed) break;
      remaining -= needed;
      level += 1;
    }
    return { level, into: remaining, needed: expForLevel(level) };
  }

  function rankForLevel(level) {
    let found = RANKS[0];
    RANKS.forEach((rank) => { if (level >= rank.level) found = rank; });
    return found;
  }

  function clearDemoTimers() {
    demo.timers.forEach((timer) => clearTimeout(timer));
    demo.timers = [];
  }

  function showOverlay(el, duration = 1500) {
    if (!el) return;
    el.classList.add('is-show');
    const timer = setTimeout(() => el.classList.remove('is-show'), duration);
    demo.timers.push(timer);
  }

  function logDemo(html) {
    const log = $('#demoLog');
    if (log) log.innerHTML = `<span class="console__log-prompt">&gt;</span> ${html}`;
  }

  function updateTitles() {
    const cards = $$('.title-card');
    if (!cards.length) return;
    cards.forEach((card) => {
      const levelReq = Number(card.dataset.requires || 0);
      const statKey = card.dataset.stat;
      const statReq = Number(card.dataset.statReq || 0);
      const earned = levelReq
        ? demo.level >= levelReq
        : Boolean(statKey) && demo.stats[statKey] >= statReq;
      const wasEarned = card.classList.contains('is-earned');
      card.classList.toggle('is-earned', earned);
      const state = $('.title-card__state', card);
      if (state) state.textContent = earned ? 'EARNED' : 'LOCKED';
      if (earned && !wasEarned && card.dataset.title !== 'Iron Will') {
        card.classList.add('just-unlocked');
        const timer = setTimeout(() => card.classList.remove('just-unlocked'), 1400);
        demo.timers.push(timer);
      }
    });
    const count = $$('.title-card.is-earned').length;
    const counter = $('#earnedCount');
    if (counter) counter.textContent = String(count);
  }

  function syncDemo(previousLevel = demo.level) {
    const info = levelFromExp(demo.totalExp);
    demo.level = info.level;

    const levelEl = $('#demoLevel');
    const expText = $('#demoExpText');
    const expFill = $('#demoExpFill');
    const peek = $('#demoPeekLevel');
    const rankEl = $('#demoRank');

    if (levelEl) levelEl.textContent = pad(info.level);
    if (peek) peek.textContent = pad(info.level);
    if (expText) expText.textContent = `${Math.floor(info.into)} / ${info.needed}`;
    if (expFill) expFill.style.width = `${clamp((info.into / info.needed) * 100, 0, 100)}%`;

    if (rankEl) {
      const rank = rankForLevel(info.level);
      rankEl.textContent = rank.rank === 'N' ? 'NATIONAL' : `${rank.rank}-RANK`;
      rankEl.style.color = rank.color;
      rankEl.style.textShadow = `0 0 18px ${rank.color}55`;
    }

    // Chips
    $$('[data-stat-chip]').forEach((chip) => {
      const key = chip.dataset.statChip;
      const value = demo.stats[key];
      const b = $('b', chip);
      if (b) b.textContent = String(value);
    });

    // Stat rows + bars
    $$('[data-stat-row]').forEach((row) => {
      const key = row.dataset.statRow;
      const value = demo.stats[key];
      const b = $('b', row);
      const bar = $('.stat-bar i', row);
      if (b) b.textContent = String(value);
      if (bar) {
        bar.style.setProperty('--w', `${clamp((value / 50) * 100, 0, 100)}%`);
        bar.style.background = STAT_META.find((stat) => stat.key === key)?.color || 'var(--cyan)';
        bar.style.boxShadow = `0 0 12px ${STAT_META.find((stat) => stat.key === key)?.color || '#00D4FF'}66`;
      }
    });

    animateRadar(demo.stats);
    updateTitles();
    return demo.level > previousLevel;
  }

  function spawnFloatExp(quest, text) {
    const pill = document.createElement('span');
    pill.className = 'float-exp';
    pill.textContent = text;
    quest.appendChild(pill);
    setTimeout(() => pill.remove(), 1200);
  }

  function bumpChips(statKey) {
    const chip = $(`[data-stat-chip="${statKey}"]`);
    const row = $(`[data-stat-row="${statKey}"]`);
    if (chip) {
      chip.classList.add('is-bumped');
      setTimeout(() => chip.classList.remove('is-bumped'), 1300);
    }
    if (row) {
      row.classList.add('is-bumped');
      setTimeout(() => row.classList.remove('is-bumped'), 1300);
    }
  }

  function completeQuest(quest) {
    if (quest.classList.contains('is-done')) {
      logDemo('That quest is already cleared. The System does not pay twice.');
      return;
    }

    const exp = Number(quest.dataset.exp || 0);
    const statKey = quest.dataset.stat;
    const gain = Number(quest.dataset.gain || 0);
    const label = $('.trial-quest__body strong', quest)?.textContent || 'Quest';

    quest.classList.add('is-done');
    quest.setAttribute('aria-pressed', 'true');
    demo.totalExp += exp;
    if (statKey && demo.stats[statKey] !== undefined) demo.stats[statKey] += gain;

    spawnFloatExp(quest, `+${exp} EXP`);
    bumpChips(statKey);

    logDemo(
      `<span class="log-green">${label} complete.</span> +${exp} EXP${statKey ? ` · ${statKey.toUpperCase()} +${gain}` : ''}`
    );

    const quests = $$('.trial-quest');
    const allDone = quests.every((item) => item.classList.contains('is-done'));
    let bonus = 0;

    if (allDone && !demo.bonusAwarded) {
      const base = quests.reduce((sum, item) => sum + Number(item.dataset.exp || 0), 0);
      bonus = Math.floor(base * 0.1);
      demo.totalExp += bonus;
      demo.bonusAwarded = true;
      const bonusBox = $('#demoBonus');
      if (bonusBox) bonusBox.classList.add('is-earned');
      const bonusValue = $('#demoBonusValue');
      if (bonusValue) bonusValue.textContent = `+${bonus} EXP`;
      const bonusState = $('#demoBonusState');
      if (bonusState) bonusState.textContent = 'Full clear. All main exercises complete.';
      const timer = setTimeout(() => {
        logDemo(`<span class="log-gold">FULL CLEAR.</span> +${bonus} bonus EXP added. The System approves.`);
      }, 340);
      demo.timers.push(timer);
    }

    const previousLevel = demo.level;
    const leveledUp = syncDemo(previousLevel);

    if (leveledUp) {
      const timer = setTimeout(() => {
        const levelFlash = $('#levelFlash');
        const levelFlashText = $('#levelFlashText');
        if (levelFlashText) levelFlashText.textContent = `LEVEL ${pad(demo.level)}`;
        showOverlay(levelFlash, 1450);
        const rank = rankForLevel(demo.level);
        logDemo(`<span class="log-gold">LEVEL UP.</span> Level ${pad(demo.level)} reached · ${rank.label}`);
      }, 520);
      demo.timers.push(timer);
    }

    if (demo.level >= 5 && !demo.titleShown) {
      const timer = setTimeout(() => {
        demo.titleShown = true;
        showOverlay($('#titleFlash'), 1700);
        const arise = $('.title-card[data-title="Arise"]');
        if (arise) {
          arise.classList.add('just-unlocked');
          const cleanup = setTimeout(() => arise.classList.remove('just-unlocked'), 1400);
          demo.timers.push(cleanup);
        }
      }, 2100);
      demo.timers.push(timer);
    }

    if (bonus > 0) {
      toast(`Full clear. +${bonus} bonus EXP.`);
    }
  }

  function initDemo() {
    const quests = $$('.trial-quest');
    const reset = $('#demoReset');
    if (!quests.length) return;

    quests.forEach((quest) => {
      quest.addEventListener('click', () => completeQuest(quest));
    });

    if (reset) {
      reset.addEventListener('click', () => {
        clearDemoTimers();
        demo.totalExp = 0;
        demo.level = 1;
        demo.stats = { ...BASE_STATS };
        demo.bonusAwarded = false;
        demo.titleShown = false;
        radarState.display = { ...BASE_STATS };

        quests.forEach((quest) => {
          quest.classList.remove('is-done');
          quest.setAttribute('aria-pressed', 'false');
        });
        const bonusBox = $('#demoBonus');
        if (bonusBox) bonusBox.classList.remove('is-earned');
        const bonusValue = $('#demoBonusValue');
        if (bonusValue) bonusValue.textContent = '+10%';
        const bonusState = $('#demoBonusState');
        if (bonusState) bonusState.textContent = 'Locked until all three quests are complete.';
        const levelFlash = $('#levelFlash');
        const titleFlash = $('#titleFlash');
        if (levelFlash) levelFlash.classList.remove('is-show');
        if (titleFlash) titleFlash.classList.remove('is-show');

        renderRadar(BASE_STATS);
        syncDemo(1);
        logDemo('Trial reset. The System is ready.');
        toast('Trial reset. Run it back.');
      });
    }

    syncDemo(1);
  }

  /* ---------------------------------------------------------
     Title collection (initial state)
     --------------------------------------------------------- */
  function initTitles() {
    updateTitles();
  }

  /* ---------------------------------------------------------
     App screens gallery
     --------------------------------------------------------- */
  function initScreens() {
    const gallery = $('#screenGallery');
    const thumbs = $$('.screen-thumb');
    if (!gallery || !thumbs.length) return;

    const image = $('#screenImage');
    const indexEl = $('#screenIndex');
    const categoryEl = $('#screenCategory');
    const titleEl = $('#screenTitle');
    const descEl = $('#screenDesc');
    const prev = $('#screenPrev');
    const next = $('#screenNext');
    const dotsWrap = $('#screenDots');
    const stage = $('#screenStage');
    const dots = [];
    let index = 0;

    const show = (nextIndex) => {
      const target = ((nextIndex % thumbs.length) + thumbs.length) % thumbs.length;
      const active = thumbs[target];
      if (!active) return;
      index = target;

      if (image) {
        image.src = active.dataset.src;
        image.alt = active.dataset.alt;
      }
      if (indexEl) indexEl.textContent = pad(index + 1);
      if (categoryEl) categoryEl.textContent = active.dataset.category;
      if (titleEl) titleEl.textContent = active.dataset.title;
      if (descEl) descEl.textContent = active.dataset.desc;

      thumbs.forEach((thumb, i) => {
        const on = i === index;
        thumb.classList.toggle('is-active', on);
        thumb.setAttribute('aria-selected', String(on));
        thumb.tabIndex = on ? 0 : -1;
      });
      dots.forEach((dot, i) => {
        dot.classList.toggle('is-active', i === index);
        if (i === index) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
    };

    if (dotsWrap) {
      thumbs.forEach((thumb, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'screens__dot';
        dot.setAttribute('aria-label', `Go to screenshot ${i + 1}: ${thumb.dataset.title}`);
        dot.addEventListener('click', () => show(i));
        dotsWrap.appendChild(dot);
        dots.push(dot);
      });
    }

    thumbs.forEach((thumb, i) => {
      thumb.addEventListener('click', () => show(i));
      thumb.addEventListener('keydown', (event) => {
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
        event.preventDefault();
        const direction = event.key === 'ArrowRight' ? 1 : -1;
        const target = (i + direction + thumbs.length) % thumbs.length;
        show(target);
        thumbs[target].focus();
      });
    });

    if (prev) prev.addEventListener('click', () => show(index - 1));
    if (next) next.addEventListener('click', () => show(index + 1));

    if (stage) {
      stage.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          show(index + 1);
        } else if (event.key === 'ArrowLeft') {
          event.preventDefault();
          show(index - 1);
        }
      });

      let startX = null;
      stage.addEventListener('pointerdown', (event) => { startX = event.clientX; });
      stage.addEventListener('pointerup', (event) => {
        if (startX === null) return;
        const delta = event.clientX - startX;
        startX = null;
        if (Math.abs(delta) > 42) show(index + (delta < 0 ? 1 : -1));
      });
      stage.addEventListener('pointercancel', () => { startX = null; });
    }

    show(0);
  }

  /* ---------------------------------------------------------
     Countdown
     --------------------------------------------------------- */
  function initCountdown() {
    const timer = $('#challengeTimer');
    if (!timer) return;

    // Keep the challenge window stable across visits instead of resetting on reload.
    const key = 'svacraft:challengeEnd';
    const windowLength = ((11 * 24 + 6) * 60 + 42) * 60 * 1000 + 18 * 1000;
    let end = 0;
    try { end = Number(window.localStorage.getItem(key)) || 0; } catch (_) { /* storage unavailable */ }
    if (!end || end <= Date.now()) {
      end = Date.now() + windowLength;
      try { window.localStorage.setItem(key, String(end)); } catch (_) { /* storage unavailable */ }
    }

    const tick = () => {
      const remaining = Math.max(0, end - Date.now());
      if (remaining === 0) {
        timer.textContent = 'WINDOW CLOSED';
        return;
      }
      const days = Math.floor(remaining / 86400000);
      const hours = Math.floor((remaining % 86400000) / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      timer.textContent = `${days}d ${pad(hours)}h ${pad(minutes)}m`;
    };
    tick();
    setInterval(tick, 30000);
  }

  /* ---------------------------------------------------------
     Install modal
     --------------------------------------------------------- */
  function initModal() {
    const modal = $('#installModal');
    if (!modal) return;
    const dialog = $('.modal__dialog', modal);
    const openers = $$('[data-open-install]');
    const closers = $$('[data-close-modal]', modal);
    let lastFocus = null;

    const open = () => {
      lastFocus = document.activeElement;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('no-scroll');
      setTimeout(() => {
        const first = $('.modal__close', modal);
        if (first) first.focus();
      }, 80);
    };

    const close = () => {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('no-scroll');
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    };

    openers.forEach((button) => button.addEventListener('click', open));
    closers.forEach((button) => button.addEventListener('click', () => {
      close();
      if (button.tagName === 'A') {
        // Let the anchor scroll after the lock is released.
        const href = button.getAttribute('href');
        if (href && href.startsWith('#')) {
          const target = $(href);
          if (target) {
            setTimeout(() => target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' }), 20);
          }
        }
      }
    }));

    document.addEventListener('keydown', (event) => {
      if (!modal.classList.contains('is-open')) return;
      if (event.key === 'Escape') {
        close();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;
      const focusables = $$('a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])', dialog);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  /* ---------------------------------------------------------
     Copy-to-clipboard
     --------------------------------------------------------- */
  function fallbackCopy(text) {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
    area.remove();
    return ok;
  }

  function initCopy() {
    $$('.copy-btn').forEach((button) => {
      button.addEventListener('click', async () => {
        const text = button.dataset.copy || '';
        let copied = false;
        if (navigator.clipboard && window.isSecureContext) {
          try {
            await navigator.clipboard.writeText(text);
            copied = true;
          } catch (_) { copied = false; }
        }
        if (!copied) copied = fallbackCopy(text);
        toast(copied ? 'Command copied to clipboard.' : 'Could not copy — select the command manually.');
      });
    });
  }

  /* ---------------------------------------------------------
     Init
     --------------------------------------------------------- */
  function init() {
    const year = $('#year');
    if (year) year.textContent = String(new Date().getFullYear());

    initBoot();
    initNavigation();
    initReveals();
    initStarfield();
    initPointerFx();
    initRanks();
    initBelts();
    initRadar();
    initDemo();
    initTitles();
    initScreens();
    initCountdown();
    initModal();
    initCopy();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
