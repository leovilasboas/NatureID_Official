// This is a Next.js API route to handle Stripe customer portal sessions
import Stripe from 'stripe';

// Initialize Stripe with your secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51RMLc4BzeURVokSTdvMDdTVtmyAHOO4RSniWECh3GCKTSJWHhb7I5cPUdV27GHEFD1zSwOS7S5W6MLvDR0iVz43R00ZPqSKuIo');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // For demo purposes, we're using a test customer
    // In production, you should get the customer ID from your authentication system
    const customerId = req.body.customerId || 'cus_mock_id'; // Replace with a way to get the authenticated customer

    // Create a customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${req.headers.origin}/account`, // Where to redirect after the portal session ends
      // Optional: if you have a specific configuration ID
      // configuration: 'conf_xyz',
    });

    // Return the URL to redirect the customer to
    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe customer portal error:', error);
    
    // For demo, return a mock URL if there's an error (like missing customer)
    if (error.code === 'resource_missing' && error.param === 'customer') {
      return res.status(200).json({ 
        url: 'https://billing.stripe.com/p/demo',
        isDemoMode: true,
        message: 'Using demo portal URL since no customer ID was found' 
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to create customer portal session',
      details: error.message
    });
  }
}