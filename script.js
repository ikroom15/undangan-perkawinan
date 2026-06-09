/* ══════════════════════════════════════════════════════════════
   SCRIPT.JS — Undangan Digital Premium
   Murni vanilla JS: gate formalitas, typing animation,
   cosmos canvas, countdown, scroll reveal, galeri
══════════════════════════════════════════════════════════════ */
'use strict';

/* ── INIT ──────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  populateConfig();
  initCosmos();
  initGate();
});

/* ══════════════════════════════════════════════════════════════
   POPULATE — isi semua elemen dari CONFIG
══════════════════════════════════════════════════════════════ */
function populateConfig() {
  const G = CONFIG.groom, B = CONFIG.bride;

  // Gate
  setText('gtGroom', G.shortName);
  setText('gtBride', B.shortName);
  setText('gtDate',  CONFIG.eventDateDisplay);

  // Hero
  setText('hGroom', G.shortName);
  setText('hBride', B.shortName);
  setText('hDate',  CONFIG.eventDateDisplay);

  // Couple
  setSrc('photoGroom', G.photo);
  setSrc('photoBride', B.photo);
  setSrc('photoCouple', CONFIG.couplePhoto);
  setText('pGroomName',   G.shortName);
  setText('pGroomFather', G.father);
  setText('pGroomMother', G.mother);
  setText('pBrideName',   B.shortName);
  setText('pBrideFather', B.father);
  setText('pBrideMother', B.mother);
  setText('coupleCaption', `${G.shortName} & ${B.shortName}`);

  // Event
  setText('evDate',      CONFIG.eventDateDisplay);
  setText('evTime',      CONFIG.eventTimeDisplay);
  setText('evVenueName', CONFIG.venueName);
  setText('evAddress',   CONFIG.venueAddress);

  // Maps
  const mBtn = document.getElementById('mapsBtn');
  if (mBtn) mBtn.href = CONFIG.googleMapsLink;
  setText('mapAddrDisplay', CONFIG.venueAddress);

  // QR
  setSrc('qrImg', CONFIG.qrCodeImage);
  setText('qrName', `a/n ${CONFIG.qrAccountName}`);

  // Closing
  setText('closeSig', `${G.shortName} & ${B.shortName}`);

  // Countdown subtitle
  setText('cdSub', `${CONFIG.eventDateDisplay} · ${CONFIG.eventTimeDisplay}`);

  // Countdown datetime subtitle
  document.getElementById('cdSub').textContent =
    `${CONFIG.eventDateDisplay}  ·  ${CONFIG.eventTimeDisplay}`;

  // Verses
  buildVerses();

}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el && val != null) el.textContent = val;
}
function setSrc(id, src) {
  const el = document.getElementById(id);
  if (el && src) el.src = src;
}

/* ── Build Verse Cards ──────────────────────────────────── */
function buildVerses() {
  const wrap = document.getElementById('versesWrap');
  if (!wrap) return;
  CONFIG.verses.forEach((v) => {
    const card = document.createElement('div');
    card.className = 'verse-card reveal-up';
    card.innerHTML = `
      <span class="verse-ornament" aria-hidden="true">☾</span>
      <p class="verse-arabic">${v.arabic}</p>
      <p class="verse-translation">"${v.translation}"</p>
      <p class="verse-source">— ${v.source}</p>
    `;
    wrap.appendChild(card);
  });
}

