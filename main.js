// ═══════════════════════════════════════════
// hhee studio letter — interactions
// ═══════════════════════════════════════════

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── 헤더: 스크롤 시 배경 ──────────────────
const header = document.getElementById('header');
if (header) {
  const onScrollHeader = () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();
}

// ── 스크롤 리빌 ──────────────────────────
const revealEls = document.querySelectorAll('.reveal, .collage-item');
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
);
revealEls.forEach((el) => {
  // 형제끼리 살짝 시차를 준다
  const siblings = el.parentElement
    ? [...el.parentElement.children].filter(
        (c) => c.classList.contains('reveal') || c.classList.contains('collage-item')
      )
    : [el];
  const idx = siblings.indexOf(el);
  if (idx > 0) el.style.setProperty('--reveal-delay', `${Math.min(idx * 0.12, 0.5)}s`);
  io.observe(el);
});

// ── 매니페스토: 스크롤 위치 따라 문장이 밝아짐 ──
const scrubLines = [...document.querySelectorAll('.scrub-line')];
let ticking = false;
const scrub = () => {
  const vh = window.innerHeight;
  scrubLines.forEach((line) => {
    const rect = line.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    // 화면의 82% 지점에서 어둡고, 45% 지점에 오면 완전히 밝아진다
    const progress = Math.min(Math.max((vh * 0.82 - center) / (vh * 0.37), 0), 1);
    line.style.opacity = (0.13 + progress * 0.87).toFixed(3);
  });
  ticking = false;
};
if (!reducedMotion && scrubLines.length) {
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(scrub);
        ticking = true;
      }
    },
    { passive: true }
  );
  scrub();
}

// ── 히어로 로테이터 ──────────────────────
const rotatorWords = [...document.querySelectorAll('.rotator-word')];
if (rotatorWords.length > 1 && !reducedMotion) {
  let current = 0;
  setInterval(() => {
    const prev = rotatorWords[current];
    current = (current + 1) % rotatorWords.length;
    const next = rotatorWords[current];
    prev.classList.remove('is-active');
    prev.classList.add('is-leaving');
    next.classList.remove('is-leaving');
    // 리플로우로 transition 초기 상태를 확정한 뒤 활성화
    void next.offsetWidth;
    next.classList.add('is-active');
    setTimeout(() => prev.classList.remove('is-leaving'), 700);
  }, 2600);
}

// ── 패럴랙스 (뷰포트 중앙 기준 상대 이동) ──
const parallaxEls = [...document.querySelectorAll('[data-speed]')];
if (parallaxEls.length && !reducedMotion) {
  let pTicking = false;
  const applied = new WeakMap();
  const parallax = () => {
    const vh = window.innerHeight;
    parallaxEls.forEach((el) => {
      const speed = parseFloat(el.dataset.speed || '0.1');
      const rect = el.getBoundingClientRect();
      // rect에는 직전 translate가 포함돼 있으므로 빼서 원위치 기준으로 계산
      const prev = applied.get(el) || 0;
      const center = rect.top - prev + rect.height / 2;
      const delta = (vh / 2 - center) * speed;
      applied.set(el, delta);
      el.style.translate = `0 ${delta.toFixed(1)}px`;
    });
    pTicking = false;
  };
  const queue = () => {
    if (!pTicking) {
      requestAnimationFrame(parallax);
      pTicking = true;
    }
  };
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  parallax();
}

// ── 자석 버튼 ────────────────────────────
if (!reducedMotion && matchMedia('(pointer: fine)').matches) {
  document.querySelectorAll('.magnetic').forEach((btn) => {
    const strength = 0.3;
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
      btn.style.transform = 'translate(0, 0)';
      setTimeout(() => (btn.style.transition = ''), 500);
    });
  });
}

// ── 모바일 메뉴 ──────────────────────────
const menuToggle = document.getElementById('menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');
if (menuToggle && mobileMenu) {
  const setMenu = (open) => {
    menuToggle.setAttribute('aria-expanded', String(open));
    mobileMenu.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  menuToggle.addEventListener('click', () =>
    setMenu(!mobileMenu.classList.contains('is-open'))
  );
  mobileMenu.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => setMenu(false))
  );
}

// ── 구독 폼 (프론트 전용) ─────────────────
const form = document.getElementById('subscribe-form');
const done = document.getElementById('subscribe-done');
const emailInput = document.getElementById('email');

if (form && emailInput && done) {
  emailInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    const field = emailInput.closest('.field');

    if (!valid) {
      field.classList.remove('is-error');
      void field.offsetWidth;
      field.classList.add('is-error');
      emailInput.focus();
      return;
    }

    // 아직 발송 서비스 미연결 — 임시로 브라우저에만 저장
    try {
      const list = JSON.parse(localStorage.getItem('hhee-letter-subscribers') || '[]');
      if (!list.includes(email)) list.push(email);
      localStorage.setItem('hhee-letter-subscribers', JSON.stringify(list));
    } catch (_) {}

    form.hidden = true;
    done.hidden = false;
    done.classList.add('is-visible');
  });
}

// ── 아카이브 태그 필터 ───────────────────
const filterBar = document.getElementById('filter-bar');
const archiveGrid = document.getElementById('archive-grid');
if (filterBar && archiveGrid) {
  const cards = [...archiveGrid.querySelectorAll('.archive-card')];
  const empty = document.getElementById('archive-empty');
  filterBar.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    filterBar.querySelectorAll('.filter-chip').forEach((c) =>
      c.classList.toggle('is-active', c === chip)
    );
    const tag = chip.dataset.filter;
    let visible = 0;
    cards.forEach((card) => {
      const show = tag === 'all' || card.dataset.tag === tag;
      card.classList.toggle('is-hidden', !show);
      if (show) visible++;
    });
    if (empty) empty.hidden = visible > 0;
  });
}

// ── 읽기 진행 바 (아티클) ────────────────
const readBar = document.getElementById('read-progress');
if (readBar) {
  let rTicking = false;
  const updateBar = () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const p = h > 0 ? Math.min(window.scrollY / h, 1) : 0;
    readBar.style.transform = `scaleX(${p.toFixed(4)})`;
    rTicking = false;
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!rTicking) {
        requestAnimationFrame(updateBar);
        rTicking = true;
      }
    },
    { passive: true }
  );
  updateBar();
}
