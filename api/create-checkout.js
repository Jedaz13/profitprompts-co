const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Niche → Stripe Price IDs (replace with real price_xxx IDs from Stripe Dashboard)
const PLAYBOOK_PRICES = {
  'italian': 'price_1T2VS1Q4GryIFzCjJ21xrBII',
  'dental': 'PRICE_DENTAL_PLAYBOOK',
  'auto': 'PRICE_AUTO_PLAYBOOK'
};

const STARTER_KIT_PRICES = {
  'italian': 'price_1T2VSRQ4GryIFzCjfFmsex0m',
  'dental': 'PRICE_DENTAL_STARTER',
  'auto': 'PRICE_AUTO_STARTER'
};

// Niche → URL paths
const NICHE_PATHS = {
  'italian': 'italian-restaurants',
  'dental': 'dental',
  'auto': 'auto-repair'
};

const ALLOWED_ORIGINS = [
  'https://profitprompts.co',
  'https://www.profitprompts.co'
];

module.exports = async function handler(req, res) {
  // CORS
  var origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    var body = req.body;
    var niche = body.niche;
    var playbookPrice = PLAYBOOK_PRICES[niche];

    if (!playbookPrice) {
      return res.status(400).json({ error: 'Invalid niche' });
    }

    // Start with base product — always included
    var lineItems = [
      { price: playbookPrice, quantity: 1 }
    ];

    // Conditionally add starter kit based on boolean flag
    if (body.include_starter === true) {
      lineItems.push({ price: STARTER_KIT_PRICES[niche], quantity: 1 });
    }

    // Build success URL — pass order value for thank-you page analytics
    // IMPORTANT: use string concatenation, NOT URLSearchParams
    // Stripe replaces {CHECKOUT_SESSION_ID} with the real session ID
    // URLSearchParams would encode the braces and break it
    var orderValue = 47;
    if (body.include_starter === true) orderValue += 37;

    var successUrl = 'https://profitprompts.co/thank-you/' + NICHE_PATHS[niche] + '.html'
      + '?session_id={CHECKOUT_SESSION_ID}'
      + '&value=' + orderValue;

    var cancelUrl = 'https://profitprompts.co/' + NICHE_PATHS[niche] + '/';

    var session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      allow_promotion_codes: true,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        niche: niche,
        include_starter: String(body.include_starter || false)
      }
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
};
