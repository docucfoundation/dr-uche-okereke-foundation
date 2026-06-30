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

    // ====================================================
    // APPLICATION DEADLINE
    // Format: 'YYYY-MM-DDTHH:MM:SS+01:00'  (+01:00 = WAT, Nigeria time)
    // ====================================================
    const APPLICATION_DEADLINE = '2026-08-20T23:59:00+01:00';

    const deadlinePassed = new Date() > new Date(APPLICATION_DEADLINE);

    if (deadlinePassed) {
      const formContent   = document.getElementById('formContent');
      const closedMessage = document.getElementById('closedMessage');
      if (formContent)   formContent.style.display = 'none';
      if (closedMessage) closedMessage.style.display = '';
    }

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

    // --- Mirror applicant email into _replyto so Gmail filter can auto-reply to them ---
    var emailField   = document.getElementById('email');
    var replyToField = document.getElementById('_replyto');
    if (emailField && replyToField) {
      function syncReplyTo() { replyToField.value = emailField.value; }
      emailField.addEventListener('input',  syncReplyTo);
      emailField.addEventListener('change', syncReplyTo); // catches browser autofill
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
        } else if (field.type === 'tel' && !/^\+?\d{7,15}$/.test(field.value.replace(/\s+/g, ''))) {
          showError(group, field, 'Please enter a valid phone number (digits only, 7–15 digits).');
          valid = false;
        } else if (field.id === 'personalStatement') {
          // Word count: must be between 600 and 800 words
          var wc = field.value.trim().split(/\s+/).filter(Boolean).length;
          if (wc < 600) {
            showError(group, field, 'Your personal statement is too short (' + wc + ' words). Minimum is 600 words.');
            valid = false;
          } else if (wc > 800) {
            showError(group, field, 'Your personal statement is too long (' + wc + ' words). Maximum is 800 words.');
            valid = false;
          }
        }
      });

      // --- Date of Birth: required + age must be 17-25 ---
      // Runs on every step but only activates when the DOB field is in the current step.
      if (dobDay && step.contains(dobDay)) {
        var dobGroup = dobDay.closest('.form-group');
        if (dobGroup) clearError(dobGroup);

        if (!dobHidden || !dobHidden.value) {
          // User hasn't selected all three dropdowns yet
          if (dobGroup) showError(dobGroup, null, 'Please select your full date of birth.');
          valid = false;
        } else {
          var dobDate  = new Date(dobHidden.value);
          var ageYears = (new Date() - dobDate) / (365.25 * 24 * 60 * 60 * 1000);
          if (ageYears < 17 || ageYears > 25) {
            if (dobGroup) showError(dobGroup, null, 'You must be between 17 and 25 years old at the time of application.');
            valid = false;
          }
        }
      }

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

        // Re-check the deadline at submit time too, in case the page
        // was left open and the deadline passed mid-session
        if (new Date() > new Date(APPLICATION_DEADLINE)) {
          const formContent   = document.getElementById('formContent');
          const closedMessage = document.getElementById('closedMessage');
          if (formContent)   formContent.style.display = 'none';
          if (closedMessage) closedMessage.style.display = '';
          return;
        }

        if (!validateStep(currentStep)) {
          showToast('Please fill in all required fields.', 'error');
          return;
        }

        // Validate required uploads
        if (!validateUploads()) {
          showToast('Please upload all required documents before submitting.', 'error');
          return;
        }

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting…';

        // Build form data and submit to Web3Forms
        const formData = new FormData(applicationForm);

        const actionUrl = applicationForm.getAttribute('action');
        const isRealEndpoint = actionUrl && actionUrl !== '#' && actionUrl.startsWith('http');

        if (isRealEndpoint) {
          fetch(actionUrl, {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
          })
          .then(function (res) { return res.json(); })
          .then(function (data) {
            if (data.success) {
              showSuccessMessage();
            } else {
              throw new Error('Rejected by server');
            }
          })
          .catch(function () {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Application';
            showToast('Something went wrong. Please try again or email us at contact@docucfoundation.org', 'error');
          });
        } else {
          // Form endpoint is not configured — surface the error immediately rather than
          // silently swallowing submissions.
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Application';
          showToast('Form is not configured correctly. Please contact us at contact@docucfoundation.org', 'error');
        }
      });
    }

    function showSuccessMessage() {
      const formContent = document.getElementById('formContent');
      const successMsg  = document.getElementById('successMessage');
      if (formContent) formContent.style.display = 'none';
      if (successMsg)  successMsg.style.display  = 'block';
      // Reset button state so navigating back doesn't leave it disabled
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Application';
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      launchConfetti();
    }

    // --- Bytescale upload buttons ---
    // ====================================================
    // BYTESCALE API KEY — REPLACE BEFORE GOING LIVE
    // Sign up at https://www.bytescale.com/get-started, then
    // copy your PUBLIC key (starts with "public_") from the
    // dashboard and paste it below. Never use a secret key here.
    // ====================================================
    var BYTESCALE_API_KEY = 'public_REPLACE_WITH_YOUR_KEY';

    // Map each upload button id → the hidden field that stores its file URL
    var bsWidgets = {
      'btn-admission': { hiddenId: 'ucAdmissionUrl', required: true,  groupId: 'grp-admission', statusId: 'status-admission' },
      'btn-academic':  { hiddenId: 'ucAcademicUrl',  required: true,  groupId: 'grp-academic',  statusId: 'status-academic'  },
      'btn-hardship':  { hiddenId: 'ucHardshipUrl',  required: true,  groupId: 'grp-hardship',  statusId: 'status-hardship'  },
      'btn-id':        { hiddenId: 'ucIdUrl',        required: false, groupId: 'grp-id',        statusId: 'status-id'        },
      'btn-passport':  { hiddenId: 'ucPassportUrl',  required: true,  groupId: 'grp-passport',  statusId: 'status-passport'  }
    };

    var bytescaleAvailable = typeof Bytescale !== 'undefined' && Bytescale.UploadWidget;

    if (bytescaleAvailable) {
      Object.keys(bsWidgets).forEach(function (btnId) {
        var cfg = bsWidgets[btnId];
        var btn = document.getElementById(btnId);
        if (!btn) return;

        btn.addEventListener('click', function () {
          var statusEl = document.getElementById(cfg.statusId);
          var grp      = document.getElementById(cfg.groupId);
          var isImageOnly = btn.getAttribute('data-images-only') === 'true';

          var options = {
            apiKey: BYTESCALE_API_KEY,
            maxFileCount: 1,
            maxFileSizeBytes: 10485760 // 10 MB, matches the stated limit on the page
          };
          if (isImageOnly) {
            options.mimeTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/webp'];
          }

          Bytescale.UploadWidget.open(options).then(
            function (files) {
              if (!files || files.length === 0) {
                // User closed the modal without selecting a file — leave existing value as-is.
                return;
              }
              var hidden = document.getElementById(cfg.hiddenId);
              if (hidden) hidden.value = files[0].fileUrl;

              if (statusEl) {
                statusEl.textContent = '✓ ' + (files[0].originalFile && files[0].originalFile.originalFileName ? files[0].originalFile.originalFileName : 'File uploaded');
                statusEl.classList.remove('failed');
                statusEl.classList.add('uploaded');
              }
              btn.textContent = '📎 Replace File';

              // Clear any error on the group
              if (grp) {
                grp.classList.remove('has-error');
                var e = grp.querySelector('.error-msg');
                if (e) e.textContent = '';
              }
            },
            function () {
              // Upload failed or was cancelled with an error — clear the hidden field so
              // validation correctly catches it and prompts the user to re-upload.
              var hidden = document.getElementById(cfg.hiddenId);
              if (hidden) hidden.value = '';

              if (statusEl) {
                statusEl.textContent = 'Upload failed or was cancelled. Please try again.';
                statusEl.classList.remove('uploaded');
                statusEl.classList.add('failed');
              }

              if (grp) {
                grp.classList.add('has-error');
                var errEl = grp.querySelector('.error-msg');
                if (errEl) errEl.textContent = 'Upload failed or was cancelled. Please try again.';
              }
              showToast('A document upload failed. Please re-upload before submitting.', 'error');
            }
          );
        });
      });
    }

    // Validate that required uploads are done (called inside submit handler)
    function validateUploads() {
      // If the Bytescale widget script failed to load (network issue, blocked script, etc.)
      // we cannot show upload buttons at all. Rather than permanently blocking every
      // applicant, we skip upload validation and let them submit — the confirmation
      // email will instruct them to send documents separately (see contact page).
      if (!bytescaleAvailable) {
        showToast('Upload widgets could not load. Please email your documents to contact@docucfoundation.org', 'error');
        // Return true so the form is not hard-blocked — submission still goes through.
        return true;
      }

      var valid = true;
      Object.keys(bsWidgets).forEach(function (btnId) {
        var cfg = bsWidgets[btnId];
        if (!cfg.required) return;
        var hidden = document.getElementById(cfg.hiddenId);
        var grp    = document.getElementById(cfg.groupId);
        if (!hidden || !hidden.value) {
          valid = false;
          if (grp) {
            grp.classList.add('has-error');
            var errEl = grp.querySelector('.error-msg');
            if (errEl) errEl.textContent = 'Please upload this document before submitting.';
          }
        }
      });
      return valid;
    }

    // --- Live word counter for personal statement ---
    var psField   = document.getElementById('personalStatement');
    var wcDisplay = document.getElementById('wordCountDisplay');
    var wcHint    = document.getElementById('wordCountHint');
    if (psField && wcDisplay) {
      psField.addEventListener('input', function () {
        var words = psField.value.trim().split(/\s+/).filter(Boolean).length;
        wcDisplay.textContent = words + ' word' + (words !== 1 ? 's' : '');
        // Colour feedback
        if (words < 600) {
          wcDisplay.style.color = words > 500 ? '#f59e0b' : 'var(--text-muted)'; // amber warning when close
        } else if (words > 800) {
          wcDisplay.style.color = '#ef4444'; // red over limit
        } else {
          wcDisplay.style.color = '#22c55e'; // green in range
        }
      });
    }

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
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data.success) {
            showToast('Message sent! We\'ll be in touch soon.', 'success');
            contactForm.reset();
          } else {
            throw new Error('Rejected');
          }
        })
        .catch(function () {
          showToast('Could not send. Please email us at contact@docucfoundation.org', 'error');
        })
        .finally(function () {
          btn.disabled = false;
          btn.textContent = 'Send Message →';
        });
      } else {
        // Contact form endpoint not configured — show a real error, not a fake success.
        btn.disabled = false;
        btn.textContent = 'Send Message →';
        showToast('Form not configured. Please email us at contact@docucfoundation.org', 'error');
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
      var href = this.getAttribute('href');
      if (!href || href === '#') return; // bare # — let the browser handle it (no-op)
      const target = document.querySelector(href);
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
