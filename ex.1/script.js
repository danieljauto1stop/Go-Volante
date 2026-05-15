'use strict';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── SCROLL PROGRESS BAR ── */
function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const pct = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    bar.style.width = Math.min(pct, 100) + '%';
  }, { passive: true });
}

/* ── HEADER SCROLL SHRINK ── */
function initHeader() {
  const header = document.querySelector('header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });
}

/* ── ACTIVE NAV LINK ON SCROLL ── */
function initActiveNav() {
  const sections = document.querySelectorAll('main section[id]');
  const links    = document.querySelectorAll('.nav-links a[href^="#"]');
  if (!sections.length || !links.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
        });
      }
    });
  }, { threshold: 0.45 });

  sections.forEach(s => observer.observe(s));
}

/* ── SCROLL REVEAL WITH STAGGER ── */
function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  if (reducedMotion) {
    items.forEach(el => el.classList.add('active'));
    return;
  }

  /* Apply stagger delay to siblings inside grids */
  document.querySelectorAll('.grid, .gallery').forEach(grid => {
    grid.querySelectorAll('.reveal').forEach((el, i) => {
      el.style.setProperty('--stagger', `${i * 75}ms`);
    });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  items.forEach(el => observer.observe(el));
}

/* ── COUNTER ANIMATION ── */
function animateCounter(el) {
  const target   = parseInt(el.dataset.target, 10);
  const suffix   = el.dataset.suffix || '';
  const duration = reducedMotion ? 0 : 1400;
  const start    = performance.now();

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3); /* ease-out cubic */
    el.textContent = Math.round(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

function initCounters() {
  const els = document.querySelectorAll('[data-target]');
  if (!els.length) return;

  /* Reset to zero so animation always starts from scratch */
  els.forEach(el => {
    el.textContent = '0' + (el.dataset.suffix || '');
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });

  els.forEach(el => observer.observe(el));
}

/* ── MOBILE NAV ── */
const menuBtn    = document.querySelector('.menu-btn');
const navLinksEl = document.getElementById('navLinks');

function openNav() {
  navLinksEl.classList.add('active');
  menuBtn.setAttribute('aria-expanded', 'true');
}

function closeNav() {
  navLinksEl.classList.remove('active');
  menuBtn.setAttribute('aria-expanded', 'false');
}

/* Exposed globally for HTML onclick attribute */
window.toggleMenu = function () {
  navLinksEl.classList.contains('active') ? closeNav() : openNav();
};

function initMobileNav() {
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', closeNav);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeNav();
  });

  document.addEventListener('click', e => {
    if (
      navLinksEl.classList.contains('active') &&
      !navLinksEl.contains(e.target) &&
      !menuBtn.contains(e.target)
    ) closeNav();
  });
}

/* ── GALLERY LIGHTBOX ── */
function initLightbox() {
  const gallery = document.querySelector('.gallery');
  if (!gallery) return;

  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-label', 'Image viewer');

  const img     = document.createElement('img');
  img.className = 'lightbox-img';
  img.alt       = '';

  const caption     = document.createElement('div');
  caption.className = 'lightbox-caption';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'lightbox-close';
  closeBtn.setAttribute('aria-label', 'Close image viewer');
  closeBtn.textContent = '×'; /* × character — no HTML needed */

  lb.appendChild(img);
  lb.appendChild(caption);
  lb.appendChild(closeBtn);
  document.body.appendChild(lb);

  function open(src, label) {
    img.src         = src;
    img.alt         = label;
    caption.textContent = label;
    lb.classList.add('open');
    closeBtn.focus();
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }

  gallery.querySelectorAll('.gallery-item').forEach(item => {
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', 'View: ' + (item.dataset.label || 'image'));

    const src = (item.style.backgroundImage || '').replace(/url\(["']?|["']?\)/g, '');
    const lbl = item.dataset.label || '';

    const activate = () => open(src, lbl);
    item.addEventListener('click', activate);
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
    });
  });

  closeBtn.addEventListener('click', close);
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && lb.classList.contains('open')) close();
  });
}

/* ── FORM HANDLER ── */
window.submitForm = function (event) {
  event.preventDefault();
  const form         = event.target;
  const btn          = form.querySelector('button[type="submit"]');
  const originalText = btn.textContent.trim();

  btn.setAttribute('aria-busy', 'true');
  btn.textContent = 'Sending…'; /* … */
  btn.disabled = true;

  /* Replace with real fetch/email service/CRM call */
  setTimeout(() => {
    btn.removeAttribute('aria-busy');
    btn.disabled    = false;
    btn.textContent = originalText;

    const successEl = form.nextElementSibling;
    if (successEl && successEl.classList.contains('form-success')) {
      form.style.display = 'none';
      successEl.classList.add('show');
    } else {
      form.reset();
    }
  }, 1400);
};

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  initScrollProgress();
  initHeader();
  initActiveNav();
  initReveal();
  initCounters();
  initMobileNav();
  initLightbox();
});
