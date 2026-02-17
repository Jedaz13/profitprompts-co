/* ============================================
   ProfitPrompts.co — Shared Tracking & Interactivity
   ============================================ */

window.dataLayer = window.dataLayer || [];

/* ---------- Stripe Payment Link Placeholders ---------- */
var STRIPE_LINKS = {
  italian: {
    playbook: 'https://buy.stripe.com/ITALIAN_47',
    bundle: 'https://buy.stripe.com/ITALIAN_84'
  },
  dental: {
    playbook: 'https://buy.stripe.com/DENTAL_47',
    bundle: 'https://buy.stripe.com/DENTAL_84'
  },
  auto: {
    playbook: 'https://buy.stripe.com/AUTO_47',
    bundle: 'https://buy.stripe.com/AUTO_84'
  }
};

/* ---------- Niche Detection ---------- */
function getNiche() {
  var path = window.location.pathname;
  if (path.includes('italian')) return 'italian_restaurants';
  if (path.includes('dental')) return 'dental_offices';
  if (path.includes('auto')) return 'auto_repair';
  return 'homepage';
}

function getNicheKey() {
  var path = window.location.pathname;
  if (path.includes('italian')) return 'italian';
  if (path.includes('dental')) return 'dental';
  if (path.includes('auto')) return 'auto';
  return null;
}

/* ---------- Page Type Detection ---------- */
function getPageType() {
  var path = window.location.pathname;
  if (path.includes('thank-you')) return 'thank_you';
  if (path.includes('privacy') || path.includes('terms')) return 'legal';
  if (path === '/' || path === '/index.html') return 'homepage';
  return 'landing_page';
}

/* ---------- Order Value from URL ---------- */
function getOrderValue() {
  var params = new URLSearchParams(window.location.search);
  return params.get('bump') === 'true' ? 84.00 : 47.00;
}

/* ---------- Page View Event ---------- */
dataLayer.push({
  'event': 'page_view',
  'page_type': getPageType(),
  'niche': getNiche(),
  'product': 'revenue_playbook'
});

/* ---------- Purchase Event (Thank You Pages) ---------- */
if (getPageType() === 'thank_you') {
  dataLayer.push({
    'event': 'purchase',
    'niche': getNiche(),
    'value': getOrderValue(),
    'currency': 'USD',
    'transaction_id': new URLSearchParams(window.location.search).get('session_id') || 'txn_' + Date.now()
  });
}

/* ---------- DOM Ready ---------- */
document.addEventListener('DOMContentLoaded', function() {
  var nicheKey = getNicheKey();

  /* --- CTA Click Tracking --- */
  document.querySelectorAll('.cta-button').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var href = btn.getAttribute('href') || '';
      var isBundle = href.includes('_84');
      dataLayer.push({
        'event': 'begin_checkout',
        'niche': getNiche(),
        'value': isBundle ? 84.00 : 47.00,
        'currency': 'USD'
      });
    });
  });

  /* --- Order Bump Toggle --- */
  var orderBump = document.getElementById('order-bump');
  if (orderBump && nicheKey) {
    orderBump.addEventListener('change', function() {
      var link = this.checked ? STRIPE_LINKS[nicheKey].bundle : STRIPE_LINKS[nicheKey].playbook;

      // Update ALL CTA buttons on the page
      document.querySelectorAll('.cta-button').forEach(function(btn) {
        btn.setAttribute('href', link);
      });

      // Update price displays
      var totalPrice = document.getElementById('total-price');
      if (totalPrice) {
        totalPrice.textContent = this.checked ? '$84' : '$47';
      }

      var stickyPrice = document.getElementById('sticky-price');
      if (stickyPrice) {
        stickyPrice.textContent = this.checked ? '$84' : '$47';
      }

      // Fire GTM event when bump is added
      if (this.checked) {
        dataLayer.push({
          'event': 'add_to_cart',
          'product': 'starter_kit_' + getNiche(),
          'value': 37.00,
          'currency': 'USD'
        });
      }
    });
  }

  /* --- FAQ Accordion --- */
  document.querySelectorAll('.faq-question').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var item = this.parentElement;
      item.classList.toggle('active');
    });
  });

  /* --- Sticky Mobile CTA (IntersectionObserver) --- */
  var stickyCta = document.getElementById('sticky-cta');
  var heroSection = document.querySelector('.hero');
  if (stickyCta && heroSection && window.innerWidth < 768) {
    document.body.classList.add('has-sticky-cta');
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) {
          stickyCta.classList.add('visible');
        } else {
          stickyCta.classList.remove('visible');
        }
      });
    }, { threshold: 0 });
    observer.observe(heroSection);
  }

  /* --- Exit Intent Popup (Desktop Only) --- */
  var exitPopup = document.getElementById('exit-popup');
  var exitPopupClose = document.getElementById('exit-popup-close');
  if (exitPopup && window.innerWidth >= 768) {
    document.addEventListener('mouseout', function(e) {
      if (e.clientY < 5 && !sessionStorage.getItem('exitPopupShown')) {
        exitPopup.classList.add('visible');
        sessionStorage.setItem('exitPopupShown', 'true');
        dataLayer.push({
          'event': 'exit_intent_shown',
          'niche': getNiche()
        });
      }
    });

    if (exitPopupClose) {
      exitPopupClose.addEventListener('click', function() {
        exitPopup.classList.remove('visible');
      });
    }

    // Close on overlay click
    exitPopup.addEventListener('click', function(e) {
      if (e.target === exitPopup) {
        exitPopup.classList.remove('visible');
      }
    });
  }
});
