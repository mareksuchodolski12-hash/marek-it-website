// Intersection Observer for animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Count animation for numbers
function animateCounter(element, targetCount, duration = 2000) {
  const startCount = 0;
  const startTime = Date.now();

  function updateCount() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const currentCount = Math.floor(startCount + (targetCount - startCount) * progress);
    element.textContent = currentCount;

    if (progress < 1) {
      requestAnimationFrame(updateCount);
    }
  }

  updateCount();
}

// Initialize counters when they come into view
document.querySelectorAll('[data-count]').forEach(element => {
  const targetCount = parseInt(element.dataset.count, 10);
  
  const elementObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      animateCounter(element, targetCount);
      elementObserver.unobserve(element);
    }
  }, { threshold: 0.5 });

  elementObserver.observe(element);
});

// Topbar elevation on scroll
const topbar = document.querySelector('.topbar');
if (topbar) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      topbar.setAttribute('data-elevate', '');
    } else {
      topbar.removeAttribute('data-elevate');
    }
  });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    const target = document.querySelector(href);
    
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// Back to top button
const toTopBtn = document.getElementById('toTopBtn');
if (toTopBtn) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      toTopBtn.style.display = 'block';
    } else {
      toTopBtn.style.display = 'none';
    }
  });

  toTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Case card expansion
document.querySelectorAll('.case-card').forEach(card => {
  card.addEventListener('click', () => {
    card.classList.toggle('expanded');
  });
});

// Magnet button effect
document.querySelectorAll('.magnet').forEach(button => {
  button.addEventListener('mousemove', (e) => {
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const distX = (x - centerX) * 0.1;
    const distY = (y - centerY) * 0.1;
    
    button.style.transform = `translate(${distX}px, ${distY}px)`;
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translate(0, 0)';
  });
});

// Year in footer
document.getElementById('year').textContent = new Date().getFullYear();

// Page transition animations
document.querySelectorAll('.case-card, .scope-item, .process .step').forEach(element => {
  element.style.opacity = '0';
  element.style.transform = 'translateY(20px)';
  element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  
  const elementObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
      elementObserver.unobserve(element);
    }
  }, { threshold: 0.1 });

  elementObserver.observe(element);
});

// Hero panel animation
const heroPanel = document.querySelector('.hero-panel');
if (heroPanel) {
  heroPanel.style.opacity = '0';
  heroPanel.style.transform = 'translateY(20px)';
  
  const panelObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      heroPanel.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
      heroPanel.style.opacity = '1';
      heroPanel.style.transform = 'translateY(0)';
      panelObserver.unobserve(heroPanel);
    }
  }, { threshold: 0.1 });

  panelObserver.observe(heroPanel);
}

// Sparkline animation
function animateSparkline() {
  document.querySelectorAll('.sparkline span').forEach((bar, index) => {
    const delay = index * 100;
    setTimeout(() => {
      bar.style.animation = 'none';
      setTimeout(() => {
        bar.style.animation = `sparkPulse 2s ease-in-out`;
      }, 10);
    }, delay);
  });
}

// Animate sparkline on page load
window.addEventListener('load', () => {
  animateSparkline();
});

// Re-animate on interval
setInterval(animateSparkline, 5000);

// Add sparkPulse animation
const style = document.createElement('style');
style.textContent = `
  @keyframes sparkPulse {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 1; }
  }
`;
document.head.appendChild(style);

// Responsive menu toggle (if needed)
function setupMobileMenu() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  if (window.innerWidth <= 768) {
    nav.style.overflow = 'hidden';
  }
}

window.addEventListener('resize', setupMobileMenu);
setupMobileMenu();

// Initialize page animations
document.addEventListener('DOMContentLoaded', () => {
  // Fade in hero section
  const heroSection = document.querySelector('.hero');
  if (heroSection) {
    heroSection.style.opacity = '0';
    heroSection.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      heroSection.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
      heroSection.style.opacity = '1';
      heroSection.style.transform = 'translateY(0)';
    }, 100);
  }

  // Stagger section animations
  document.querySelectorAll('section:not(.hero)').forEach((section, index) => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    
    const sectionObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        entries[0].target.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        entries[0].target.style.opacity = '1';
        entries[0].target.style.transform = 'translateY(0)';
        sectionObserver.unobserve(entries[0].target);
      }
    }, { threshold: 0.05 });

    sectionObserver.observe(section);
  });
});

// Prevent FOUC (Flash of Unstyled Content)
document.documentElement.style.visibility = 'visible';