/* ══════════════════════════════════════════════════════════════
   COSMOS CANVAS — bintang & nebula partikel bergerak
══════════════════════════════════════════════════════════════ */
function initCosmos() {
  const canvas = document.getElementById('cosmosCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, stars = [], nebulas = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  // Generate stars
  for (let i = 0; i < 120; i++) {
    stars.push({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.2 + .2,
      o: Math.random() * .6 + .1,
      twinkleSpeed: Math.random() * .6 + .2,
      twinkleOffset: Math.random() * Math.PI * 2,
    });
  }

  // Generate nebula blobs
  for (let i = 0; i < 6; i++) {
    nebulas.push({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 180 + 60,
      o: Math.random() * .04 + .01,
      speed: (Math.random() - .5) * .00015,
      dx: (Math.random() - .5) * .00008,
      dy: (Math.random() - .5) * .00008,
    });
  }

  // Shooting stars
  let shooters = [];
  function spawnShooter() {
    shooters.push({
      x: Math.random() * W,
      y: Math.random() * H * .5,
      len: Math.random() * 100 + 60,
      speed: Math.random() * 6 + 4,
      angle: Math.PI / 4 + (Math.random() - .5) * .4,
      life: 1, decay: Math.random() * .02 + .015,
    });
  }
  setInterval(spawnShooter, 3500);

  let t = 0;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    t += .016;

    // Nebulas
    nebulas.forEach(n => {
      n.x += n.dx; n.y += n.dy;
      if (n.x < 0) n.x = 1; if (n.x > 1) n.x = 0;
      if (n.y < 0) n.y = 1; if (n.y > 1) n.y = 0;
      const g = ctx.createRadialGradient(n.x*W, n.y*H, 0, n.x*W, n.y*H, n.r);
      g.addColorStop(0, `rgba(200,168,75,${n.o})`);
      g.addColorStop(.5, `rgba(160,120,48,${n.o*.4})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(n.x*W, n.y*H, n.r, 0, Math.PI*2);
      ctx.fill();
    });

    // Stars
    stars.forEach(s => {
      const o = s.o * (.5 + .5 * Math.sin(t * s.twinkleSpeed + s.twinkleOffset));
      ctx.beginPath();
      ctx.arc(s.x*W, s.y*H, s.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(230,200,110,${o})`;
      ctx.fill();
    });

    // Shooting stars
    shooters = shooters.filter(s => s.life > 0);
    shooters.forEach(s => {
      const ex = s.x + Math.cos(s.angle) * s.len;
      const ey = s.y + Math.sin(s.angle) * s.len;
      const g = ctx.createLinearGradient(s.x, s.y, ex, ey);
      g.addColorStop(0, `rgba(240,216,130,0)`);
      g.addColorStop(.4, `rgba(240,216,130,${s.life * .7})`);
      g.addColorStop(1, `rgba(240,216,130,0)`);
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      s.x += Math.cos(s.angle) * s.speed;
      s.y += Math.sin(s.angle) * s.speed;
      s.life -= s.decay;
    });

    requestAnimationFrame(draw);
  }
  draw();
}

/* ══════════════════════════════════════════════════════════════
   GATE — formalitas nama tamu
══════════════════════════════════════════════════════════════ */
function initGate() {
  const form       = document.getElementById('gateForm');
  const input      = document.getElementById('guestInput');
  const verifyPanel= document.getElementById('verifyPanel');
  const typingEl   = document.getElementById('verifyTyping');
  const openBtn    = document.getElementById('openBtn');
  const shell      = document.getElementById('inputShell');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const rawName = input.value.trim();
    const name    = rawName || 'Tamu Undangan';

    // Efek shake jika kosong
    if (!rawName) {
      shell.style.animation = 'none';
      requestAnimationFrame(() => {
        shell.style.animation = 'shakeField .4s ease';
      });
      return;
    }

    // Sembunyikan form, tampilkan verify panel
    form.style.transition = 'opacity .4s, transform .4s';
    form.style.opacity    = '0';
    form.style.transform  = 'translateY(-10px)';

    setTimeout(() => {
      form.hidden        = true;
      verifyPanel.hidden = false;

      // Typing animation
      typeVerification(name, typingEl, () => {
        // Setelah teks selesai, tampilkan tombol buka
        openBtn.hidden = false;
        openBtn.style.animation = 'openPulse 2.2s ease-in-out infinite';
      });

    }, 380);
  });

  openBtn.addEventListener('click', () => openInvitation());
}

/* ── Typing effect ──────────────────────────────────────── */
function typeVerification(name, el, onComplete) {
  // Teks yang akan diketik karakter per karakter
  const lines = [
    `Selamat datang,`,
    `✦  ${name}  ✦`,
    ``,
    `Nama Anda telah terverifikasi`,
    `di database kami.`,
    ``,
    `Kami dengan penuh suka cita`,
    `mengundang kehadiran Anda.`,
  ];

  el.innerHTML = '';
  let lineIdx = 0, charIdx = 0;
  let fullText = lines.join('\n');
  let displayed = '';

  // Render with span coloring
  function renderEl() {
    // Split by \n and wrap second "line" (name) in gold
    const parts = displayed.split('\n');
    el.innerHTML = parts.map((p, i) => {
      if (i === 1 && p.length) return `<span style="color:var(--gold-100);font-size:1.15em;display:block;letter-spacing:.04em">${escHtml(p)}</span>`;
      if (p === '') return `<br/>`;
      return `<span>${escHtml(p)}</span><br/>`;
    }).join('');
  }

  // Speeds
  const charDelay = (char) => {
    if (char === '\n') return 180;
    if ('.،,!؟?'.includes(char)) return 90;
    return 28 + Math.random() * 22;
  };

  function typeNext() {
    if (charIdx >= fullText.length) {
      onComplete && onComplete();
      return;
    }
    displayed += fullText[charIdx];
    charIdx++;
    renderEl();
    setTimeout(typeNext, charDelay(fullText[charIdx - 1]));
  }

  // Brief pause before typing starts
  setTimeout(typeNext, 400);
}

