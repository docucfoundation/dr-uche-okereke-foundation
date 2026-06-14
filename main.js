/* ============================================================
   SCHOLARSHIP FOUNDATION — Main JavaScript
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  /* ======================================================
     1. MOBILE NAVIGATION TOGGLE
  ====================================================== */
  const navToggle = document.getElementById('navToggle');
  const navLinks  = document.getElementById('navLinks');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      const open = navLinks.classList.toggle('open');
      navToggle.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open);
    });

    // Close on nav link click
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }


  /* ======================================================
     2. SCROLL ANIMATIONS (Intersection Observer)
  ====================================================== */
  const animatedEls = document.querySelectorAll('.fade-up, .fade-up-stagger');

  if (animatedEls.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    animatedEls.forEach(function (el) { observer.observe(el); });
  } else {
    // Fallback: show all
    animatedEls.forEach(function (el) { el.classList.add('visible'); });
  }


  /* ======================================================
     3. ACTIVE NAV LINK (highlight current page)
  ====================================================== */
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(function (link) {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });


  /* ======================================================
     4. APPLICATION FORM — Multi-step & Validation
  ====================================================== */
  const applicationForm = document.getElementById('applicationForm');

  if (applicationForm) {
    const steps       = Array.from(document.querySelectorAll('.form-step'));
    const progressDots = Array.from(document.querySelectorAll('.progress-step'));
    const prevBtn     = document.getElementById('prevStep');
    const nextBtn     = document.getElementById('nextStep');
    const submitBtn   = document.getElementById('submitForm');
    const stepIndicator = document.getElementById('stepIndicator');
    let currentStep   = 0;

    // Show correct step
    function showStep(index) {
      steps.forEach(function (s, i) {
        s.style.display = i === index ? '' : 'none';
      });
      progressDots.forEach(function (dot, i) {
        dot.classList.remove('active', 'done');
        if (i < index) dot.classList.add('done');
        if (i === index) dot.classList.add('active');
      });
      if (stepIndicator) {
        stepIndicator.textContent = 'Step ' + (index + 1) + ' of ' + steps.length;
      }
      // Button visibility
      if (prevBtn) prevBtn.style.display = index === 0 ? 'none' : '';
      if (nextBtn) nextBtn.style.display = index < steps.length - 1 ? '' : 'none';
      if (submitBtn) submitBtn.style.display = index === steps.length - 1 ? '' : 'none';
    }

    // Validate a single step's required fields
    function validateStep(index) {
      const step = steps[index];
      const fields = step.querySelectorAll('[required]');
      let valid = true;

      fields.forEach(function (field) {
        const group = field.closest('.form-group');
        clearError(group);
        if (!field.value.trim()) {
          showError(group, field, 'This field is required.');
          valid = false;
        } else if (field.type === 'email' && !isValidEmail(field.value)) {
          showError(group, field, 'Please enter a valid email address.');
          valid = false;
        } else if (field.type === 'tel' && field.value.trim().length < 7) {
          showError(group, field, 'Please enter a valid phone number.');
          valid = false;
        }
      });

      // Check at least one checkbox in checkbox groups
      step.querySelectorAll('.checkbox-group[data-required="true"]').forEach(function (group) {
        const checked = group.querySelector('input[type="checkbox"]:checked');
        const wrap = group.closest('.form-group');
        if (!checked) {
          showError(wrap, null, 'Please select at least one option.');
          valid = false;
        }
      });

      return valid;
    }

    function showError(group, field, msg) {
      if (!group) return;
      group.classList.add('has-error');
      if (field) field.classList.add('error');
      const errEl = group.querySelector('.error-msg');
      if (errEl) errEl.textContent = msg;
    }

    function clearError(group) {
      if (!group) return;
      group.classList.remove('has-error');
      group.querySelectorAll('.error').forEach(function (el) { el.classList.remove('error'); });
    }

    function isValidEmail(val) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    }

    // Next button
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        if (validateStep(currentStep)) {
          currentStep++;
          showStep(currentStep);
          window.scrollTo({ top: applicationForm.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' });
        } else {
          showToast('Please fill in all required fields.', 'error');
        }
      });
    }

    // Prev button
    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        currentStep--;
        showStep(currentStep);
        window.scrollTo({ top: applicationForm.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' });
      });
    }

    // Submit
    if (submitBtn) {
      submitBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (!validateStep(currentStep)) {
          showToast('Please fill in all required fields.', 'error');
          return;
        }

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting…';

        // Simulate sending email via Formspree (replace ACTION_URL with your Formspree endpoint)
        const formData = new FormData(applicationForm);

        const actionUrl = applicationForm.getAttribute('action');

        if (actionUrl && actionUrl !== '#') {
          fetch(actionUrl, {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
          })
          .then(function (res) {
            if (res.ok) {
              showSuccessMessage();
            } else {
              throw new Error('Server error');
            }
          })
          .catch(function () {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Application';
            showToast('Something went wrong. Please try again or email us directly.', 'error');
          });
        } else {
          // Demo mode: just show success after 1.5s
          setTimeout(function () {
            showSuccessMessage();
          }, 1500);
        }
      });
    }

    function showSuccessMessage() {
      const formContent = document.getElementById('formContent');
      const successMsg  = document.getElementById('successMessage');
      if (formContent) formContent.style.display = 'none';
      if (successMsg)  successMsg.style.display  = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // File upload display
    document.querySelectorAll('input[type="file"]').forEach(function (input) {
      input.addEventListener('change', function () {
        const display = this.closest('.form-group').querySelector('.file-name-display');
        if (display) {
          display.textContent = this.files.length
            ? '📎 ' + Array.from(this.files).map(function (f) { return f.name; }).join(', ')
            : '';
        }
      });
    });

    // Drag and drop visual
    document.querySelectorAll('.file-upload').forEach(function (zone) {
      zone.addEventListener('dragover', function (e) { e.preventDefault(); this.classList.add('dragover'); });
      zone.addEventListener('dragleave', function () { this.classList.remove('dragover'); });
      zone.addEventListener('drop', function (e) {
        e.preventDefault();
        this.classList.remove('dragover');
        const input = this.querySelector('input[type="file"]');
        if (input && e.dataTransfer.files.length) {
          input.files = e.dataTransfer.files;
          input.dispatchEvent(new Event('change'));
        }
      });
    });

    // Init
    showStep(0);
  }


  /* ======================================================
     5. CONTACT FORM
  ====================================================== */
  const contactForm = document.getElementById('contactForm');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const btn = contactForm.querySelector('[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Sending…';

      const actionUrl = contactForm.getAttribute('action');

      if (actionUrl && actionUrl !== '#') {
        fetch(actionUrl, {
          method: 'POST',
          body: new FormData(contactForm),
          headers: { 'Accept': 'application/json' }
        })
        .then(function (res) {
          if (res.ok) {
            showToast('Message sent! We\'ll be in touch soon.', 'success');
            contactForm.reset();
          } else throw new Error();
        })
        .catch(function () {
          showToast('Could not send. Please email us directly.', 'error');
        })
        .finally(function () {
          btn.disabled = false;
          btn.textContent = 'Send Message';
        });
      } else {
        setTimeout(function () {
          showToast('Message sent! We\'ll be in touch soon.', 'success');
          contactForm.reset();
          btn.disabled = false;
          btn.textContent = 'Send Message';
        }, 1200);
      }
    });
  }


  /* ======================================================
     6. TOAST NOTIFICATION
  ====================================================== */
  function showToast(message, type) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast toast--' + (type || 'success');
    const icon = type === 'error' ? '⚠️' : '✅';
    toast.innerHTML = '<span>' + icon + '</span><span>' + message + '</span>';
    document.body.appendChild(toast);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () { toast.classList.add('show'); });
    });

    setTimeout(function () {
      toast.classList.remove('show');
      setTimeout(function () { toast.remove(); }, 500);
    }, 4000);
  }

  // Expose globally for inline use
  window.showToast = showToast;


  /* ======================================================
     7. SMOOTH ANCHOR SCROLLING
  ====================================================== */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 72;
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
      }
    });
  });


  /* ======================================================
     8. NAVBAR SCROLL SHADOW
  ====================================================== */
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', function () {
      navbar.style.boxShadow = window.scrollY > 16 ? '0 2px 20px rgba(13,27,62,0.12)' : '';
    }, { passive: true });
  }

});
