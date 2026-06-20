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

    // --- Date of Birth dropdowns (Day / Month / Year) ---
    const dobDay   = document.getElementById('dobDay');
    const dobMonth = document.getElementById('dobMonth');
    const dobYear  = document.getElementById('dobYear');
    const dobHidden = document.getElementById('dob');

    if (dobDay && dobMonth && dobYear && dobHidden) {
      // Populate Day 1–31
      for (let d = 1; d <= 31; d++) {
        const opt = document.createElement('option');
        opt.value = String(d).padStart(2, '0');
        opt.textContent = d;
        dobDay.appendChild(opt);
      }

      // Populate Year — full range, newest first, no artificial age limiting
      const currentYear = new Date().getFullYear();
      const earliestYear = currentYear - 100;
      for (let y = currentYear; y >= earliestYear; y--) {
        const opt = document.createElement('option');
        opt.value = String(y);
        opt.textContent = y;
        dobYear.appendChild(opt);
      }

      // Keep hidden combined field (YYYY-MM-DD) in sync for validation/email export
      function syncDobHidden() {
        if (dobDay.value && dobMonth.value && dobYear.value) {
          dobHidden.value = dobYear.value + '-' + dobMonth.value + '-' + dobDay.value;
        } else {
          dobHidden.value = '';
        }
      }
      [dobDay, dobMonth, dobYear].forEach(function (el) {
        el.addEventListener('change', syncDobHidden);
      });
    }


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
      let valid = true;

      // --- Text / email / tel / select / textarea fields ---
      step.querySelectorAll('input[required], select[required], textarea[required]').forEach(function (field) {
        // Skip checkboxes and radios — handled separately below
        if (field.type === 'checkbox' || field.type === 'radio') return;

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

      // --- Radio groups: at least one must be selected ---
      var radioGroupsSeen = {};
      step.querySelectorAll('input[type="radio"][required]').forEach(function (radio) {
        var name = radio.name;
        if (radioGroupsSeen[name]) return; // only check each group once
        radioGroupsSeen[name] = true;

        var anyChecked = step.querySelector('input[type="radio"][name="' + name + '"]:checked');
        var group = radio.closest('.form-group');
        clearError(group);
        if (!anyChecked) {
          showError(group, null, 'Please select one of the options above.');
          valid = false;
        }
      });

      // --- Checkbox groups: every required checkbox must be checked ---
      step.querySelectorAll('input[type="checkbox"][required]').forEach(function (checkbox) {
        var group = checkbox.closest('.form-group');
        clearError(group);
        if (!checkbox.checked) {
          showError(group, null, 'Please check this box to continue.');
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
        const isRealEndpoint = actionUrl && actionUrl !== '#' && actionUrl.startsWith('http');

        if (isRealEndpoint) {
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
          // No Formspree URL set yet — show success screen (demo / pre-launch mode)
          setTimeout(function () {
            showSuccessMessage();
          }, 1000);
        }
      });
    }

    function showSuccessMessage() {
      const formContent = document.getElementById('formContent');
      const successMsg  = document.getElementById('successMessage');
      if (formContent) formContent.style.display = 'none';
      if (successMsg)  successMsg.style.display  = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      launchConfetti();
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


/* ======================================================
   9. CONFETTI
====================================================== */
function launchConfetti() {
  var colors = ['#6c3fc5', '#2756c8', '#9b72e8', '#ffffff', '#e8e0ff', '#1a3a8f'];
  var confettiCount = 150;
  var container = document.createElement('div');
  container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;overflow:hidden;';
  document.body.appendChild(container);

  for (var i = 0; i < confettiCount; i++) {
    (function(i) {
      var piece = document.createElement('div');
      var size  = Math.random() * 10 + 6;
      var color = colors[Math.floor(Math.random() * colors.length)];
      var left  = Math.random() * 100;
      var delay = Math.random() * 3;
      var duration = Math.random() * 2.5 + 2;
      var shape = Math.random() > 0.5 ? '50%' : '2px';
      var rotation = Math.random() * 360;

      piece.style.cssText = [
        'position:absolute',
        'top:-20px',
        'left:' + left + '%',
        'width:' + size + 'px',
        'height:' + size + 'px',
        'background:' + color,
        'border-radius:' + shape,
        'opacity:0.9',
        'animation:confettiFall ' + duration + 's ' + delay + 's ease-in forwards',
        'transform:rotate(' + rotation + 'deg)',
      ].join(';');

      container.appendChild(piece);
    })(i);
  }

  // Inject keyframes once
  if (!document.getElementById('confettiStyles')) {
    var style = document.createElement('style');
    style.id = 'confettiStyles';
    style.textContent = [
      '@keyframes confettiFall {',
      '  0%   { transform: translateY(0)   rotate(0deg)   scaleX(1); opacity: 1; }',
      '  50%  { transform: translateY(50vh) rotate(180deg) scaleX(0.6); opacity: 0.9; }',
      '  100% { transform: translateY(105vh) rotate(360deg) scaleX(1); opacity: 0; }',
      '}',
    ].join('');
    document.head.appendChild(style);
  }

  // Clean up after animation finishes
  setTimeout(function () {
    if (container.parentNode) container.parentNode.removeChild(container);
  }, 6000);
}
