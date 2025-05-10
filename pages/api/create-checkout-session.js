// This is a Next.js API route to handle Stripe checkout sessions
import Stripe from 'stripe';

// Always initialize Stripe with the test key for now
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51RMLc4BzeURVokSTdvMDdTVtmyAHOO4RSniWECh3GCKTSJWHhb7I5cPUdV27GHEFD1zSwOS7S5W6MLvDR0iVz43R00ZPqSKuIo');

// Set development mode to false to ensure we use the real Stripe
const isDevelopment = false;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log the request body for debugging
    console.log('Request body:', req.body);
    const { plan } = req.body;
    
    // Define price IDs for each subscription plan - hardcoded for now to ensure they work
    const priceIds = {
      monthly: process.env.STRIPE_PRICE_MONTHLY || 'price_1S9GdrBzeURVokSTMN45VVpH',
      annual: process.env.STRIPE_PRICE_ANNUAL || 'price_1S9GeKBzeURVokSTSOiPSyxG'
    };
    
    if (!plan || !priceIds[plan]) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    // Skip simulation and always use real Stripe checkout
    if (false) {
      // This block never executes now
      console.log('Development mode: Simulating Stripe checkout session');
      return res.status(200).json({ 
        sessionId: 'mock_session_id',
        isDemoMode: true,
        message: 'Using demo mode in development' 
      });
    }
    
    // Only execute this in production with a valid Stripe setup
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceIds[plan],
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/premium`,
      allow_promotion_codes: true,
      customer_email: req.body.email,
      metadata: {
        plan: plan
      },
    });

    console.log('Session created:', session.id);
    return res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe error:', error);
    
    // Return just the error for debugging
    return res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error.message
    });
  }
}