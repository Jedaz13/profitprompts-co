var stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

var ALLOWED_ORIGINS = [
  'https://profitprompts.co',
  'https://www.profitprompts.co'
];

module.exports = async function handler(req, res) {
  // CORS
  var origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var sessionId = req.query.session_id;

  if (!sessionId) {
    return res.status(400).json({ error: 'Missing session_id parameter' });
  }

  try {
    var session = await stripe.checkout.sessions.retrieve(sessionId);

    return res.status(200).json({
      amount: session.amount_total / 100,
      currency: session.currency
    });
  } catch (error) {
    console.error('Stripe session retrieve error:', error);
    return res.status(500).json({ error: 'Failed to retrieve session' });
  }
};
