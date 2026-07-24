/* ── STARTUP SCREEN ── */
(function () {
  const screen  = document.getElementById('startupScreen');
  const canvas  = document.getElementById('startupCanvas');
  const fill    = document.getElementById('suLoaderFill');
  const label   = document.getElementById('suLoaderLabel');
  const ctx     = canvas.getContext('2d');

  const DURATION = 3000; // ms total screen time
  const stages   = [
    { at: 0,    pct: 0,   text: 'INITIALISING' },
    { at: 0.18, pct: 22,  text: 'LOCATING JHB' },
    { at: 0.38, pct: 48,  text: 'MAPPING NODES' },
    { at: 0.62, pct: 71,  text: 'CONNECTING WORLD' },
    { at: 0.82, pct: 92,  text: 'ALMOST READY' },
    { at: 0.95, pct: 100, text: 'LAUNCHING' },
  ];

  // World cities as [x%, y%] on the 1000×500 map viewBox, scaled to canvas
  const cities = [
    { name: 'JHB',    x: 490, y: 310, home: true  }, // Johannesburg — home node
    { name: 'NYC',    x: 180, y: 140 },
    { name: 'LON',    x: 436, y: 100 },
    { name: 'PAR',    x: 455, y: 105 },
    { name: 'DXB',    x: 555, y: 155 },
    { name: 'MUM',    x: 600, y: 175 },
    { name: 'TYO',    x: 790, y: 130 },
    { name: 'SYD',    x: 800, y: 330 },
    { name: 'SAO',    x: 215, y: 330 },
    { name: 'LAG',    x: 455, y: 225 },
    { name: 'SIN',    x: 700, y: 215 },
    { name: 'PEK',    x: 730, y: 110 },
  ];

  // Animated connections: [from, to, delay ms]
  const connections = [
    [0,1,300],[0,2,500],[0,3,650],[0,4,800],[0,5,950],
    [0,6,1100],[0,7,1300],[0,8,1500],[0,9,600],[0,10,1200],[0,11,1400],
    [1,2,1600],[2,3,1700],[4,5,1750],[5,6,1800],[6,11,1850],[10,7,1900],
    [8,1,2000],[9,4,2100],[3,4,2150],
  ];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Map from SVG viewBox (0-1000 x 0-500) to canvas pixels
  function mapX(svgX) { return (svgX / 1000) * canvas.width; }
  function mapY(svgY) { return (svgY / 500) * canvas.height; }

  // Each connection animates a travelling dot along the path
  const activeConns = [];
  let startTime = null;

  connections.forEach(([fi, ti, delay]) => {
    setTimeout(() => {
      activeConns.push({ fi, ti, progress: 0, done: false });
    }, delay);
  });

  // Floating ambient nodes
  const floatNodes = Array.from({ length: 40 }, () => ({
    x: Math.random() * 1000,
    y: Math.random() * 500,
    r: 0.8 + Math.random() * 1.2,
    vx: (Math.random() - 0.5) * 0.2,
    vy: (Math.random() - 0.5) * 0.2,
    alpha: 0.05 + Math.random() * 0.12,
  }));

  function draw(ts) {
    if (!startTime) startTime = ts;
    const elapsed = ts - startTime;
    const t = Math.min(elapsed / DURATION, 1);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update loader bar + label
    let stagePct = 0, stageTxt = 'INITIALISING';
    for (const s of stages) {
      if (t >= s.at) { stagePct = s.pct; stageTxt = s.text; }
    }
    fill.style.width = stagePct + '%';
    label.textContent = stageTxt;

    // Float ambient dots
    floatNodes.forEach(n => {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > 1000) n.vx *= -1;
      if (n.y < 0 || n.y > 500)  n.vy *= -1;
      ctx.beginPath();
      ctx.arc(mapX(n.x), mapY(n.y), n.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,197,63,${n.alpha})`;
      ctx.fill();
    });

    // Draw completed connection lines
    activeConns.forEach(c => {
      const fx = mapX(cities[c.fi].x), fy = mapY(cities[c.fi].y);
      const tx = mapX(cities[c.ti].x), ty = mapY(cities[c.ti].y);

      if (!c.done) {
        c.progress = Math.min(c.progress + 0.018, 1);
        if (c.progress >= 1) c.done = true;
      }

      const ex = fx + (tx - fx) * c.progress;
      const ey = fy + (ty - fy) * c.progress;

      // Drawn line
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = 'rgba(255,197,63,0.18)';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Travelling dot
      if (!c.done) {
        ctx.beginPath();
        ctx.arc(ex, ey, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#FFC53F';
        ctx.fill();

        // Trail glow
        ctx.beginPath();
        ctx.arc(ex, ey, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,197,63,0.15)';
        ctx.fill();
      }
    });

    // Draw city nodes
    cities.forEach((c, i) => {
      const cx = mapX(c.x), cy = mapY(c.y);
      const isHome = c.home;
      const r = isHome ? 5 : 3;

      // Outer pulse ring (only home + connected)
      const isConnected = activeConns.some(a => (a.fi === i || a.ti === i) && a.progress > 0);
      if (isConnected || isHome) {
        const pulse = 0.5 + 0.5 * Math.sin(ts * 0.003 + i);
        ctx.beginPath();
        ctx.arc(cx, cy, r + 4 + pulse * 4, 0, Math.PI * 2);
        ctx.strokeStyle = isHome ? `rgba(255,197,63,${0.12 + pulse * 0.1})` : `rgba(255,197,63,${0.06 + pulse * 0.06})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Core dot
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = isHome ? '#FFC53F' : 'rgba(255,197,63,0.7)';
      ctx.fill();

      // City label
      ctx.font = isHome
        ? `700 ${Math.max(9, canvas.width * 0.009)}px JetBrains Mono, monospace`
        : `400 ${Math.max(7, canvas.width * 0.007)}px JetBrains Mono, monospace`;
      ctx.fillStyle = isHome ? '#FFC53F' : 'rgba(255,197,63,0.5)';
      ctx.fillText(c.name, cx + r + 4, cy + 4);
    });

    if (t < 1) {
      requestAnimationFrame(draw);
    } else {
      // Exit
      screen.classList.add('exit');
      setTimeout(() => {
        screen.classList.add('gone');
        document.body.style.overflow = '';
      }, 850);
    }
  }

  // Lock scroll while screen is up
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(draw);
})();

