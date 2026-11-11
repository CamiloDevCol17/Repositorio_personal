(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(pointer: fine)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const BASE_BG = '#0b0b0c';

  /* ---------- split hero letters ---------- */
  $$('.hero__title .split').forEach(el => {
    const t = el.textContent;
    el.textContent = '';
    [...t].forEach(c => {
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = c;
      el.appendChild(s);
    });
  });

  /* ---------- split about statement into words ---------- */
  const statement = $('#statement');
  if (statement) {
    const words = statement.textContent.trim().split(/\s+/);
    statement.innerHTML = words.map(w => `<span class="w">${w}</span>`).join(' ');
  }

  /* ---------- clock ---------- */
  const clock = $('#clock');
  const tick = () => {
    try {
      const t = new Intl.DateTimeFormat('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'America/Bogota' }).format(new Date());
      clock.textContent = `Medellín ${t}`;
    } catch (e) { /* noop */ }
  };
  tick(); setInterval(tick, 1000);

  /* ---------- toast ---------- */
  const toast = $('#toast');
  let toastT;
  const showToast = msg => {
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toast.classList.remove('is-on'), 2200);
  };

  /* ---------- copy email ---------- */
  const EMAIL = 'devcamilo1@gmail.com';
  const copyEmail = async () => {
    try { await navigator.clipboard.writeText(EMAIL); showToast('Correo copiado ✓'); }
    catch (e) {
      const ta = document.createElement('textarea'); ta.value = EMAIL; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); showToast('Correo copiado ✓'); } catch (_) { showToast(EMAIL); }
      ta.remove();
    }
  };
  $('#copyBtn')?.addEventListener('click', copyEmail);

  /* ---------- hero field (interactive dot matrix) ---------- */
  const canvas = $('#field');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, dpr = 1, dots = [], running = true, t0 = performance.now();
    const pointer = { x: -9999, y: -9999, active: false, last: 0 };
    const ghost = { x: 0, y: 0 };

    const build = () => {
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const gap = W < 600 ? 22 : 28;
      dots = [];
      for (let y = gap / 2; y < H; y += gap) {
        for (let x = gap / 2; x < W; x += gap) dots.push({ bx: x, by: y, x, y, vx: 0, vy: 0 });
      }
    };

    const setPointer = e => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
      pointer.active = true; pointer.last = performance.now();
    };
    window.addEventListener('pointermove', setPointer, { passive: true });
    window.addEventListener('pointerdown', setPointer, { passive: true });

    const draw = now => {
      if (!running) return;
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      // ghost pointer when idle (keeps it alive on phones)
      const idle = !pointer.active || now - pointer.last > 2500;
      ghost.x = W * (0.55 + 0.35 * Math.sin(t * 0.35));
      ghost.y = H * (0.45 + 0.3 * Math.sin(t * 0.52 + 1.3));
      const px = idle ? ghost.x : pointer.x;
      const py = idle ? ghost.y : pointer.y;
      const R = W < 600 ? 120 : 180;
      const R2 = R * R;

      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        const dx = d.x - px, dy = d.y - py;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < R2) {
          const dist = Math.sqrt(dist2) || 1;
          const f = (1 - dist / R) * 2.2;
          d.vx += (dx / dist) * f; d.vy += (dy / dist) * f;
        }
        d.vx += (d.bx - d.x) * 0.06; d.vy += (d.by - d.y) * 0.06;
        d.vx *= 0.82; d.vy *= 0.82;
        d.x += d.vx; d.y += d.vy;

        const wave = 0.5 + 0.5 * Math.sin(t * 1.2 - d.bx * 0.012 + d.by * 0.008);
        const near = dist2 < R2 ? 1 - Math.sqrt(dist2) / R : 0;
        const size = 1 + near * 2.6 + wave * 0.5;
        if (near > 0.05) {
          ctx.fillStyle = `rgba(255,90,31,${0.25 + near * 0.75})`;
        } else {
          ctx.fillStyle = `rgba(236,232,225,${0.07 + wave * 0.11})`;
        }
        ctx.fillRect(d.x - size / 2, d.y - size / 2, size, size);
      }
      requestAnimationFrame(draw);
    };

    build();
    let rT; window.addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(build, 150); });
    if (!reduced) {
      const io = new IntersectionObserver(([e]) => {
        const was = running; running = e.isIntersecting;
        if (running && !was) requestAnimationFrame(draw);
      });
      io.observe(canvas);
      requestAnimationFrame(draw);
    } else {
      running = false;
      ctx.fillStyle = 'rgba(236,232,225,.12)';
      dots.forEach(d => ctx.fillRect(d.x, d.y, 1.4, 1.4));
    }
  }

  /* ---------- menu ---------- */
  const burger = $('#burger'), menu = $('#menu');
  const setMenu = open => {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', !open);
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));

  /* ---------- smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    if (hasGSAP) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(time => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = time => { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  $$('[data-link]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (!id || !id.startsWith('#')) return;
    const target = $(id);
    if (!target) return;
    e.preventDefault();
    const wasOpen = menu.classList.contains('is-open');
    if (wasOpen) setMenu(false);
    const go = () => lenis ? lenis.scrollTo(target, { offset: 0, duration: 1.4 }) : target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    wasOpen ? setTimeout(go, 350) : go();
  }));

  /* ---------- nav + progress ---------- */
  const nav = $('#nav'), bar = $('#progressBar');
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    nav.classList.toggle('is-scrolled', y > 40);
    if (!menu.classList.contains('is-open')) nav.classList.toggle('is-hidden', y > lastY && y > 300);
    lastY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- cursor ---------- */
  if (fine && !reduced) {
    const cur = $('.cursor'), dot = $('.cursor__dot'), ring = $('.cursor__ring'), label = $('#cursorLabel');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    window.addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`; }, { passive: true });
    const loop = () => { rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16; ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`; requestAnimationFrame(loop); };
    loop();
    $$('a,button,input,[data-cursor]').forEach(el => {
      el.addEventListener('pointerenter', () => {
        const l = el.dataset.cursor;
        if (l) { label.textContent = l; cur.classList.add('is-label'); } else cur.classList.add('is-hover');
      });
      el.addEventListener('pointerleave', () => cur.classList.remove('is-hover', 'is-label'));
    });
    document.addEventListener('pointerleave', () => cur.style.opacity = 0);
    document.addEventListener('pointerenter', () => cur.style.opacity = 1);
  }

  /* ---------- magnetic + tilt ---------- */
  if (fine && !reduced) {
    $$('.magnetic').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.25}px,${y * 0.35}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1)'; el.style.transform = ''; setTimeout(() => el.style.transition = '', 600); });
    });
    $$('.tilt, .card-id').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.transform = `perspective(1200px) rotateY(${(x - .5) * 8}deg) rotateX(${(.5 - y) * 8}deg)`;
        el.style.setProperty('--mx', `${x * 100}%`); el.style.setProperty('--my', `${y * 100}%`);
      });
      el.addEventListener('pointerleave', () => { el.style.transition = 'transform .8s cubic-bezier(.16,1,.3,1)'; el.style.transform = ''; setTimeout(() => el.style.transition = '', 800); });
    });
  }

  /* ---------- count up ---------- */
  const fmt = n => n.toLocaleString('es-CO');
  const countUp = el => {
    if (el.dataset.done) return; el.dataset.done = 1;
    const end = +el.dataset.count; if (reduced) { el.textContent = fmt(end); return; }
    const dur = 1400, s = performance.now();
    const step = now => {
      const p = Math.min(1, (now - s) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(Math.round(end * e));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  /* ---------- terminal ---------- */
  const body = $('#termBody'), form = $('#termForm'), input = $('#termIn');
  const history = []; let hIdx = 0;
  const C = {
    ayuda: () => `Comandos disponibles:
  <span class="t-acc">sobre</span>      quién soy
  <span class="t-acc">proyectos</span>  lo que he construido
  <span class="t-acc">vigia</span>      el proyecto maestro
  <span class="t-acc">stack</span>      herramientas
  <span class="t-acc">estudios</span>   formación
  <span class="t-acc">contacto</span>   cómo escribirme
  <span class="t-acc">whatsapp</span>   chat directo
  <span class="t-acc">linkedin</span>   perfil profesional
  <span class="t-acc">cafe</span>       combustible
  <span class="t-acc">limpiar</span>    borra la pantalla`,
    help: () => C.ayuda(),
    sobre: () => `Camilo Andrés Valderrama Alzate · 22 años
Desarrollador de software en Medellín, Colombia.
Me gusta el software con impacto real: transparencia, servicio y experiencias.`,
    proyectos: () => `<span class="t-ok">●</span> 01 Vigía ............ contratación pública · SECOP II   <a href="https://anticorrupcion-estatal-1.onrender.com/" target="_blank" rel="noopener">abrir</a>
<span class="t-ok">●</span> 02 HelpDesk ITSM .... mesa de ayuda · SLA · Round-Robin  <a href="https://helpdeskco.netlify.app/" target="_blank" rel="noopener">abrir</a>
<span class="t-ok">●</span> 03 Explora Colombia . agencia de viajes · 12 paquetes   <a href="https://exploraco.netlify.app/" target="_blank" rel="noopener">abrir</a>`,
    vigia: () => `<span class="t-acc">VIGÍA</span> — expediente de contratación pública
› fuente: datos abiertos SECOP II
› 58.160 contratos · 2.404 entidades · 54.191 proveedores
› filtros, gráficas en el tiempo, rankings y alertas de riesgo
<span class="t-dim">Las cifras no constituyen acusación contra ninguna entidad o proveedor.</span>`,
    stack: () => `front    HTML · CSS · JavaScript
datos    SQL · datos abiertos · dashboards
diseño   UML · requisitos · Trello · mockups
deploy   Netlify · Render · Git
redes    Cisco Packet Tracer · LAN / WiFi`,
    estudios: () => `Tecnología en Desarrollo de Software
Institución Universitaria Pascual Bravo — Medellín
Semestre 05 <span class="t-acc">█████</span><span class="t-dim">░</span> en curso`,
    contacto: () => `correo    <a href="mailto:devcamilo1@gmail.com">devcamilo1@gmail.com</a>
whatsapp  <a href="https://wa.me/573013129658" target="_blank" rel="noopener">+57 301 312 9658</a> (abrir chat)
linkedin  <a href="https://www.linkedin.com/in/camilo-valderrama-dev" target="_blank" rel="noopener">in/camilo-valderrama-dev</a>
ciudad    Medellín, CO (UTC−5)
<span class="t-ok">✓</span> disponible para nuevas oportunidades laborales`,
    whatsapp: () => `WhatsApp: <a href="https://wa.me/573013129658" target="_blank" rel="noopener">+57 301 312 9658</a> (iniciar chat)`,
    linkedin: () => `LinkedIn: <a href="https://www.linkedin.com/in/camilo-valderrama-dev" target="_blank" rel="noopener">linkedin.com/in/camilo-valderrama-dev</a>`,
    cafe: () => `   ( (
    ) )
  ........
  |      |]
  \\      /    café antioqueño cargado — productividad +40%
   '----'`,
    sudo: () => `<span class="t-acc">permiso denegado:</span> esta terminal solo obedece a buenas ideas.`,
    hola: () => `¡Hola! Qué bueno tenerte por aquí. Escribe <span class="t-acc">ayuda</span>.`,
    whoami: () => `visitante@curioso — y eso ya dice mucho de ti.`,
  };
  const print = (html, cls) => { const p = document.createElement('p'); if (cls) p.className = cls; p.innerHTML = html; body.appendChild(p); body.scrollTop = body.scrollHeight; };
  const run = raw => {
    const cmd = raw.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (!cmd) return;
    history.push(raw); hIdx = history.length;
    print(`<span class="t-acc">❯</span> <span class="t-cmd">${raw.replace(/</g, '&lt;')}</span>`);
    const key = cmd.split(' ')[0];
    if (key === 'limpiar' || key === 'clear') { body.innerHTML = ''; return; }
    if (key === 'sudo') { print(C.sudo()); return; }
    if (C[key]) print(C[key]());
    else print(`comando no encontrado: <span class="t-acc">${key.replace(/</g, '&lt;')}</span> — prueba <b>ayuda</b>`, 't-dim');
  };
  form.addEventListener('submit', e => { e.preventDefault(); run(input.value); input.value = ''; });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp' && history.length) { hIdx = Math.max(0, hIdx - 1); input.value = history[hIdx]; e.preventDefault(); }
    if (e.key === 'ArrowDown' && history.length) { hIdx = Math.min(history.length, hIdx + 1); input.value = history[hIdx] || ''; e.preventDefault(); }
  });
  $$('.term__chips button').forEach(b => b.addEventListener('click', () => run(b.dataset.cmd)));

  /* ---------- no GSAP fallback ---------- */
  const loader = $('.loader');
  if (!hasGSAP) {
    loader && loader.remove();
    $$('[data-count]').forEach(countUp);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- intro ---------- */
  const chars = $$('.hero__title .ch');
  const intro = () => {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to(loader, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' })
      .from(chars, { yPercent: 115, rotate: 6, duration: 1.3, stagger: 0.025 }, '-=0.55')
      .from('.hero__badge', { scale: 0, rotate: -180, duration: 1.2 }, '-=1.0')
      .from('.reveal-line', { opacity: 0, y: 24, duration: 1, stagger: 0.12 }, '-=1.0')
      .add(() => loader.remove());
  };

  if (reduced) { loader.remove(); }
  else {
    const num = $('#loaderNum'), lb = $('#loaderBar'), log = $('#loaderLog');
    const msgs = ['› cargando módulos…', '› conectando con SECOP II…', '› asignando tickets (round-robin)…', '› empacando maletas…', '› listo.'];
    const obj = { v: 0 };
    gsap.to(obj, {
      v: 100, duration: 1.9, ease: 'power2.inOut',
      onUpdate: () => {
        const v = Math.round(obj.v);
        num.textContent = String(v).padStart(3, '0');
        lb.style.width = v + '%';
        log.textContent = msgs[Math.min(msgs.length - 1, Math.floor(v / 21))];
      },
      onComplete: intro
    });
  }

  /* hero parallax out */
  if (!reduced) {
    gsap.to('.hero__inner', { yPercent: -18, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__field', { yPercent: 25, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* section titles reveal */
  $$('.section-title, .caps__title').forEach(el => {
    gsap.from(el, { opacity: 0, y: 40, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
  });

  /* about statement scrub */
  const ws = $$('#statement .w');
  if (ws.length && !reduced) {
    gsap.set(ws, { opacity: 0.14 });
    gsap.to(ws, { opacity: 1, stagger: 0.05, ease: 'none', scrollTrigger: { trigger: '#statement', start: 'top 80%', end: 'bottom 45%', scrub: true } });
  }

  /* caps */
  gsap.from('.cap', { opacity: 0, x: 30, duration: 1, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.caps__list', start: 'top 80%' } });
  gsap.from('.card-id', { opacity: 0, rotate: -4, y: 60, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.about__grid', start: 'top 80%' } });

  /* terminal */
  gsap.from('.term', { opacity: 0, y: 60, scale: 0.96, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.term', start: 'top 85%' } });

  /* contact */
  gsap.from('.contact__title .split-word', { yPercent: 100, opacity: 0, rotate: 4, duration: 1.3, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: '.contact__title', start: 'top 85%' } });
  gsap.from('.contact__row, .contact__note', { opacity: 0, y: 30, duration: 1, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: '.contact__row', start: 'top 90%' } });

  /* ---------- projects ---------- */
  const track = $('#track');
  const panels = $$('.panel');
  const setBg = c => { document.body.style.backgroundColor = c; };

  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
    const dist = () => track.scrollWidth - window.innerWidth;
    const hTween = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: '.work__pin', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
        onLeave: () => setBg(BASE_BG), onLeaveBack: () => setBg(BASE_BG)
      }
    });
    panels.forEach((p, i) => {
      const info = p.querySelector('.panel__info'), vis = p.querySelector('.panel__visual'), phone = p.querySelector('.phone');
      ScrollTrigger.create({
        trigger: p, containerAnimation: i === 0 ? undefined : hTween,
        start: i === 0 ? 'top 60%' : 'left 60%', end: i === 0 ? 'bottom top' : 'right 40%',
        onToggle: s => { if (s.isActive) setBg(p.dataset.bg); },
        onEnter: () => p.querySelectorAll('[data-count]').forEach(countUp)
      });
      if (i > 0) {
        gsap.from(info.children, { opacity: 0, x: 80, stagger: 0.05, ease: 'none', scrollTrigger: { trigger: p, containerAnimation: hTween, start: 'left 95%', end: 'left 35%', scrub: true } });
        gsap.from(vis, { xPercent: 20, rotate: 3, ease: 'none', scrollTrigger: { trigger: p, containerAnimation: hTween, start: 'left right', end: 'left left', scrub: true } });
      } else {
        gsap.from(info.children, { opacity: 0, y: 40, stagger: 0.07, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: p, start: 'top 75%' } });
        gsap.from(vis, { opacity: 0, y: 80, rotate: 2, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: p, start: 'top 75%' } });
      }
      gsap.fromTo(phone, { y: 60 }, { y: -30, ease: 'none', scrollTrigger: { trigger: p, containerAnimation: i === 0 ? undefined : hTween, start: i === 0 ? 'top bottom' : 'left right', end: i === 0 ? 'bottom top' : 'right left', scrub: true } });
    });
    return () => setBg(BASE_BG);
  });

  mm.add('(max-width: 900px), (prefers-reduced-motion: reduce)', () => {
    panels.forEach(p => {
      ScrollTrigger.create({
        trigger: p, start: 'top 55%', end: 'bottom 45%',
        onToggle: s => { if (s.isActive) setBg(p.dataset.bg); },
        onEnter: () => p.querySelectorAll('[data-count]').forEach(countUp),
        onLeave: () => { if (p === panels[panels.length - 1]) setBg(BASE_BG); },
        onLeaveBack: () => { if (p === panels[0]) setBg(BASE_BG); }
      });
      if (!reduced) {
        gsap.from(p.querySelector('.frame'), { clipPath: 'inset(12% 12% 12% 12% round 14px)', scale: 0.92, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: p, start: 'top 85%' } });
        gsap.from(p.querySelector('.phone'), { y: 80, opacity: 0, duration: 1.4, ease: 'expo.out', delay: 0.2, scrollTrigger: { trigger: p, start: 'top 85%' } });
        gsap.from(p.querySelector('.panel__info').children, { opacity: 0, y: 30, stagger: 0.06, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: p.querySelector('.panel__info'), start: 'top 88%' } });
      }
    });
    return () => setBg(BASE_BG);
  });

  ScrollTrigger.create({ trigger: '#sobre', start: 'top 70%', onEnter: () => setBg(BASE_BG), onLeaveBack: () => setBg(panels[panels.length - 1].dataset.bg) });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
