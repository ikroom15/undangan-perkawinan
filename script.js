/* ══════════════════════════════════════════════════════════════
   SCRIPT.JS — Undangan Digital
   Fitur: Firebase (guest list + comments), EmailJS, countdown,
          scroll animations, particle stars, gallery slide effect
══════════════════════════════════════════════════════════════ */

'use strict';

/* ── GLOBALS ─────────────────────────────────────────────── */
let db;                    // Firestore instance
let currentGuestName = ''; // nama tamu yang sudah login
let commentsUnsubscribe;   // Firestore realtime listener cleanup

/* ══════════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initFirebase();
  populateStaticContent();
  initParticles();
  initGate();
});

/* ══════════════════════════════════════════════════════════════
   FIREBASE INIT
══════════════════════════════════════════════════════════════ */
function initFirebase() {
  try {
    firebase.initializeApp(CONFIG.firebase);
    db = firebase.firestore();
  } catch (e) {
    console.error('[Firebase] Gagal inisialisasi:', e);
  }
}

/* ══════════════════════════════════════════════════════════════
   POPULATE STATIC CONTENT FROM CONFIG
══════════════════════════════════════════════════════════════ */
function populateStaticContent() {
  const G = CONFIG.groom, B = CONFIG.bride;

  // Gate
  setText('g-groom-short', G.nameScript);
  setText('g-bride-short', B.nameScript);
  setText('g-date', CONFIG.eventDateDisplay);

  // Hero
  setText('h-salam', CONFIG.openingGreeting);
  setText('h-groom', G.nameScript);
  setText('h-bride', B.nameScript);
  setText('h-date', CONFIG.eventDateDisplay);

  // Couple section
  setText('p-groom-name', G.nameScript);
  setText('p-groom-father', G.father);
  setText('p-groom-mother', G.mother);
  setText('p-bride-name', B.nameScript);
  setText('p-bride-father', B.father);
  setText('p-bride-mother', B.mother);

  // Photos
  setSrc('photo-groom', CONFIG.photos.groom);
  setSrc('photo-bride',  CONFIG.photos.bride);
  setSrc('gal-groom',    CONFIG.photos.groom);
  setSrc('gal-bride',    CONFIG.photos.bride);
  setSrc('gal-couple',   CONFIG.photos.couple);
  setSrc('qr-img',       CONFIG.photos.qrCode);

  // Event detail
  setText('ev-date',       CONFIG.eventDateDisplay);
  setText('ev-time',       CONFIG.eventTimeDisplay);
  setText('ev-venue-name', CONFIG.venueName);
  setText('ev-address',    CONFIG.venueAddress);

  // Maps
  const mapIframe = document.getElementById('mapIframe');
  if (mapIframe) mapIframe.src = CONFIG.googleMapsEmbed;

  const mapsBtn = document.getElementById('mapsBtn');
  if (mapsBtn) {
    mapsBtn.href        = CONFIG.googleMapsLink;
    mapsBtn.textContent = CONFIG.mapsButtonText;
  }
  setText('maps-addr-text', CONFIG.venueAddress);

  // Gift
  setText('gift-account', `a/n ${CONFIG.groom.name.split(' ').slice(-2).join(' ')} & ${CONFIG.bride.name.split(' ')[0]}`);

  // Closing
  setText('close-msg',      CONFIG.closingMessage);
  setText('close-wassalam', CONFIG.closingWassalam);
  setText('cs-groom',       G.nameScript);
  setText('cs-bride',       B.nameScript);

  // Countdown subtitle
  setText('cd-subtitle', `${CONFIG.eventDateDisplay} | ${CONFIG.eventTimeDisplay}`);

  // Quran verses
  buildVerses();

  // Audio source
  const audio = document.getElementById('bgAudio');
  if (audio) audio.src = CONFIG.audioSrc;
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
function setSrc(id, src) {
  const el = document.getElementById(id);
  if (el) el.src = src;
}

/* ── Build Quran Verses ─────────────────────────────────── */
function buildVerses() {
  const container = document.getElementById('versesContainer');
  if (!container) return;
  CONFIG.quranVerses.forEach((v, i) => {
    const card = document.createElement('div');
    card.className = 'verse-card anim-up';
    card.innerHTML = `
      <span class="verse-ornament">☽</span>
      <p class="verse-arabic">${v.arabic}</p>
      <p class="verse-translation">"${v.translation}"</p>
      <p class="verse-source">— ${v.source}</p>
    `;
    container.appendChild(card);
  });
}

/* ══════════════════════════════════════════════════════════════
   PARTICLE STARS (canvas)
══════════════════════════════════════════════════════════════ */
function initParticles() {
  const canvas = document.getElementById('starsCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  for (let i = 0; i < 80; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + .3,
      o: Math.random(),
      speed: Math.random() * .3 + .05,
      dir: Math.random() * Math.PI * 2,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,168,75,${p.o * .6})`;
      ctx.fill();
      p.x += Math.cos(p.dir) * p.speed;
      p.y += Math.sin(p.dir) * p.speed;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
    });
    requestAnimationFrame(draw);
  }
  draw();
}

/* ══════════════════════════════════════════════════════════════
   GATE LOGIC
══════════════════════════════════════════════════════════════ */
function initGate() {
  const nameInput  = document.getElementById('inp-name');
  const phoneInput = document.getElementById('inp-phone');
  const submitBtn  = document.getElementById('submitBtn');
  const submitText = document.getElementById('submitBtnText');
  const spinner    = document.getElementById('submitSpinner');
  const statusBox  = document.getElementById('statusBox');
  const openInvBtn = document.getElementById('openInvBtn');

  // Enter key triggers submit
  [nameInput, phoneInput].forEach(el => {
    el.addEventListener('keydown', e => { if (e.key === 'Enter') submitBtn.click(); });
  });

  // Phone: hanya angka
  phoneInput.addEventListener('input', () => {
    phoneInput.value = phoneInput.value.replace(/\D/g, '');
  });

  submitBtn.addEventListener('click', async () => {
    const name  = nameInput.value.trim();
    const phone = phoneInput.value.trim();

    // Validasi input
    if (!name || name.length < 2) {
      showStatus('Mohon masukkan nama lengkap Anda.', 'err'); return;
    }
    if (!phone || phone.length < 9) {
      showStatus('Mohon masukkan nomor WhatsApp yang valid.', 'err'); return;
    }

    setLoading(true);

    try {
      const result = await processGuest(name, phone);

      if (result.status === 'full') {
        showStatus('Mohon maaf, kapasitas tamu sudah penuh (1000 tamu). Silakan hubungi panitia.', 'err');
        setLoading(false); return;
      }

      // Pesan sukses
      showStatus(
        `✓ Selamat, nama Anda <strong>${escHtml(name)}</strong> terverifikasi menjadi tamu undangan dengan nama <strong>${escHtml(name)}</strong> dan nomor WA <strong>${escHtml(phone)}</strong>.<br/><br/>Klik di bawah untuk melanjutkan membuka undangan.`,
        'ok'
      );

      // Simpan nama ke global + localStorage
      currentGuestName = name;
      try { localStorage.setItem('inv_guest_name', name); } catch(_){}

      // Tampilkan tombol buka undangan
      openInvBtn.hidden = false;
      submitBtn.disabled = true;

      // Kirim email jika tamu baru (tidak duplikat)
      if (result.status === 'new') {
        sendEmailNotification(name, phone, result.guestNumber).catch(e => {
          console.warn('[EmailJS] Email gagal:', e);
        });
      }

    } catch (e) {
      console.error('[Gate] Error:', e);
      showStatus('Terjadi kesalahan. Silakan coba lagi.', 'err');
    }

    setLoading(false);
  });

  openInvBtn.addEventListener('click', openInvitation);

  function showStatus(html, type) {
    statusBox.innerHTML = html;
    statusBox.className = `status-box ${type}`;
    statusBox.hidden = false;
  }

  function setLoading(on) {
    submitBtn.disabled  = on;
    submitText.hidden   = on;
    spinner.hidden      = !on;
  }
}

/* ── Process Guest (Firebase) ─────────────────────────────── */
async function processGuest(name, phone) {
  if (!db) throw new Error('Firestore tidak tersedia');

  const guestsRef = db.collection('guests');

  // Cek duplikasi
  const dupSnap = await guestsRef
    .where('name',  '==', name)
    .where('phone', '==', phone)
    .limit(1)
    .get();

  if (!dupSnap.empty) {
    // Sudah pernah daftar — langsung lanjut, tidak kirim email ulang
    return { status: 'duplicate' };
  }

  // Cek batas 1000 tamu
  const countSnap = await guestsRef.get();
  const total = countSnap.size;

  if (total >= CONFIG.maxGuests) {
    return { status: 'full' };
  }

  const guestNumber = total + 1;

  // Simpan tamu baru
  await guestsRef.add({
    name,
    phone,
    guestNumber,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
  });

  return { status: 'new', guestNumber };
}

/* ── Send EmailJS ──────────────────────────────────────────── */
async function sendEmailNotification(name, phone, guestNumber) {
  emailjs.init(CONFIG.emailjs.publicKey);
  await emailjs.send(
    CONFIG.emailjs.serviceId,
    CONFIG.emailjs.templateId,
    {
      to_email:     CONFIG.emailjs.toEmail,
      guest_number: guestNumber,
      guest_name:   name,
      guest_phone:  phone,
      event_name:   `Pernikahan ${CONFIG.groom.name} & ${CONFIG.bride.name}`,
      event_date:   CONFIG.eventDateDisplay,
    }
  );
}

/* ── Open Invitation ──────────────────────────────────────── */
function openInvitation() {
  const gate = document.getElementById('gate');
  const inv  = document.getElementById('invitation');

  gate.classList.add('fade-out');

  setTimeout(() => {
    gate.style.display = 'none';
    inv.removeAttribute('hidden');
    inv.removeAttribute('aria-hidden');

    // Scroll ke atas
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Putar musik
    playMusic();

    // Init semua fitur
    initCountdown();
    initScrollObserver();
    initGallerySlide();
    initComments();

  }, 700);
}

/* ══════════════════════════════════════════════════════════════
   MUSIC
══════════════════════════════════════════════════════════════ */
function playMusic() {
  const audio = document.getElementById('bgAudio');
  if (!audio || !CONFIG.audioSrc) return;
  // src sudah diset saat populate
  const p = audio.play();
  if (p !== undefined) {
    p.catch(() => {
      // Browser block autoplay — OK, musik tidak wajib
    });
  }
}

/* ══════════════════════════════════════════════════════════════
   COUNTDOWN
══════════════════════════════════════════════════════════════ */
function initCountdown() {
  const target = new Date(CONFIG.eventDateTime).getTime();

  function tick() {
    const now  = Date.now();
    const diff = target - now;

    if (diff <= 0) {
      // Hari pernikahan!
      ['cd-days','cd-hours','cd-mins','cd-secs'].forEach(id => setText(id, '00'));
      const subtitle = document.getElementById('cd-subtitle');
      if (subtitle) {
        subtitle.textContent = '🎉 Hari Bahagia Telah Tiba!';
        subtitle.style.color = 'var(--gold-hi)';
        subtitle.style.fontSize = '1rem';
      }
      return;
    }

    const days  = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins  = Math.floor((diff % 3600000)  / 60000);
    const secs  = Math.floor((diff % 60000)    / 1000);

    setText('cd-days',  String(days).padStart(2,  '0'));
    setText('cd-hours', String(hours).padStart(2, '0'));
    setText('cd-mins',  String(mins).padStart(2,  '0'));
    setText('cd-secs',  String(secs).padStart(2,  '0'));

    setTimeout(tick, 1000);
  }
  tick();
}

/* ══════════════════════════════════════════════════════════════
   SCROLL OBSERVER — generic fade-up elements
══════════════════════════════════════════════════════════════ */
function initScrollObserver() {
  const targets = document.querySelectorAll('#invitation .anim-up, #invitation .anim-fade');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

  targets.forEach(el => obs.observe(el));
}

/* ══════════════════════════════════════════════════════════════
   GALLERY SLIDE IN/OUT (kiri & kanan, dua arah)
══════════════════════════════════════════════════════════════ */
function initGallerySlide() {
  const items = document.querySelectorAll('.gallery-item');
  if (!items.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      const el = e.target;
      const isLeft  = el.classList.contains('slide-from-left');
      const isRight = el.classList.contains('slide-from-right');

      if (e.isIntersecting) {
        // Slide masuk ke tengah
        el.classList.add('slide-in');
        el.classList.remove('slide-out-left', 'slide-out-right');
      } else {
        // Slide keluar ke sisi masing-masing
        el.classList.remove('slide-in');
        if (isLeft)  el.classList.add('slide-out-left');
        if (isRight) el.classList.add('slide-out-right');
      }
    });
  }, { threshold: 0.2 });

  items.forEach(el => obs.observe(el));
}

/* ══════════════════════════════════════════════════════════════
   COMMENTS — Firebase Realtime
══════════════════════════════════════════════════════════════ */
function initComments() {
  if (!db) {
    document.getElementById('commentLoading').innerHTML =
      '<p style="color:var(--text-muted);font-size:.82rem">Fitur komentar tidak tersedia (Firebase belum dikonfigurasi).</p>';
    return;
  }

  // Set author name
  const authorEl = document.getElementById('commentAuthor');
  if (authorEl) authorEl.textContent = currentGuestName || 'Tamu';

  // Char counter
  const textarea  = document.getElementById('commentText');
  const charCount = document.getElementById('commentChars');
  textarea.addEventListener('input', () => {
    charCount.textContent = `${textarea.value.length}/400`;
  });

  // Submit komentar
  document.getElementById('commentSubmitBtn').addEventListener('click', submitComment);

  // Realtime listener
  loadComments();
}

async function submitComment() {
  const textarea = document.getElementById('commentText');
  const btn      = document.getElementById('commentSubmitBtn');
  const text     = textarea.value.trim();

  if (!text) return;
  if (!currentGuestName) return;

  btn.disabled = true;
  btn.textContent = 'Mengirim…';

  try {
    await db.collection('comments').add({
      name:      currentGuestName,
      text,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });
    textarea.value = '';
    document.getElementById('commentChars').textContent = '0/400';
  } catch (e) {
    console.error('[Comment] Gagal kirim:', e);
    alert('Gagal mengirim komentar. Silakan coba lagi.');
  }

  btn.disabled = false;
  btn.textContent = 'Kirim Doa ✦';
}

function loadComments() {
  const listEl    = document.getElementById('commentList');
  const loadingEl = document.getElementById('commentLoading');

  if (commentsUnsubscribe) commentsUnsubscribe();

  commentsUnsubscribe = db.collection('comments')
    .orderBy('timestamp', 'desc')
    .limit(100)
    .onSnapshot(snapshot => {

      if (loadingEl) loadingEl.remove();

      // Hapus item lama kecuali form
      document.querySelectorAll('.comment-item').forEach(el => el.remove());
      document.querySelector('.comment-empty')?.remove();

      if (snapshot.empty) {
        const empty = document.createElement('p');
        empty.className = 'comment-empty';
        empty.textContent = 'Belum ada doa & ucapan. Jadilah yang pertama! ✦';
        listEl.appendChild(empty);
        return;
      }

      snapshot.forEach(doc => {
        const d = doc.data();
        const item = document.createElement('div');
        item.className = 'comment-item';
        item.innerHTML = `
          <div class="comment-item-header">
            <span class="comment-item-name">${escHtml(d.name)}</span>
            <span class="comment-item-time">${formatTime(d.timestamp?.toDate())}</span>
          </div>
          <p class="comment-item-text">${escHtml(d.text)}</p>
        `;
        listEl.appendChild(item);
      });

    }, err => {
      console.error('[Comments] Listener error:', err);
    });
}

/* ── Helpers ──────────────────────────────────────────────── */
function escHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatTime(date) {
  if (!date) return '';
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'baru saja';
  if (diff < 3600) return `${Math.floor(diff/60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff/3600)} jam lalu`;
  return date.toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' });
}