/* ── Network Background ── */
(function () {
  const canvas = document.getElementById('codeRain');
  const ctx    = canvas.getContext('2d');

  const NODE_COUNT   = 90;
  const MAX_DIST     = 160;   // max distance to draw a line
  const NODE_RADIUS  = 2.5;
  const SPEED        = 0.45;
  // thermal heat scale: cold indigo -> magenta -> orange -> peak yellow
  const HEAT = [
    'rgba(59,15,143,VAL)',
    'rgba(224,33,138,VAL)',
    'rgba(255,107,26,VAL)',
    'rgba(255,197,63,VAL)',
  ];
  const LINE_COLOR   = 'rgba(224,33,138,VAL)';

  let nodes = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function initNodes() {
    nodes = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x:  Math.random() * canvas.width,
        y:  Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * SPEED,
        vy: (Math.random() - 0.5) * SPEED,
        r:  NODE_RADIUS + Math.random() * 1.5,
        c:  HEAT[Math.floor(Math.random() * HEAT.length)],
      });
    }
  }

  resize();
  initNodes();
  window.addEventListener('resize', () => { resize(); initNodes(); });

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // move nodes
    nodes.forEach(n => {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > canvas.width)  n.vx *= -1;
      if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
    });

    // draw lines between close nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx   = nodes[i].x - nodes[j].x;
        const dy   = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          const alpha = (1 - dist / MAX_DIST) * 0.5;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = LINE_COLOR.replace('VAL', alpha.toFixed(3));
          ctx.lineWidth   = (1 - dist / MAX_DIST) * 1.2;
          ctx.stroke();
        }
      }
    }

    // draw nodes
    nodes.forEach(n => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = n.c.replace('VAL', '0.5');
      ctx.fill();

      // subtle glow ring
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r + 3, 0, Math.PI * 2);
      ctx.strokeStyle = n.c.replace('VAL', '0.12');
      ctx.lineWidth   = 1;
      ctx.stroke();
    });

    requestAnimationFrame(draw);
  }

  draw();
})();

