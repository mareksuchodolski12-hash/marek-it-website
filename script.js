/**
 * ============================================================================
 * WATERMVP2DOM - Advanced Interactive Script
 * Animations, scroll effects, form handling, premium interactions
 * ============================================================================
 */

const CONFIG = {
  scrollThreshold: 0.2,
  animationDuration: 600,
  countDuration: 2000,
};

// ====================================================================
// UTILITY FUNCTIONS
// ====================================================================

/**
 * Setup scroll observer for animations
 */
function createScrollObserver(selector, className = 'visible') {
  const elements = document.querySelectorAll(selector);
  if (elements.length === 0) return;

  const observerOptions = {
    threshold: CONFIG.scrollThreshold,
    rootMargin: '0px 0px -100px 0px',
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add(className);
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  elements.forEach((el) => observer.observe(el));
  return observer;
}

/**
 * Animate counter numbers with easing
 */
function animateCounter(element, duration = CONFIG.countDuration) {
  const targetValue = parseInt(element.dataset.count, 10);
  if (!targetValue) return;

  const startValue = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = 1 - (1 - progress) ** 2;
    const currentValue = Math.floor(startValue + (targetValue - startValue) * easeProgress);
    element.textContent = currentValue;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

/**
 * Setup counters on scroll
 */
function setupCounters() {
  const counters = document.querySelectorAll('[data-count]');

  counters.forEach((counter) => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        animateCounter(counter);
        observer.unobserve(counter);
      }
    }, { threshold: 0.5 });

    observer.observe(counter);
  });
}

/**
 * Smooth scroll for anchor links
 */
function setupSmoothScroll() {
  document.querySelectorAll('a[href^=\"#\"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      const target = document.querySelector(href);

      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    });
  });
}

/**
 * Topbar scroll effect
 */
function setupTopbarScroll() {
  const topbar = document.querySelector('.topbar');
  if (!topbar) return;

  let ticking = false;

  function updateTopbar() {
    const scrolled = window.scrollY > 50;
    topbar.setAttribute('data-scrolled', scrolled ? 'true' : 'false');
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateTopbar);
      ticking = true;
    }
  }, { passive: true });
}

/**
 * Logo animation
 */
function setupLogoAnimation() {
  const logo = document.getElementById('logoHome');
  if (!logo) return;

  logo.addEventListener('click', (e) => {
    e.preventDefault();
    logo.classList.add('spinning', 'glow');

    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 400);

    setTimeout(() => {
      logo.classList.remove('spinning', 'glow');
    }, 800);
  });
}

/**
 * Case card expansion
 */
function setupCaseCards() {
  const cards = document.querySelectorAll('.case-card');

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      cards.forEach((c) => {
        if (c !== card) c.classList.remove('expanded');
      });
      card.classList.toggle('expanded');
    });
  });
}

/**
 * Magnet button effect
 */
function setupMagnetButtons() {
  const buttons = document.querySelectorAll('.magnet');

  buttons.forEach((button) => {
    button.addEventListener('mousemove', (e) => {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const distX = (x - centerX) * 0.3;
      const distY = (y - centerY) * 0.3;

      button.style.transform = \	ranslate(\px, \px)\;
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translate(0, 0)';
    });
  });
}

/**
 * Back-to-top button
 */
function setupToTopButton() {
  const toTopBtn = document.getElementById('toTopBtn');
  if (!toTopBtn) return;

  window.addEventListener('scroll', () => {
    const visible = window.scrollY > 500;
    toTopBtn.style.opacity = visible ? '1' : '0';
    toTopBtn.style.pointerEvents = visible ? 'auto' : 'none';
  }, { passive: true });

  toTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/**
 * Update year in footer
 */
function setupFooterYear() {
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

/**
 * Parallax effect for hero panel
 */
function setupParallax() {
  const heroPanel = document.querySelector('.hero-panel');
  if (!heroPanel) return;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const offset = scrollY * 0.2;
    heroPanel.style.transform = \	ranslateY(\px)\;
  }, { passive: true });
}

/**
 * Animate sparkline
 */
function animateSparkline() {
  document.querySelectorAll('.sparkline span').forEach((bar, index) => {
    bar.style.animation = 'none';
    setTimeout(() => {
      bar.style.animation = \sparkPulse 2s ease-in-out\;
    }, index * 100);
  });
}

/**
 * Form submission
 */
function setupFormSubmission() {
  const form = document.getElementById('leadForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('[type=\"submit\"]');
    const statusEl = document.getElementById('leadStatus');
    const originalText = submitBtn?.textContent;

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Wysyam...';
    }

    const formData = {
      industry: form.industry?.value || '',
      problem: form.problem?.value || '',
      tools: form.tools?.value || '',
      message: form.message?.value || '',
      contact: form.contact?.value || '',
      website: form.website?.value || '',
      wantsMvp: form.wantsMvp?.checked || false,
      wantsAutomation: form.wantsAutomation?.checked || false,
    };

    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Co poszo nie tak');
      }

      if (statusEl) {
        statusEl.className = 'form-status';
        statusEl.textContent = 'Mam. Odpisz w 24h. Jeli zostawie telefon � oddzwoni.';
      }
      form.reset();
    } catch (error) {
      if (statusEl) {
        statusEl.className = 'form-status error';
        statusEl.textContent = \Bd: \\;
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  });
}

/**
 * Setup smooth scroll for footer links
 */
function setupSmoothScrollFooter() {
  const footerLinks = document.querySelectorAll('.footer-link');

  footerLinks.forEach((link) => {
    const href = link.getAttribute('href');

    if (href && href.startsWith('#')) {
      link.addEventListener('click', (e) => {
        const target = document.querySelector(href);

        if (target) {
          e.preventDefault();

          const topbar = document.querySelector('.topbar');
          const offset = topbar ? topbar.offsetHeight : 0;
          const targetPosition = target.getBoundingClientRect().top + window.scrollY - offset - 32;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth',
          });
        }
      });
    }
  });
}

/**
 * Setup CTA section animation
 */
function setupCTAAnimation() {
  const ctaSection = document.querySelector('.cta-section');
  if (!ctaSection) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.2,
      rootMargin: '0px 0px -50px 0px',
    }
  );

  observer.observe(ctaSection);
}



document.addEventListener('DOMContentLoaded', () => {
  // Setup all features
  setupCounters();
  setupSmoothScroll();
  setupTopbarScroll();
  setupLogoAnimation();
  setupCaseCards();
  setupMagnetButtons();
  setupToTopButton();
  setupFormSubmission();
  setupFooterYear();
  setupParallax();

  // Setup contact & footer
  setupSmoothScrollFooter();
  setupCTAAnimation();

  // Setup scroll-triggered animations
  createScrollObserver('.animate-on-scroll', 'visible');

  // Fade in hero section
  const heroSection = document.querySelector('.hero');
  if (heroSection) {
    heroSection.style.opacity = '0';
    heroSection.style.animation = 'slideUp 0.8s ease-out 0.1s forwards';
  }

  // Animate sparkline
  animateSparkline();
  setInterval(animateSparkline, 5000);

  console.log('🚀 Strona załadowana');
});

// Prevent FOUC
document.documentElement.style.visibility = 'visible';
