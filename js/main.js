/**
 * ============================================================
 *  Eagle Eye Security — Main JavaScript
 *  Premium cinematic website interactions & animations
 *  Pure vanilla JS · ES6+ · No dependencies
 * ============================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  /* --------------------------------------------------------
   *  0. UTILITY HELPERS
   * ------------------------------------------------------ */

  /** Debounce — collapses rapid-fire calls into one trailing invocation */
  const debounce = (fn, ms = 200) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  };

  /** Shorthand querySelector wrappers */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /** Safe element check — runs callback only when element exists */
  const ifExists = (sel, cb) => {
    const el = typeof sel === 'string' ? $(sel) : sel;
    if (el) cb(el);
  };

  /* --------------------------------------------------------
   *  00. PRELOADER & FLYING LOGO INTRO
   * ------------------------------------------------------ */
  (() => {
    const preloader = $('#preloader');
    const bar = $('#preloader-bar');
    const content = $('.preloader-content', preloader);
    if (!preloader || !bar) return;

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 8;
      if (progress >= 90) {
        clearInterval(interval);
      } else {
        bar.style.width = `${progress}%`;
      }
    }, 100);

    const finishLoading = () => {
      clearInterval(interval);
      bar.style.width = '100%';
      
      // Delay slightly for visual completion
      setTimeout(() => {
        if (content) content.classList.add('swoop-exit');
        
        setTimeout(() => {
          preloader.classList.add('fade-out');
        }, 600); // match exit swoop animation time
      }, 400);
    };

    // Trigger completion on window load (or fallback timeout of 2.5 seconds max)
    window.addEventListener('load', finishLoading);
    setTimeout(finishLoading, 2500); // fallback if images take too long
  })();

  /* --------------------------------------------------------
   *  1. NAVBAR SCROLL EFFECT
   *  Solid background after 80 px of scroll
   * ------------------------------------------------------ */
  (() => {
    const navbar = $('#navbar');
    if (!navbar) return;

    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        navbar.classList.toggle('scrolled', window.scrollY > 80);
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // set initial state
  })();

  /* --------------------------------------------------------
   *  2. MOBILE MENU TOGGLE
   *  Hamburger ↔ nav drawer with outside-click dismissal
   * ------------------------------------------------------ */
  (() => {
    const navbar = $('#navbar');
    const toggle = $('#menu-toggle');
    if (!navbar || !toggle) return;

    const openMenu = () => {
      navbar.classList.add('nav-open');
      document.body.style.overflow = 'hidden';
    };

    const closeMenu = () => {
      navbar.classList.remove('nav-open');
      document.body.style.overflow = '';
    };

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      navbar.classList.contains('nav-open') ? closeMenu() : openMenu();
    });

    // Close when a nav link is clicked
    $$('#navbar a[href^="#"]').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    // Close when clicking outside the nav
    document.addEventListener('click', (e) => {
      if (navbar.classList.contains('nav-open') && !navbar.contains(e.target)) {
        closeMenu();
      }
    });
  })();

  /* --------------------------------------------------------
   *  3. SMOOTH SCROLL NAVIGATION
   *  Offset by fixed navbar height (80 px)
   * ------------------------------------------------------ */
  const NAVBAR_HEIGHT = 80;

  $$('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href');
      if (id === '#') return;

      const target = $(id);
      if (!target) return;

      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* --------------------------------------------------------
   *  4. SCROLL REVEAL ANIMATIONS
   *  IntersectionObserver with staggered data-delay support
   * ------------------------------------------------------ */
  (() => {
    const reveals = $$('.reveal');
    if (!reveals.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const el = entry.target;
          const delay = parseInt(el.dataset.delay, 10) || 0;

          setTimeout(() => el.classList.add('active'), delay);
          observer.unobserve(el); // fire once
        });
      },
      { threshold: 0.15 }
    );

    reveals.forEach((el) => observer.observe(el));
  })();

  /* --------------------------------------------------------
   *  5 & 13. COUNTER ANIMATION
   *  Counts from 0 → data-target over ~2 s with easeOutQuart
   * ------------------------------------------------------ */
  (() => {
    const counters = $$('.counter');
    if (!counters.length) return;

    /** easeOutQuart for a satisfying deceleration curve */
    const ease = (t) => 1 - Math.pow(1 - t, 4);

    const animateCounter = (el) => {
      const target = parseFloat(el.dataset.target) || 0;
      const suffix = el.dataset.suffix || '';
      const duration = 2000; // ms
      const start = performance.now();

      const tick = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const value = Math.floor(ease(progress) * target);

        el.textContent = value + suffix;

        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          el.textContent = target + suffix; // ensure exact final value
        }
      };

      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.3 }
    );

    counters.forEach((el) => observer.observe(el));
  })();

  /* --------------------------------------------------------
   *  6. TESTIMONIALS CAROUSEL
   *  Auto-advance · dot navigation · pause on hover
   * ------------------------------------------------------ */
  (() => {
    const carousel = $('#testimonial-carousel');
    if (!carousel) return;

    const slides = $$('.testimonial-slide', carousel);
    const dotsContainer = $('.carousel-dots', carousel);
    if (!slides.length) return;

    let current = 0;
    let autoTimer = null;
    const INTERVAL = 5000;

    /** Create navigation dots if container exists but is empty */
    if (dotsContainer && !dotsContainer.children.length) {
      slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.classList.add('carousel-dot');
        dot.setAttribute('aria-label', `Slide ${i + 1}`);
        if (i === 0) dot.classList.add('active');
        dotsContainer.appendChild(dot);
      });
    }

    const dots = dotsContainer ? $$('.carousel-dot', dotsContainer) : [];
    const track = $('.testimonial-track', carousel);

    const goTo = (index) => {
      slides[current].classList.remove('active');
      if (dots[current]) dots[current].classList.remove('active');

      current = (index + slides.length) % slides.length;

      slides[current].classList.add('active');
      if (dots[current]) dots[current].classList.add('active');

      if (track) {
        track.style.transform = `translate3d(-${current * 100}%, 0, 0)`;
      }
    };

    // Dot click handlers
    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        goTo(i);
        resetAuto();
      });
    });

    // Auto-advance
    const startAuto = () => {
      autoTimer = setInterval(() => goTo(current + 1), INTERVAL);
    };
    const stopAuto = () => clearInterval(autoTimer);
    const resetAuto = () => {
      stopAuto();
      startAuto();
    };

    // Pause on hover
    carousel.addEventListener('mouseenter', stopAuto);
    carousel.addEventListener('mouseleave', startAuto);

    // Initialise first slide
    slides.forEach((s, i) => s.classList.toggle('active', i === 0));
    startAuto();
  })();

  /* --------------------------------------------------------
   *  7. PARALLAX HERO EFFECT
   *  GPU-accelerated translateY — desktop only
   * ------------------------------------------------------ */
  (() => {
    const hero = $('#hero');
    const heroBg = $('.hero-bg-wrapper');
    if (!hero || !heroBg) return;

    let ticking = false;
    let heroHeight = hero.offsetHeight;

    const onScroll = () => {
      if (ticking || window.innerWidth <= 768) return;
      ticking = true;
      requestAnimationFrame(() => {
        const offset = window.scrollY;
        if (offset < heroHeight) {
          const y = offset * 0.35;
          heroBg.style.transform = `translate3d(0, ${y}px, 0)`;
        }
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    // Cache height on resize and disable parallax on small viewports
    window.addEventListener(
      'resize',
      debounce(() => {
        heroHeight = hero.offsetHeight;
        if (window.innerWidth <= 768) {
          heroBg.style.transform = '';
        }
      }, 150),
      { passive: true }
    );
  })();

  /* --------------------------------------------------------
   *  8. PROCESS TIMELINE ANIMATION
   *  Connecting line draws + steps reveal sequentially
   * ------------------------------------------------------ */
  (() => {
    const section = $('#process');
    if (!section) return;

    const line = $('.process-line', section);
    const steps = $$('.process-step', section);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          // Animate the connecting line
          if (line) line.classList.add('active');

          // Stagger each step
          steps.forEach((step, i) => {
            setTimeout(() => step.classList.add('active'), i * 300);
          });

          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(section);
  })();

  /* --------------------------------------------------------
   *  9. FORM HANDLING & EMAIL INTEGRATION (via Web3Forms)
   *  Validation + AJAX POST submission with loading states
   * ------------------------------------------------------ */

  // ========================================================
  //  CONFIGURATIONS & EMAIL TARGETS
  // ========================================================
  // All form submissions and file uploads are routed to this business email address:
  const OFFICIAL_EMAIL_TARGET = "eagleeyesecurity.india@gmail.com";

  /** Simple validation patterns */
  const patterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[+]?[\d\s()-]{7,15}$/,
  };

  /** Show inline error below a field */
  const showError = (field, message) => {
    clearError(field);
    field.classList.add('input-error');
    const err = document.createElement('span');
    err.className = 'field-error';
    err.textContent = message;
    field.parentNode.appendChild(err);
  };

  /** Clear inline error */
  const clearError = (field) => {
    field.classList.remove('input-error');
    const existing = field.parentNode.querySelector('.field-error');
    if (existing) existing.remove();
  };

  /** Validate a single field; returns true if valid */
  const validateField = (field) => {
    clearError(field);
    const value = field.value.trim();

    if (field.hasAttribute('required') && !value) {
      showError(field, 'This field is required');
      return false;
    }
    if (field.type === 'email' && value && !patterns.email.test(value)) {
      showError(field, 'Please enter a valid email address');
      return false;
    }
    if (field.type === 'tel' && value && !patterns.phone.test(value)) {
      showError(field, 'Please enter a valid phone number');
      return false;
    }
    return true;
  };

  /** Validate every field inside a form */
  const validateForm = (form) => {
    const fields = $$('input, select, textarea', form).filter(
      (f) => f.type !== 'submit' && f.type !== 'button' && f.type !== 'hidden'
    );
    let valid = true;
    fields.forEach((f) => {
      if (!validateField(f)) valid = false;
    });
    return valid;
  };

  /**
   * Universal fetch-based form submission to FormSubmit.co
   * @param {HTMLFormElement} form 
   * @param {string} successMsg 
   * @param {Function} onSuccessCallback 
   */
  const handleFormSubmit = async (form, successMsg, onSuccessCallback) => {
    const submitBtn = $('button[type="submit"]', form);
    if (!submitBtn) return;

    const originalHTML = submitBtn.innerHTML;

    // Set loading state
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';
    submitBtn.innerHTML = `<span class="btn-spinner"></span> Sending...`;

    try {
      const formData = new FormData(form);
      
      // FormSubmit config fields
      formData.append('_subject', `Eagle Eye Security: New ${form.id === 'quote-form' ? 'Quote Request' : 'Career Application'}`);
      formData.append('_captcha', 'false'); // Disable captcha screen for custom premium design flow

      // If career application form, verify and append the resume file upload as 'attachment'
      if (form.id === 'career-form') {
        const fileInput = $('input[type="file"]', form);
        if (fileInput && fileInput.files.length) {
          // FormSubmit parses the 'attachment' key to send files as attachments
          formData.append('attachment', fileInput.files[0]);
        }
      }

      const response = await fetch(`https://formsubmit.co/ajax/${OFFICIAL_EMAIL_TARGET}`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const result = await response.json();

      // FormSubmit responds with { success: "true", message: "..." }
      if (result.success === "true") {
        toast(successMsg, 'success');
        form.reset();
        if (onSuccessCallback) onSuccessCallback();
      } else {
        // If this is the first submission, FormSubmit sends an activation link
        if (result.message && result.message.includes('confirm')) {
          toast('Activation Email Sent! Please check your inbox at ' + OFFICIAL_EMAIL_TARGET + ' to click the confirmation link.', 'info', 10000);
          form.reset();
          if (onSuccessCallback) onSuccessCallback();
        } else {
          throw new Error(result.message || 'Submission failed. Please try again.');
        }
      }
    } catch (err) {
      toast(err.message || 'Something went wrong. Please try again.', 'error');
      console.error('Email submission error:', err);
    } finally {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '';
      submitBtn.innerHTML = originalHTML;
    }
  };

  /* — Quote Request Form — */
  ifExists('#quote-form', (form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateForm(form)) return;
      handleFormSubmit(form, 'Your quote request has been sent successfully!');
    });

    // Live validation on blur
    $$('input, select, textarea', form).forEach((f) => {
      f.addEventListener('blur', () => validateField(f));
    });
  });

  /* — Career Application Form — */
  ifExists('#career-form', (form) => {
    // Display selected file name
    const fileInput = $('input[type="file"]', form);
    if (fileInput) {
      fileInput.addEventListener('change', () => {
        const label = fileInput.parentNode.querySelector('#file-name');
        if (label) {
          label.textContent = fileInput.files.length
            ? fileInput.files[0].name
            : 'No file chosen';
        }
      });
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateForm(form)) return;
      handleFormSubmit(form, 'Your application has been submitted. We\'ll be in touch!', () => {
        if (fileInput) {
          const label = fileInput.parentNode.querySelector('#file-name');
          if (label) label.textContent = 'Upload Resume (PDF, DOC)';
        }
      });
    });

    $$('input, select, textarea', form).forEach((f) => {
      f.addEventListener('blur', () => validateField(f));
    });
  });

  /* --------------------------------------------------------
   *  10. WHATSAPP INTEGRATION
   *  Float button href + "Send via WhatsApp" from quote form
   * ------------------------------------------------------ */
  const WA_BASE = 'https://wa.me/916392592165';

  ifExists('#whatsapp-float', (btn) => {
    btn.href = `${WA_BASE}?text=${encodeURIComponent(
      'Hello, I would like to inquire about your security services.'
    )}`;
    btn.setAttribute('target', '_blank');
    btn.setAttribute('rel', 'noopener noreferrer');
  });

  ifExists('#quote-whatsapp', (btn) => {
    btn.addEventListener('click', () => {
      const form = $('#quote-form');
      if (!form) return;

      const name = ($('[name="name"]', form) || {}).value || '';
      const service = ($('[name="service"]', form) || {}).value || '';
      const message = ($('[name="message"]', form) || {}).value || '';

      const text = [
        `Hi, I'm ${name}.`,
        service ? `I'm interested in: ${service}.` : '',
        message ? `Details: ${message}` : '',
      ]
        .filter(Boolean)
        .join(' ');

      window.open(`${WA_BASE}?text=${encodeURIComponent(text)}`, '_blank');
    });
  });

  /* --------------------------------------------------------
   *  11. BACK TO TOP BUTTON
   *  Visible after 500 px of scroll · smooth return
   * ------------------------------------------------------ */
  (() => {
    const btn = $('#back-to-top');
    if (!btn) return;

    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        btn.classList.toggle('visible', window.scrollY > 500);
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    onScroll(); // initial check
  })();

  /* --------------------------------------------------------
   *  12. ACTIVE NAVIGATION HIGHLIGHT
   *  IntersectionObserver on each <section id="...">
   * ------------------------------------------------------ */
  (() => {
    const sections = $$('section[id]');
    const navLinks = $$('#navbar a[href^="#"]');
    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          navLinks.forEach((link) => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        });
      },
      {
        rootMargin: `-${NAVBAR_HEIGHT}px 0px -40% 0px`,
        threshold: 0,
      }
    );

    sections.forEach((s) => observer.observe(s));
  })();

  /* --------------------------------------------------------
   *  14. TOAST NOTIFICATION SYSTEM
   *  toast(message, type) — success | error | info
   * ------------------------------------------------------ */
  const toast = (() => {
    let container = $('#toast-container');

    // Create container on first use
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }

    /**
     * Show a toast notification.
     * @param {string} message
     * @param {'success'|'error'|'info'} type
     * @param {number} duration  ms before auto-dismiss (default 3000)
     */
    return (message, type = 'info', duration = 3000) => {
      const el = document.createElement('div');
      el.className = `toast toast-${type}`;

      // Icon per type
      const icons = { success: '✓', error: '✕', info: 'ℹ' };
      el.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span>
                       <span class="toast-message">${message}</span>`;

      container.appendChild(el);

      // Trigger slide-in (needs a frame to apply transition)
      requestAnimationFrame(() => el.classList.add('toast-visible'));

      // Auto-dismiss
      setTimeout(() => {
        el.classList.remove('toast-visible');
        el.addEventListener('transitionend', () => el.remove(), { once: true });
        // Fallback removal if transitionend never fires
        setTimeout(() => el.remove(), 500);
      }, duration);
    };
  })();

  // Expose globally so other scripts / inline handlers can call it
  window.toast = toast;

  /* --------------------------------------------------------
   *  15. TYPED TEXT EFFECT (HERO)
   *  Cycles through phrases with typing + deleting + cursor
   * ------------------------------------------------------ */
  (() => {
    const el = $('#hero-typed');
    if (!el) return;

    const phrases = [
      'Security Services',
      'Housekeeping Solutions',
      'Facility Management',
      'Manpower Outsourcing',
    ];

    const TYPING_SPEED   = 80;   // ms per character
    const DELETING_SPEED  = 40;
    const PAUSE_AFTER     = 1800; // pause at full phrase
    const PAUSE_BEFORE    = 400;  // pause before typing next

    let phraseIdx = 0;
    let charIdx   = 0;
    let deleting  = false;

    const tick = () => {
      const current = phrases[phraseIdx];

      if (deleting) {
        charIdx--;
        el.textContent = current.substring(0, charIdx);

        if (charIdx === 0) {
          deleting = false;
          phraseIdx = (phraseIdx + 1) % phrases.length;
          setTimeout(tick, PAUSE_BEFORE);
          return;
        }
        setTimeout(tick, DELETING_SPEED);
      } else {
        charIdx++;
        el.textContent = current.substring(0, charIdx);

        if (charIdx === current.length) {
          deleting = true;
          setTimeout(tick, PAUSE_AFTER);
          return;
        }
        setTimeout(tick, TYPING_SPEED);
      }
    };

    // Ensure cursor blink class is present
    tick();
  })();

  /* --------------------------------------------------------
   *  16. SERVICE CARD CLICK → SCROLL TO CONTACT
   *  Pre-fills the service dropdown in the quote form
   * ------------------------------------------------------ */
  $$('.service-card[data-service]').forEach((card) => {
    card.style.cursor = 'pointer';

    card.addEventListener('click', () => {
      const service = card.dataset.service;
      const contact = $('#contact');
      const dropdown = $('[name="service"]', $('#quote-form'));

      if (contact) {
        const top = contact.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT;
        window.scrollTo({ top, behavior: 'smooth' });
      }

      if (dropdown) {
        // Try to find a matching <option>
        const option = $$('option', dropdown).find(
          (opt) => opt.value.toLowerCase() === service.toLowerCase()
        );
        if (option) {
          dropdown.value = option.value;
          // Trigger change event so any listeners react
          dropdown.dispatchEvent(new Event('change'));
        }
      }
    });
  });

  /* --------------------------------------------------------
   *  17. PERFORMANCE — DEBOUNCED RESIZE
   *  Centralised resize handler for anything that needs it
   * ------------------------------------------------------ */
  window.addEventListener(
    'resize',
    debounce(() => {
      // Re-evaluate mobile breakpoints, recalc positions, etc.
      // Individual modules handle their own resize logic above.
    }, 250),
    { passive: true }
  );

  /* --------------------------------------------------------
   *  18. INTERACTIVE SECURITY GRID (PARTICLE CANVAS + RADAR SCANNER)
   *  Optimized high-performance canvas: uses squared distance comparisons,
   *  pre-calculated dimensions, and avoids costly shadowBlur calculations.
   * ------------------------------------------------------ */
  (() => {
    const canvas = $('#hero-grid-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;
    let width = 0;
    let height = 0;
    let r = 0; // Pre-calculated diagonal screen radius
    let mouse = { x: null, y: null, active: false };
    let isVisible = true;
    let radarAngle = 0;

    const heroSection = $('#hero');
    if (heroSection && window.IntersectionObserver) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isVisible = entry.isIntersecting;
          if (isVisible) {
            startLoop();
          } else {
            cancelAnimationFrame(animationId);
          }
        });
      }, { threshold: 0.05 });
      observer.observe(heroSection);
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      // Pre-calculate diagonal radius
      const cx = width / 2;
      const cy = height / 2;
      r = Math.sqrt(cx * cx + cy * cy);

      initParticles();
    };

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.35; // slow drift
        this.vy = (Math.random() - 0.5) * 0.35;
        this.radius = Math.random() * 1.5 + 1.5;
        this.ping = 0; // radar hit intensity [0, 1]
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        if (mouse.active && mouse.x !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 32400) { // 180 * 180 = 32400
            const dist = Math.sqrt(distSq);
            this.x += (dx / dist) * 0.9;
            this.y += (dy / dist) * 0.9;
          }
        }

        const cx = width / 2;
        const cy = height / 2;
        
        let pAngle = Math.atan2(this.y - cy, this.x - cx);
        if (pAngle < 0) pAngle += Math.PI * 2;
        
        let diff = radarAngle - pAngle;
        if (diff < 0) diff += Math.PI * 2;
        
        // If particle is within the 35-degree sweep wedge (approx 0.6 radians)
        if (diff < 0.6) {
          this.ping = 1.0 - (diff / 0.6); // maximum ping at leading edge, fading trailing
        } else {
          this.ping -= 0.012;
          if (this.ping < 0) this.ping = 0;
        }
      }

      draw() {
        const size = this.radius + this.ping * 4;
        
        if (this.ping > 0.05) {
          // Draw soft outer glow circle (hardware-accelerated, replaces costly shadowBlur)
          ctx.beginPath();
          ctx.arc(this.x, this.y, size * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(200, 165, 78, ${this.ping * 0.12})`;
          ctx.fill();

          // Draw main core particle
          ctx.beginPath();
          ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(232, 212, 139, ${0.5 + this.ping * 0.5})`;
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(200, 165, 78, 0.3)';
          ctx.fill();
        }
      }
    }

    const initParticles = () => {
      particles = [];
      const density = Math.min(Math.floor((width * height) / 11000), 75);
      for (let i = 0; i < density; i++) {
        particles.push(new Particle());
      }
    };

    const drawHUD = (cx, cy) => {
      ctx.save();
      
      // Draw Concentric Dashed Radar Rings
      ctx.strokeStyle = 'rgba(200, 165, 78, 0.05)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 15]);
      
      ctx.beginPath();
      ctx.arc(cx, cy, 150, 0, Math.PI * 2);
      ctx.arc(cx, cy, 300, 0, Math.PI * 2);
      ctx.arc(cx, cy, 450, 0, Math.PI * 2);
      ctx.stroke();
      
      // Draw crosshair axes
      ctx.strokeStyle = 'rgba(200, 165, 78, 0.03)';
      ctx.beginPath();
      // horizontal axis
      ctx.moveTo(cx - 500, cy);
      ctx.lineTo(cx - 20, cy);
      ctx.moveTo(cx + 20, cy);
      ctx.lineTo(cx + 500, cy);
      // vertical axis
      ctx.moveTo(cx, cy - 500);
      ctx.lineTo(cx, cy - 20);
      ctx.moveTo(cx, cy + 20);
      ctx.lineTo(cx, cy + 500);
      ctx.stroke();

      ctx.restore();
    };

    const drawLines = () => {
      const maxDistanceSq = 12100; // 110 * 110
      const maxMouseDistanceSq = 19600; // 140 * 140
      
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        
        // Connect to mouse
        if (mouse.active && mouse.x !== null) {
          const dx = mouse.x - p1.x;
          const dy = mouse.y - p1.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < maxMouseDistanceSq) {
            const dist = Math.sqrt(distSq);
            const alpha = (1 - dist / 140) * 0.3;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(232, 212, 139, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        // Connect to other particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxDistanceSq) {
            const maxPing = p1.ping > p2.ping ? p1.ping : p2.ping;
            if (maxPing > 0.05) {
              const dist = Math.sqrt(distSq);
              const alpha = (1 - dist / 110) * maxPing * 0.3;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = `rgba(232, 212, 139, ${alpha})`;
              ctx.lineWidth = 0.5 + maxPing * 0.5;
              ctx.stroke();
            }
          }
        }
      }
    };

    const loop = () => {
      if (!isVisible) return;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // 1. Draw static grid radar HUD
      drawHUD(cx, cy);

      // 2. Increment radar sweep angle (clockwise)
      radarAngle += 0.005;
      if (radarAngle > Math.PI * 2) radarAngle -= Math.PI * 2;

      // 3. Draw radar sweep cone (smooth radial gradient arc wedge)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(radarAngle);

      const sweepGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      sweepGrad.addColorStop(0, 'rgba(200, 165, 78, 0.16)');
      sweepGrad.addColorStop(0.5, 'rgba(200, 165, 78, 0.06)');
      sweepGrad.addColorStop(1, 'rgba(200, 165, 78, 0)');

      ctx.fillStyle = sweepGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, 0, -0.6, true);
      ctx.closePath();
      ctx.fill();

      // Draw primary scan line (leading edge)
      ctx.strokeStyle = 'rgba(232, 212, 139, 0.4)';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(r, 0);
      ctx.stroke();

      ctx.restore();

      // 4. Update and Draw particles (ping on radar sweep pass)
      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      // 5. Draw connection lines
      drawLines();
      
      animationId = requestAnimationFrame(loop);
    };

    const startLoop = () => {
      cancelAnimationFrame(animationId);
      animationId = requestAnimationFrame(loop);
    };

    // Listeners
    window.addEventListener('resize', debounce(resize, 150), { passive: true });
    
    // Mouse interaction inside the Hero container
    const hero = $('#hero');
    if (hero) {
      hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
        mouse.active = true;
      }, { passive: true });

      hero.addEventListener('mouseleave', () => {
        mouse.active = false;
      }, { passive: true });
    }

    // Init
    resize();
    if (isVisible) startLoop();
  })();

  /* --------------------------------------------------------
   *  19. SPOTLIGHT TRACKING GLOW EFFECT (ON #TRUST)
   *  Calculates mouse position to feed gradient values
   * ------------------------------------------------------ */
  (() => {
    const trustSection = $('#trust');
    if (!trustSection) return;

    trustSection.addEventListener('mousemove', (e) => {
      const rect = trustSection.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      trustSection.style.setProperty('--mouse-x', `${x}px`);
      trustSection.style.setProperty('--mouse-y', `${y}px`);
    }, { passive: true });
  })();

  /* --------------------------------------------------------
   *  20. INDUSTRIES SHOWCASE TAB INTERACTION
   *  Toggles active navigation tab and details panels
   * ------------------------------------------------------ */
  (() => {
    const navItems = $$('.ind-nav-item');
    const panels = $$('.ind-detail-panel');
    if (!navItems.length || !panels.length) return;

    navItems.forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        if (!target) return;

        // 1. Update navigation items active state
        navItems.forEach((item) => item.classList.remove('active'));
        btn.classList.add('active');

        // 2. Update detail panels active state with smooth transition
        panels.forEach((panel) => {
          if (panel.id === `panel-${target}`) {
            panel.style.display = 'grid';
            // Reflow to trigger CSS transitions
            void panel.offsetWidth;
            panel.classList.add('active');
          } else {
            panel.classList.remove('active');
            // Hide panel after fade animation finishes (400ms)
            setTimeout(() => {
              if (!panel.classList.contains('active')) {
                panel.style.display = 'none';
              }
            }, 400);
          }
        });
      });
    });

    // Prefill Service form helper with target mapping dictionary
    const prefillService = (serviceName) => {
      const dropdown = $('[name="service"]', $('#quote-form'));
      if (!dropdown || !serviceName) return;

      const serviceMap = {
        // Main Verticals
        'corporate & offices': 'Corporate Security',
        'corporate security': 'Corporate Security',
        'industrial & manufacturing': 'Industrial Security',
        'industrial security': 'Industrial Security',
        'retail & malls': 'Corporate Security',
        'residential societies': 'Residential Security',
        'healthcare & hotels': 'Facility Management',
        
        // Comprehensive Sector Grid
        'warehousing & storage': 'Industrial Security',
        'logistics & transit': 'Industrial Security',
        'construction sites': 'Industrial Security',
        'hospitals & clinics': 'Corporate Security',
        'educational campuses': 'Corporate Security',
        'events & exhibitions': 'Event Security',
        'government projects': 'Corporate Security',
        'financial & banking': 'Corporate Security'
      };

      const mappedValue = serviceMap[serviceName.toLowerCase()] || serviceName;

      // Find match in dropdown options
      const option = $$('option', dropdown).find(
        (opt) => opt.value.toLowerCase() === mappedValue.toLowerCase() ||
                 opt.value.toLowerCase().includes(mappedValue.toLowerCase()) ||
                 mappedValue.toLowerCase().includes(opt.value.toLowerCase())
      );

      if (option) {
        dropdown.value = option.value;
        dropdown.dispatchEvent(new Event('change'));
      }
    };

    // Handle "Request Custom Plan" buttons inside panels to pre-fill the form
    $$('.ind-cta-link').forEach((link) => {
      link.addEventListener('click', () => {
        const service = link.dataset.service;
        prefillService(service);
      });
    });

    // Handle "Other Sector" badges to scroll to contact and pre-fill form
    $$('.other-sector-badge').forEach((badge) => {
      badge.style.cursor = 'pointer';
      badge.addEventListener('click', () => {
        const serviceName = badge.dataset.service;
        prefillService(serviceName);
        
        const contact = $('#contact');
        if (contact) {
          const top = contact.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      });
    });
  })();

  /* --------------------------------------------------------
   *  21. FAQ ACCORDION INTERACTION (AEO/GEO Optimization)
   *  Toggles active state and handles ARIA attributes
   * ------------------------------------------------------ */
  (() => {
    const triggers = $$('.faq-trigger');
    if (!triggers.length) return;

    triggers.forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const item = trigger.closest('.faq-item');
        if (!item) return;

        const isActive = item.classList.contains('active');

        // Toggle clicked item
        if (isActive) {
          item.classList.remove('active');
          trigger.setAttribute('aria-expanded', 'false');
        } else {
          // Collapse others for clean accordion behavior
          $$('.faq-item.active').forEach((activeItem) => {
            activeItem.classList.remove('active');
            const activeTrigger = $('.faq-trigger', activeItem);
            if (activeTrigger) activeTrigger.setAttribute('aria-expanded', 'false');
          });

          item.classList.add('active');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
    });
  })();

  /* --------------------------------------------------------
   *  INIT COMPLETE — log for debugging
   * ------------------------------------------------------ */
  console.log('%c✦ Eagle Eye Security — JS Loaded', 'color:#c8a84e; font-weight:bold;');
});