/* ── Typewriter ── */
(function () {
  const el = document.getElementById('typewriter');
  const phrases = [
    'Websites that win clients.',
    'AI chatbots that never sleep.',
    'Systems that run your business.',
    'Hosting & monitoring, handled.',
    'Clear pricing. Real results.',
  ];
  let pi = 0, ci = 0, del = false;

  function tick() {
    const p = phrases[pi];
    if (!del) {
      el.textContent = p.slice(0, ++ci);
      if (ci === p.length) { del = true; setTimeout(tick, 1800); return; }
    } else {
      el.textContent = p.slice(0, --ci);
      if (ci === 0) { del = false; pi = (pi + 1) % phrases.length; }
    }
    setTimeout(tick, del ? 45 : 80);
  }
  tick();
})();

/* ── Scroll reveal ── */
(function () {
  const io = new IntersectionObserver(
    entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
    { threshold: 0.1 }
  );
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
})();

/* ── Skill bars (bento) ── */
(function () {
  const io = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) {
        const bar = e.target.querySelector('.sb-bar');
        if (bar) bar.style.width = bar.dataset.w + '%';
        io.unobserve(e.target);
      }
    }),
    { threshold: 0.2 }
  );
  document.querySelectorAll('.sb-card').forEach(el => io.observe(el));
})();

/* ── Counters ── */
(function () {
  const io = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) {
        const el = e.target;
        const target = parseInt(el.dataset.target);
        if (isNaN(target)) return;
        let cur = 0;
        const step = target / 40;
        const t = setInterval(() => {
          cur = Math.min(cur + step, target);
          el.textContent = Math.floor(cur);
          if (cur >= target) clearInterval(t);
        }, 30);
        io.unobserve(el);
      }
    }),
    { threshold: 0.5 }
  );
  document.querySelectorAll('.ms-num[data-target]').forEach(el => io.observe(el));
})();

/* ── Navbar scroll ── */
(function () {
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    nav.style.borderBottomColor = window.scrollY > 40 ? '#252525' : 'transparent';
  }, { passive: true });
})();

/* ── Mobile menu ── */
(function () {
  const btn   = document.getElementById('menuBtn');
  const menu  = document.getElementById('mobileMenu');
  const close = document.getElementById('menuClose');
  const links = document.querySelectorAll('.mobile-link');

  btn.addEventListener('click', () => menu.classList.add('open'));
  close.addEventListener('click', () => menu.classList.remove('open'));
  links.forEach(l => l.addEventListener('click', () => menu.classList.remove('open')));
})();

/* ── Contact form — sends via FormSubmit, falls back to mailto ── */
(function () {
  const form = document.getElementById('contactForm');
  const btn  = form.querySelector('.lg-submit');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const name    = document.getElementById('name').value;
    const email   = document.getElementById('email').value;
    const subject = document.getElementById('subject').value || 'Project Enquiry';
    const message = document.getElementById('message').value;

    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Sending…';

    try {
      const res = await fetch('https://formsubmit.co/ajax/juniormazibuko18@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          name, email, message,
          _subject: subject + ' — from ' + name + ' (JUNYA WEB site)',
        }),
      });
      if (!res.ok) throw new Error('send failed');
      btn.innerHTML = 'Sent ✓ — I\'ll reply within 24h';
      form.reset();
      setTimeout(() => { btn.innerHTML = original; btn.disabled = false; }, 5000);
    } catch (err) {
      // fallback: open the visitor's mail app instead
      const sub  = encodeURIComponent(subject + ' — from ' + name);
      const body = encodeURIComponent(message + '\n\nFrom: ' + name + ' <' + email + '>');
      window.location.href = `mailto:juniormazibuko18@gmail.com?subject=${sub}&body=${body}`;
      btn.innerHTML = original;
      btn.disabled = false;
    }
  });
})();

