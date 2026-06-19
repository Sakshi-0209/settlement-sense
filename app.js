/* ═══════════════════════════════════════════════════════════
   SETTLEMENT SENSE — APP.JS
   Premium interactions, animations, ROI calculator, form
   ═══════════════════════════════════════════════════════════ */

'use strict';

// ─── UTILITY ───────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

// ─── NAV: SCROLL STATE + MOBILE TOGGLE ────────────────────
(function initNav() {
  const header = $('#nav-header');
  const hamburger = $('#nav-hamburger');
  const mobileMenu = $('#mobile-menu');

  if (!header) return;

  // Scroll state
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 10);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile toggle
  hamburger?.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', isOpen);
    mobileMenu?.classList.toggle('open', isOpen);
    mobileMenu?.setAttribute('aria-hidden', !isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close mobile menu on link click
  $$('.mobile-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger?.classList.remove('open');
      hamburger?.setAttribute('aria-expanded', 'false');
      mobileMenu?.classList.remove('open');
      mobileMenu?.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    });
  });

  // Active nav link on scroll
  const sections = $$('section[id], article[id]');
  const navLinks = $$('.nav-link[href^="#"]');
  const activateLink = () => {
    const scrollY = window.scrollY + 100;
    sections.forEach(section => {
      if (scrollY >= section.offsetTop && scrollY < section.offsetTop + section.offsetHeight) {
        navLinks.forEach(l => l.classList.remove('active'));
        const matching = navLinks.find(l => l.getAttribute('href') === `#${section.id}`);
        if (matching) matching.classList.add('active');
      }
    });
  };
  window.addEventListener('scroll', activateLink, { passive: true });
})();

// ─── SCROLL REVEAL ─────────────────────────────────────────
(function initReveal() {
  const targets = $$('.reveal-up, .reveal-right');
  if (!targets.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(el => observer.observe(el));
})();

// ─── COUNT-UP ANIMATION ────────────────────────────────────
function animateCounter(el, target, suffix = '', duration = 1800) {
  const start = performance.now();
  const isDecimal = !Number.isInteger(target);

  const step = (now) => {
    const elapsed = now - start;
    const progress = clamp(elapsed / duration, 0, 1);
    const ease = 1 - Math.pow(1 - progress, 4);
    const current = Math.round(ease * target * (isDecimal ? 10 : 1)) / (isDecimal ? 10 : 1);
    el.textContent = current.toLocaleString('en-IN');
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target.toLocaleString('en-IN');
  };
  requestAnimationFrame(step);
}

(function initCounters() {
  // Trust bar counters
  const trustStats = $$('.trust-stat-num');
  const kpiValues = $$('.kpi-value');

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.target);
      if (!isNaN(target)) {
        animateCounter(el, target);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  [...trustStats, ...kpiValues].forEach(el => {
    if (el.dataset.target) counterObserver.observe(el);
  });

  // KPI bar fill on scroll into view
  const kpiCards = $$('.kpi-card');
  const kpiObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelector('.kpi-fill')?.classList.add('animate');
        kpiObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  kpiCards.forEach(c => kpiObserver.observe(c));
})();

// ─── PIPELINE STEP ANIMATION ───────────────────────────────
(function initPipeline() {
  const steps = $$('.pipeline-step');
  if (!steps.length) return;

  let currentActive = 0;
  const cycle = () => {
    steps.forEach((step, i) => {
      step.classList.toggle('pipeline-step--active', i === currentActive);
      step.classList.toggle('pipeline-step--pending', i > currentActive);
    });
    currentActive = (currentActive + 1) % steps.length;
  };

  // Start after initial load
  setTimeout(() => {
    setInterval(cycle, 1800);
  }, 2000);
})();

// ─── ROI CALCULATOR ────────────────────────────────────────
(function initROI() {
  const sliders = {
    patients: $('#monthly-patients'),
    claims:   $('#monthly-claims'),
    revenue:  $('#avg-revenue'),
  };

  const displays = {
    patients: $('#monthly-patients-val'),
    claims:   $('#monthly-claims-val'),
    revenue:  $('#avg-revenue-val'),
  };

  const outputs = {
    recovery: $('#revenue-recovery'),
    savings:  $('#cost-savings'),
    time:     $('#time-saved'),
  };

  if (!sliders.patients) return;

  function formatINR(val) {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000)   return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000)     return `₹${(val / 1000).toFixed(0)}K`;
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  }

  function calculate() {
    const patients = parseInt(sliders.patients.value);
    const claims   = parseInt(sliders.claims.value);
    const avgRev   = parseInt(sliders.revenue.value);

    // Update display
    displays.patients.textContent = patients.toLocaleString('en-IN');
    displays.claims.textContent   = claims.toLocaleString('en-IN');
    displays.revenue.textContent  = `₹${avgRev.toLocaleString('en-IN')}`;

    // Calculations (industry benchmark estimates)
    // Revenue recovery: ~12% of monthly revenue recovered from denied/pending claims
    const monthlyRevenue  = patients * avgRev;
    const revRecovery     = Math.round(monthlyRevenue * 0.12);

    // Cost savings: ₹280 admin cost saved per patient (~40% automation)
    const costSavings     = Math.round(patients * 280 * 0.40);

    // Time saved: 18 min saved per patient on admin, /60 → hours
    const timeSaved       = Math.round((patients * 18) / 60);

    // Animate outputs
    animateCounterVal(outputs.recovery, revRecovery, formatINR);
    animateCounterVal(outputs.savings, costSavings, formatINR);
    animateCounterVal(outputs.time, timeSaved, (v) => `${Math.round(v).toLocaleString('en-IN')} hrs`);
  }

  let lastVals = {};
  function animateCounterVal(el, target, formatter, duration = 600) {
    if (!el) return;
    const start = performance.now();
    const from = lastVals[el.id] || 0;
    lastVals[el.id] = target;
    const step = (now) => {
      const t = clamp((now - start) / duration, 0, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      el.textContent = formatter(from + (target - from) * ease);
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = formatter(target);
    };
    requestAnimationFrame(step);
  }

  // Update slider track fill
  function updateSliderFill(slider) {
    const min = parseInt(slider.min);
    const max = parseInt(slider.max);
    const val = parseInt(slider.value);
    const pct = ((val - min) / (max - min)) * 100;
    slider.style.background = `linear-gradient(90deg, var(--blue) ${pct}%, var(--border) ${pct}%)`;
  }

  Object.values(sliders).forEach(slider => {
    if (!slider) return;
    updateSliderFill(slider);
    slider.addEventListener('input', () => {
      updateSliderFill(slider);
      calculate();
    });
  });

  calculate();
})();