/* ── Open Invitation ────────────────────────────────────── */
function openInvitation() {
  const gate = document.getElementById('gate');
  const inv  = document.getElementById('inv');

  // PERBAIKAN UTAMA: Putar musik SEGERA setelah tombol diklik (tanpa jeda setTimeout)
  // Ini mendominasi aturan browser karena terjadi langsung di dalam tumpukan interaksi user (user-initiated gesture).
  playAudio();

  gate.classList.add('exit');

  setTimeout(() => {
    gate.style.display = 'none';
    inv.hidden = false;
    inv.removeAttribute('aria-hidden');
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Aktifkan semua fitur invitation
    initCountdown();
    initScrollReveal();
  }, 800);
}

/* ── Audio ─────────────────────────────────────────────── */
function playAudio() {
  const a = document.getElementById('bgAudio');
  if (!a || !CONFIG.audioSrc) return;
  a.play().catch((error) => { 
    console.log("Pemutaran audio otomatis diblokir atau gagal:", error); 
  });
}

/* ══════════════════════════════════════════════════════════════
   COUNTDOWN — digital futuristik dengan glitch update
══════════════════════════════════════════════════════════════ */
function initCountdown() {
  const target = new Date(CONFIG.eventDateISO).getTime();

  // Glitch flash on digit change
  function glitchEl(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.textShadow = '0 0 12px #fff, 0 0 30px rgba(232,204,114,.8)';
    setTimeout(() => { el.style.textShadow = ''; }, 120);
  }

  let prev = { d: '', h: '', m: '', s: '' };

  function tick() {
    const diff = target - Date.now();

    if (diff <= 0) {
      ['cdD','cdH','cdM','cdS'].forEach(id => setText(id, '00'));
      const sub = document.getElementById('cdSub');
      if (sub) {
        sub.textContent = '🎉 Hari Bahagia Telah Tiba!';
        sub.style.color = 'var(--gold-100)';
        sub.style.fontSize = '1rem';
      }
      return;
    }

    const d = String(Math.floor(diff / 86400000)).padStart(2,'0');
    const h = String(Math.floor(diff % 86400000 / 3600000)).padStart(2,'0');
    const m = String(Math.floor(diff % 3600000 / 60000)).padStart(2,'0');
    const s = String(Math.floor(diff % 60000 / 1000)).padStart(2,'0');

    if (d !== prev.d) { setText('cdD', d); glitchEl('cdD'); prev.d = d; }
    if (h !== prev.h) { setText('cdH', h); glitchEl('cdH'); prev.h = h; }
    if (m !== prev.m) { setText('cdM', m); glitchEl('cdM'); prev.m = m; }
    if (s !== prev.s) { setText('cdS', s); glitchEl('cdS'); prev.s = s; }

    // Sync glitch data attr for CSS
    ['cdD','cdH','cdM','cdS'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.closest('.cd-glitch')?.setAttribute('data-text', el.textContent);
    });

    setTimeout(tick, 1000);
  }
  tick();
}

/* ══════════════════════════════════════════════════════════════
   SCROLL REVEAL — reveal-up, reveal-fade, reveal-left, reveal-right
   Dua arah: masuk saat scroll turun, keluar saat scroll naik
══════════════════════════════════════════════════════════════ */
function initScrollReveal() {
  const selectors = '.reveal-up, .reveal-fade, .reveal-left, .reveal-right';
  const targets   = document.querySelectorAll(`#inv ${selectors}`);

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      } else {
        // Lepas kelas supaya animasi ulang saat scroll naik
        entry.target.classList.remove('is-visible');
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px',
  });

  targets.forEach(el => obs.observe(el));

  // Hero langsung tampil
  const heroInner = document.querySelector('.hero-inner');
  if (heroInner) {
    setTimeout(() => heroInner.classList.add('is-visible'), 100);
  }
}

/* ── Helpers ─────────────────────────────────────────────── */
function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── CSS dinamis untuk shake field ─────────────────────── */
(function injectDynamicCSS() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shakeField {
      0%,100%{ transform: translateX(0); }
      20%    { transform: translateX(-8px); }
      40%    { transform: translateX(8px); }
      60%    { transform: translateX(-5px); }
      80%    { transform: translateX(5px); }
    }
  `;
  document.head.appendChild(style);
})();
