/* ============================================
   ProfitPrompts.co — Shared Tracking & Interactivity
   ============================================ */

window.dataLayer = window.dataLayer || [];

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

/* ---------- Page View Event ---------- */
dataLayer.push({
  'event': 'page_view',
  'page_type': getPageType(),
  'niche': getNiche(),
  'product': 'revenue_playbook'
});

/* ---------- Purchase Event (Thank You Pages) ---------- */
if (getPageType() === 'thank_you') {
  var params = new URLSearchParams(window.location.search);
  var sessionId = params.get('session_id') || 'txn_' + Date.now();
  var orderValue = parseFloat(params.get('value')) || 47.00;

  dataLayer.push({
    'event': 'purchase',
    'niche': getNiche(),
    'value': orderValue,
    'currency': 'USD',
    'transaction_id': sessionId
  });
}

/* ============================================
   CHECKOUT STATE & BUMP MANAGEMENT
   Uses same proven pattern as Gut Healing Academy
   ============================================ */

var bumpState = { 1: false };
var checkoutInProgress = false;
var BASE_PRICE = 47;
var BUMP_PRICES = { 1: 27 };

/* Toggle bump — entire card is clickable */
function toggleBump(num) {
  bumpState[num] = !bumpState[num];
  var card = document.getElementById('bump' + num);
  if (card) card.classList.toggle('checked', bumpState[num]);
  updateOrderSummary();

  if (bumpState[num]) {
    dataLayer.push({
      'event': 'add_to_cart',
      'product': 'starter_kit_' + getNiche(),
      'value': BUMP_PRICES[num],
      'currency': 'USD'
    });
  }
}

/* Update all price displays across the page */
function updateOrderSummary() {
  var total = BASE_PRICE;
  if (bumpState[1]) total += BUMP_PRICES[1];

  var summaryBump1 = document.getElementById('summaryBump1');
  if (summaryBump1) summaryBump1.classList.toggle('visible', bumpState[1]);

  var orderTotal = document.getElementById('orderTotal');
  if (orderTotal) orderTotal.textContent = '$' + total;

  var ctaButton = document.getElementById('ctaButton');
  if (ctaButton) ctaButton.textContent = 'Get Instant Access \u2014 $' + total;

  var stickyPrice = document.getElementById('sticky-price');
  if (stickyPrice) stickyPrice.textContent = '$' + total;
}

/* Checkout handler — reads bump state from DOM at checkout time */
function handleCheckout() {
  if (checkoutInProgress) return;
  checkoutInProgress = true;

  var niche = getNicheKey();

  /* Read bump state from DOM (not just JS variable) — proven more reliable */
  var bump1El = document.getElementById('bump1');
  var bump1Active = bump1El ? bump1El.classList.contains('checked') : false;
  var totalValue = BASE_PRICE + (bump1Active ? BUMP_PRICES[1] : 0);

  /* Fire GTM event */
  dataLayer.push({
    'event': 'begin_checkout',
    'niche': getNiche(),
    'include_starter': bump1Active,
    'value': totalValue,
    'currency': 'USD'
  });

  /* Update button to show loading */
  var btn = document.getElementById('ctaButton');
  if (btn) {
    btn.textContent = 'Processing...';
    btn.disabled = true;
  }

  /* POST to serverless API */
  var payload = {
    niche: niche,
    include_starter: bump1Active
  };

  fetch('/api/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(function(res) { return res.json(); })
  .then(function(data) {
    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error(data.error || 'No URL returned');
    }
  })
  .catch(function(err) {
    console.error('Checkout error:', err);
    fallbackToPaymentLink(niche);
  });
}

/* Fallback Payment Links — if API fails, user can still buy (without bumps) */
var FALLBACK_LINKS = {
  italian: 'https://buy.stripe.com/ITALIAN_FALLBACK',
  dental: 'https://buy.stripe.com/DENTAL_FALLBACK',
  auto: 'https://buy.stripe.com/AUTO_FALLBACK'
};

function fallbackToPaymentLink(niche) {
  checkoutInProgress = false;
  var btn = document.getElementById('ctaButton');
  if (btn) {
    var total = BASE_PRICE + (bumpState[1] ? BUMP_PRICES[1] : 0);
    btn.textContent = 'Get Instant Access \u2014 $' + total;
    btn.disabled = false;
  }

  if (FALLBACK_LINKS[niche]) {
    window.location.href = FALLBACK_LINKS[niche];
  } else {
    alert('Something went wrong. Please try again or email hello@profitprompts.co');
  }
}

/* Browser back/forward cache recovery */
window.addEventListener('pageshow', function(event) {
  if (event.persisted) {
    checkoutInProgress = false;
    var bump1El = document.getElementById('bump1');
    if (bump1El) {
      bumpState[1] = bump1El.classList.contains('checked');
    }
    updateOrderSummary();
    var btn = document.getElementById('ctaButton');
    if (btn) btn.disabled = false;
  }
});

/* ---------- DOM Ready ---------- */
document.addEventListener('DOMContentLoaded', function() {

  /* --- Other CTAs scroll to pricing section (landing pages only) --- */
  if (getPageType() === 'landing_page') {
    document.querySelectorAll('.cta-button:not(.main-cta)').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        var target = document.getElementById('order-summary');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
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

    exitPopup.addEventListener('click', function(e) {
      if (e.target === exitPopup) {
        exitPopup.classList.remove('visible');
      }
    });
  }
});