// ─── CONTACT FORM ──────────────────────────────────────────
(function initContactForm() {
  const form = $('#contact-form');
  if (!form) return;

  const submitBtn  = $('#form-submit');
  const submitText = $('#form-submit-text');
  const submitSpinner = $('#form-submit-spinner');
  const successMsg = $('#form-success');

  // Validation rules
  const rules = {
    'f-name':  { required: true, label: 'Name' },
    'f-org':   { required: true, label: 'Organization' },
    'f-email': { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, label: 'Work email' },
    'f-phone': { required: true, pattern: /^[\+\d\s\-\(\)]{7,}$/, label: 'Phone number' },
  };

  function showError(id, msg) {
    const input = $(`#${id}`);
    const errEl = $(`#${id}-error`);
    input?.classList.add('error');
    if (errEl) errEl.textContent = msg;
  }

  function clearError(id) {
    const input = $(`#${id}`);
    const errEl = $(`#${id}-error`);
    input?.classList.remove('error');
    if (errEl) errEl.textContent = '';
  }

  function validateField(id) {
    const rule = rules[id];
    if (!rule) return true;
    const val = ($(`#${id}`)?.value || '').trim();
    if (rule.required && !val) {
      showError(id, `${rule.label} is required`);
      return false;
    }
    if (rule.pattern && val && !rule.pattern.test(val)) {
      showError(id, `Please enter a valid ${rule.label.toLowerCase()}`);
      return false;
    }
    clearError(id);
    return true;
  }

  // Real-time validation
  Object.keys(rules).forEach(id => {
    $(`#${id}`)?.addEventListener('blur', () => validateField(id));
    $(`#${id}`)?.addEventListener('input', () => {
      if ($(`#${id}`)?.classList.contains('error')) validateField(id);
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate all
    const valid = Object.keys(rules).map(id => validateField(id)).every(Boolean);
    if (!valid) {
      // Focus first error
      const firstErr = form.querySelector('.error');
      firstErr?.focus();
      return;
    }

    // Loading state
    submitBtn.disabled = true;
    submitText.textContent = 'Sending...';
    submitSpinner.hidden = false;

    // Simulate submission (replace with real API call)
    await new Promise(resolve => setTimeout(resolve, 1400));

    // Success
    submitBtn.hidden = true;
    successMsg.hidden = false;
    form.querySelectorAll('input, textarea, select').forEach(el => el.disabled = true);
  });
})();

// ─── SMOOTH SCROLL ─────────────────────────────────────────
(function initSmoothScroll() {
  $$('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 68;
      const top = target.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();

// ─── WORKFLOW STEP HOVER GLOW ──────────────────────────────
(function initWorkflowGlow() {
  $$('.workflow-step').forEach((step, i) => {
    step.addEventListener('mouseenter', () => {
      step.querySelector('.workflow-step-icon').style.boxShadow = '0 0 0 6px rgba(30,111,255,0.12)';
    });
    step.addEventListener('mouseleave', () => {
      step.querySelector('.workflow-step-icon').style.boxShadow = '';
    });
  });
})();

// ─── HERO FLOAT ANIMATION ──────────────────────────────────
(function initHeroFloat() {
  const dashboard = $('.hero-dashboard');
  if (!dashboard) return;

  let frame, lastY = 0;
  const onScroll = () => {
    const newY = window.scrollY * 0.04;
    if (Math.abs(newY - lastY) < 0.5) return;
    lastY = newY;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      dashboard.style.transform = `translateY(${newY}px)`;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
})();

// ─── PRODUCT CARD TILT ─────────────────────────────────────
(function initCardTilt() {
  // Only on non-touch devices
  if (window.matchMedia('(hover: none)').matches) return;

  $$('.product-card, .serve-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg) translateY(-3px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();

// ─── INTEGRATION PILL HOVER ────────────────────────────────
(function initIntegrationPills() {
  $$('.integration-pill').forEach((pill, i) => {
    pill.style.animationDelay = `${i * 0.05}s`;
  });
})();

// ─── ACCESSIBLE KEYBOARD NAV ───────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const hamburger = $('#nav-hamburger');
    const mobileMenu = $('#mobile-menu');
    if (hamburger?.classList.contains('open')) {
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      mobileMenu?.classList.remove('open');
      mobileMenu?.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      hamburger.focus();
    }
  }
});

// ─── INIT ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Add skip link
  const skip = document.createElement('a');
  skip.href = '#products';
  skip.className = 'skip-link';
  skip.textContent = 'Skip to main content';
  document.body.prepend(skip);
});