/* ── SERVICES — unlock pricing via WhatsApp ── */
(function () {
  const WA_NUMBER = '27691035144';

  function unlockUrl(pkgName) {
    const msg = `Hi JUNYA WEB,\n\nI want the "${pkgName}" package — let's get started. Please send me the next steps.`;
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
  }

  document.querySelectorAll('.svc-card').forEach(card => {
    const name = card.dataset.name;

    // whole card is clickable
    card.addEventListener('click', () => {
      window.open(unlockUrl(name), '_blank');
    });
  });
})();


/* ── THEME TOGGLE ── */
(function () {
  const btn  = document.getElementById('themeToggle');
  const moon = btn.querySelector('.icon-moon');
  const sun  = btn.querySelector('.icon-sun');

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    moon.style.display = theme === 'dark' ? 'none' : '';
    sun.style.display  = theme === 'dark' ? '' : 'none';
    localStorage.setItem('junya-theme', theme);
  }

  apply(localStorage.getItem('junya-theme') || 'dark');
  btn.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    apply(cur === 'dark' ? 'light' : 'dark');
  });
})();

/* ── SCROLL PROGRESS ── */
(function () {
  const bar = document.getElementById('scrollProgress');
  window.addEventListener('scroll', () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
  }, { passive: true });
})();

/* ── MAGNETIC BUTTONS ── */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const STRENGTH = 0.35;
  document.querySelectorAll('.cta-primary, .cta-github, .cta-instagram, .cta-x, .gh-button, .sqs-wa-btn, .lg-submit, .proof-cta-btn').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${dx * STRENGTH}px, ${dy * STRENGTH}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });
})();

/* ── 3D CARD TILT ── */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const MAX_TILT = 6;
  document.querySelectorAll('.svc-card, .sb-card, .proof-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(700px) rotateY(${px * MAX_TILT}deg) rotateX(${-py * MAX_TILT}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();

/* ── TEXT SCRAMBLE on section headings ── */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const CHARS = '!<>-_\\/[]{}—=+*^?#ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  function scramble(el) {
    const original = el.textContent;
    let frame = 0;
    const total = 24;
    const timer = setInterval(() => {
      frame++;
      const progress = frame / total;
      el.textContent = original.split('').map((ch, i) => {
        if (ch === ' ') return ' ';
        if (i < original.length * progress) return ch;
        return CHARS[Math.floor(Math.random() * CHARS.length)];
      }).join('');
      if (frame >= total) { el.textContent = original; clearInterval(timer); }
    }, 35);
  }

  const seen = new WeakSet();
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && !seen.has(e.target)) {
        seen.add(e.target);
        scramble(e.target);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.section-heading').forEach(el => io.observe(el));
})();

/* ── LIVE GITHUB STATS ── */
(function () {
  const wrap = document.getElementById('ghLive');
  const text = document.getElementById('ghLiveText');
  fetch('https://api.github.com/users/Junyadoingthings/repos?per_page=100&sort=pushed')
    .then(r => { if (!r.ok) throw new Error('rate limited'); return r.json(); })
    .then(repos => {
      if (!Array.isArray(repos) || !repos.length) return;
      const latest = repos[0];
      const when = new Date(latest.pushed_at).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' }).toUpperCase();
      text.textContent = `LIVE FROM GITHUB — ${repos.length} PUBLIC REPOS · LATEST PUSH: ${latest.name.toUpperCase()} (${when})`;
      wrap.hidden = false;
    })
    .catch(() => { /* stay hidden if API unavailable */ });
})();

/* ── COMMAND PALETTE (Ctrl/Cmd+K) ── */
(function () {
  const overlay  = document.getElementById('cmdk');
  const backdrop = document.getElementById('cmdkBackdrop');
  const input    = document.getElementById('cmdkInput');
  const list     = document.getElementById('cmdkList');
  const hint     = document.getElementById('cmdkHint');

  const commands = [
    { label: 'Go to About',      hintTxt: '01', run: () => scrollToId('about') },
    { label: 'Go to Skills',     hintTxt: '02', run: () => scrollToId('skills') },
    { label: 'Go to Projects',   hintTxt: '03', run: () => scrollToId('projects') },
    { label: 'Go to Client Work',hintTxt: '03b',run: () => scrollToId('proof') },
    { label: 'Go to Pricing',    hintTxt: '04', run: () => scrollToId('services') },
    { label: 'Go to Reviews',    hintTxt: '05', run: () => scrollToId('reviews') },
    { label: 'Go to Contact',    hintTxt: '05', run: () => scrollToId('contact') },
    { label: 'Open GitHub',      hintTxt: '↗',  run: () => window.open('https://github.com/Junyadoingthings', '_blank') },
    { label: 'Open Instagram',   hintTxt: '↗',  run: () => window.open('https://www.instagram.com/junyaa._/', '_blank') },
    { label: 'Open X (Twitter)', hintTxt: '↗',  run: () => window.open('https://x.com/junya_tweets', '_blank') },
    { label: 'Message on WhatsApp', hintTxt: '↗', run: () => window.open('https://wa.me/27691035144', '_blank') },
    { label: 'Send an Email',    hintTxt: '↗',  run: () => { window.location.href = 'mailto:juniormazibuko18@gmail.com'; } },
    { label: 'Toggle Dark Mode', hintTxt: '◐',  run: () => document.getElementById('themeToggle').click() },
    { label: 'Copy Site Link',   hintTxt: '⧉',  run: () => navigator.clipboard && navigator.clipboard.writeText(location.href) },
  ];

  let filtered = commands.slice();
  let selected = 0;

  function scrollToId(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  function render() {
    list.innerHTML = '';
    filtered.forEach((cmd, i) => {
      const li = document.createElement('li');
      li.className = 'cmdk-item' + (i === selected ? ' active' : '');
      li.innerHTML = `<span>${cmd.label}</span><em>${cmd.hintTxt}</em>`;
      li.addEventListener('click', () => { cmd.run(); close(); });
      li.addEventListener('mouseenter', () => { selected = i; render(); });
      list.appendChild(li);
    });
    if (!filtered.length) {
      list.innerHTML = '<li class="cmdk-empty">No matches</li>';
    }
  }

  function open() {
    overlay.classList.add('open');
    input.value = '';
    filtered = commands.slice();
    selected = 0;
    render();
    setTimeout(() => input.focus(), 30);
  }

  function close() {
    overlay.classList.remove('open');
  }

  input.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    filtered = commands.filter(c => c.label.toLowerCase().includes(q));
    selected = 0;
    render();
  });

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      overlay.classList.contains('open') ? close() : open();
      return;
    }
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowDown') { e.preventDefault(); selected = Math.min(selected + 1, filtered.length - 1); render(); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); selected = Math.max(selected - 1, 0); render(); }
    if (e.key === 'Enter' && filtered[selected]) { filtered[selected].run(); close(); }
  });

  backdrop.addEventListener('click', close);
  hint.addEventListener('click', open);
})();

/* ── SERVICE WORKER (PWA) ── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

/* ── PROJECT PEEK — cursor-following site preview ── */
(function () {
  const peek = document.getElementById('projPeek');
  if (!peek || window.matchMedia('(hover: none)').matches) return;
  const img = peek.querySelector('img');
  let raf;

  document.querySelectorAll('.proj-row[data-shot]').forEach(row => {
    row.addEventListener('mouseenter', () => {
      img.src = row.dataset.shot;
      peek.classList.add('on');
    });
    row.addEventListener('mouseleave', () => peek.classList.remove('on'));
    row.addEventListener('mousemove', e => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const px = Math.min(e.clientX + 28, window.innerWidth - 350);
        const py = Math.max(16, Math.min(e.clientY - 120, window.innerHeight - 280));
        peek.style.transform = `translate(${px}px, ${py}px)`;
      });
    });
  });
})();
