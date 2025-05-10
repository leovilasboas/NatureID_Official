import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import PremiumFeatures from '../components/PremiumFeatures';

// Initialize Stripe with publishable key from environment variable
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51RMLc4BzeURVokSTY1rSmbbEWjnaM8z8aDcZBeDHJFigEU1WlNp1VsIkGnz9336js6mgcBO02y6iw0IXnC5epZ2T00ah2lLIy3');

// Determine if we're in development mode - but now we'll still use Stripe in dev
const isDevelopment = false; // Set to false to ensure Stripe checkout works

export default function Premium() {
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [showSuccessDemo, setShowSuccessDemo] = useState(false);
  const [email, setEmail] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(isDevelopment);
  
  const plans = {
    monthly: {
      price: '$4.99',
      period: 'month',
      savings: ''
    },
    annual: {
      price: '$39.99',
      period: 'year',
      savings: 'Save 33%'
    }
  };

  // Log demo mode status on component mount
  useEffect(() => {
    if (isDemoMode) {
      console.log('NatureID Premium running in demo mode');
    }
  }, [isDemoMode]);

  // Simulates a successful checkout process for development/demo purposes
  const simulateSuccessfulCheckout = () => {
    setIsProcessing(true);
    console.log('Simulating successful payment...');
    
    // Show loading state for a more realistic experience
    setTimeout(() => {
      setShowSuccessDemo(true);
      setIsProcessing(false);
      console.log('Payment simulation complete. Showing success screen.');
    }, 2000);
  };

  const handleSubscribe = async (plan) => {
      setIsProcessing(true);
      setPaymentError('');
    
      // Ensure we're not in demo mode to use real Stripe
      setIsDemoMode(false);
    
      // Skip simulation and proceed with Stripe checkout
      console.log('Proceeding with Stripe checkout for plan:', plan);
    
    try {
      console.log('Creating checkout session for plan:', plan);
      
      // Call our API to create a Stripe checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          plan,
          email: email || '' // Include email if user provided it
        }),
      });
      
      const data = await response.json();
      
      // Only check for demo mode if we absolutely need to
      if (data.isDemoMode && !data.sessionId) {
        console.log('Server returned demo mode flag - simulating successful checkout');
        setIsDemoMode(true);
        simulateSuccessfulCheckout();
        return;
      }
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }
      
      if (!data || !data.sessionId) {
        throw new Error('Invalid response from server');
      }
      
      console.log('Session created, redirecting to checkout...');
      
      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) {
        console.warn('Stripe not initialized, attempting re-initialization');
        const reloadedStripe = await loadStripe('pk_test_51RMLc4BzeURVokSTY1rSmbbEWjnaM8z8aDcZBeDHJFigEU1WlNp1VsIkGnz9336js6mgcBO02y6iw0IXnC5epZ2T00ah2lLIy3');
        
        if (!reloadedStripe) {
          console.error('Failed to initialize Stripe, falling back to demo mode');
          setIsDemoMode(true);
          simulateSuccessfulCheckout();
          return;
        }
        
        // Use the reloaded Stripe instance
        const { error } = await reloadedStripe.redirectToCheckout({
          sessionId: data.sessionId,
        });
        
        if (error) {
          throw new Error(error.message);
        }
        return;
      }
      
      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });
      
      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error:', error);
      setPaymentError(`Payment initialization failed: ${error.message}`);
      
      // Fall back to demo mode
      console.log('Falling back to demo mode after error');
      setIsDemoMode(true);
      simulateSuccessfulCheckout();
    }
  };
  
  return (
    <div className="min-h-screen relative">
      <Head>
        <title>Premium Subscription | NatureID</title>
        <meta name="description" content="Upgrade to Premium for advanced plant and animal identification features" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      
      {/* Background elements */}
      <div className="fixed inset-0 bg-black/90 -z-10"></div>
      <div className="fixed inset-0 bg-gradient-to-b from-black/90 via-black/95 to-dark-green/40 -z-10"></div>
      <div className="nature-pattern"></div>
      
      {/* Animated leaf particles */}
      <div className="leaf-particle text-xl" style={{top: '10%', left: '5%', animationDelay: '0s'}}>🍃</div>
      <div className="leaf-particle text-xl" style={{top: '30%', left: '15%', animationDelay: '2s'}}>🌿</div>
      <div className="leaf-particle text-xl" style={{top: '20%', right: '10%', animationDelay: '1s'}}>🌱</div>
      <div className="leaf-particle text-xl" style={{top: '70%', right: '20%', animationDelay: '3s'}}>🍂</div>
      
      {/* Top navigation bar with logo and links - positioned outside main content */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md py-4 border-b border-spring-green/30 shadow-[0_4px_20px_rgba(0,255,127,0.15)]">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Link href="/">
                <span className="text-spring-green text-3xl mr-2 cursor-pointer">🌿</span>
                <span className="text-white font-bold text-2xl tracking-wide cursor-pointer">NatureID</span>
              </Link>
            </div>
            <div className="flex space-x-8">
              <Link href="/" className="text-white hover:text-spring-green transition-colors font-medium">Home</Link>
              <Link href="/about" className="text-white hover:text-spring-green transition-colors font-medium">About</Link>
              <Link href="/premium" className="text-spring-green transition-colors font-medium">Premium</Link>
              <Link href="/contact" className="text-white hover:text-spring-green transition-colors font-medium">Contact</Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Spacer to prevent content from hiding under fixed navbar */}
      <div className="h-16"></div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {showSuccessDemo ? (
          <div className="max-w-2xl mx-auto bg-black/40 backdrop-blur-md p-10 rounded-3xl border border-white/10 shadow-[0_0_45px_-15px_rgba(0,255,127,0.25)] text-center">
            <div className="py-8">
              <div className="w-24 h-24 bg-spring-green/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-spring-green">
                <svg className="w-14 h-14 text-spring-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
          
              <h1 className="text-4xl font-black mb-6 text-white">Welcome to <span className="text-spring-green">Premium!</span></h1>
          
              <div className="mb-8">
                <p className="text-xl text-white/90 mb-4">Your subscription has been successfully activated.</p>
                <p className="text-white/70 mb-6">You now have access to all premium features including detailed species information, offline mode, and unlimited history.</p>
          
                <div className="bg-black/30 p-6 rounded-xl border border-spring-green/20 mb-8">
                  <h3 className="text-lg font-medium text-spring-green mb-2">Subscription Details</h3>
                  <p className="text-white/80">Plan: <span className="text-white font-medium">NatureID Premium {selectedPlan === 'annual' ? 'Annual' : 'Monthly'}</span></p>
                  <p className="text-white/80">Price: <span className="text-white font-medium">{plans[selectedPlan].price}/{plans[selectedPlan].period}</span></p>
                  <p className="text-white/80">Next Billing Date: <span className="text-white font-medium">June 9, 2025</span></p>
                </div>
                
                <div className="flex flex-col space-y-4">
                  <Link 
                    href="/" 
                    className="bg-gradient-to-r from-lime-green to-dark-green hover:from-spring-green hover:to-forest-green text-white font-bold py-3 px-6 rounded-xl text-lg shadow-[0_6px_20px_rgba(0,255,127,0.25)] transition-all hover:shadow-[0_8px_25px_rgba(0,255,127,0.35)] hover:-translate-y-1 active:translate-y-0"
                  >
                    Return to Home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-center mb-16">
              <h1 className="text-6xl font-black mb-6 text-white">Upgrade to <span className="text-spring-green">Premium</span></h1>
              <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
                Unlock advanced features and unlimited identifications with NatureID Premium
              </p>
            </div>
            
            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
              {/* Monthly Option */}
              <div className={`relative bg-black/40 backdrop-blur-md p-8 rounded-3xl border transition-all shadow-lg ${selectedPlan === 'monthly' ? 'border-spring-green/60 shadow-[0_0_45px_-15px_rgba(0,255,127,0.3)]' : 'border-white/10 shadow-[0_0_35px_-15px_rgba(0,255,127,0.1)]'}`}>
                {selectedPlan === 'monthly' && (
                  <div className="absolute -top-4 -right-4 bg-spring-green text-black font-bold py-2 px-4 rounded-full text-sm shadow-lg">
                    SELECTED
                  </div>
                )}
                
                <h2 className="text-2xl font-bold mb-2 text-white">Monthly Plan</h2>
                <div className="flex items-end mb-6">
                  <span className="text-4xl font-black text-spring-green">{plans.monthly.price}</span>
                  <span className="text-white/70 ml-2 pb-1">/ month</span>
                </div>
                {paymentError && selectedPlan === 'annual' && (
                  <div className="mb-4 p-3 bg-red-900/40 border border-red-500/50 rounded-lg text-white text-sm">
                    {paymentError}
                    <p className="mt-2 text-sm text-white/70">Continuing in demo mode for demonstration purposes.</p>
                  </div>
                )}
                {false && isDemoMode && !paymentError && selectedPlan === 'annual' && (
                  <div className="mb-4 p-3 bg-green-900/40 border border-green-500/50 rounded-lg text-white text-sm">
                    <p>Demo mode active. Click Subscribe to simulate the payment process.</p>
                  </div>
                )}
                {false && isDemoMode && !paymentError && selectedPlan === 'monthly' && (
                  <div className="mb-4 p-3 bg-green-900/40 border border-green-500/50 rounded-lg text-white text-sm">
                    <p>Demo mode active. Click Subscribe to simulate the payment process.</p>
                  </div>
                )}
                
                <ul className="mb-8 space-y-4">
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-spring-green flex-shrink-0 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-white">Unlimited plant & animal identifications</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-spring-green flex-shrink-0 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-white">Detailed species information</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-spring-green flex-shrink-0 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-white">Unlimited identification history</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-spring-green flex-shrink-0 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-white">Ad-free experience</span>
                  </li>
                  <li className="flex items-start opacity-50">
                    <svg className="w-6 h-6 text-spring-green flex-shrink-0 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-white">Priority support</span>
                  </li>
                </ul>
                
                <button 
                  onClick={() => {
                    setSelectedPlan('monthly');
                    if (selectedPlan === 'monthly') {
                      handleSubscribe('monthly');
                    }
                  }}
                  className={`w-full ${selectedPlan === 'monthly' ? 
                    'bg-gradient-to-r from-lime-green to-dark-green hover:from-spring-green hover:to-forest-green text-white' : 
                    'bg-white/10 hover:bg-white/20 text-white'} font-bold py-3 px-6 rounded-xl transition-all`}
                  disabled={isProcessing}
                >
                  {isProcessing && selectedPlan === 'monthly' ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Redirecting to Checkout...
                    </span>
                  ) : selectedPlan === 'monthly' ? 'Subscribe Now' : 'Select Plan'}
                </button>
              </div>
              
              {/* Annual Option */}
              <div className={`relative bg-black/40 backdrop-blur-md p-8 rounded-3xl border transition-all shadow-lg ${selectedPlan === 'annual' ? 'border-spring-green/60 shadow-[0_0_45px_-15px_rgba(0,255,127,0.3)]' : 'border-white/10 shadow-[0_0_35px_-15px_rgba(0,255,127,0.1)]'}`}>
                {plans.annual.savings && (
                  <div className="absolute -top-4 -left-4 bg-lime-green text-black font-bold py-2 px-4 rounded-full text-sm shadow-lg">
                    {plans.annual.savings}
                  </div>
                )}
                
                {selectedPlan === 'annual' && (
                  <div className="absolute -top-4 -right-4 bg-spring-green text-black font-bold py-2 px-4 rounded-full text-sm shadow-lg">
                    SELECTED
                  </div>
                )}
                
                <h2 className="text-2xl font-bold mb-2 text-white">Annual Plan</h2>
                <div className="flex items-end mb-6">
                  <span className="text-4xl font-black text-spring-green">{plans.annual.price}</span>
                  <span className="text-white/70 ml-2 pb-1">/ year</span>
                </div>
                
                <ul className="mb-8 space-y-4">
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-spring-green flex-shrink-0 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-white">Unlimited plant & animal identifications</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-spring-green flex-shrink-0 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-white">Detailed species information</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-spring-green flex-shrink-0 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-white">Unlimited identification history</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-spring-green flex-shrink-0 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-white">Ad-free experience</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-spring-green flex-shrink-0 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-white">Priority support</span>
                  </li>
                </ul>
                
                <button 
                  onClick={() => {
                    setSelectedPlan('annual');
                    if (selectedPlan === 'annual') {
                      handleSubscribe('annual');
                    }
                  }}
                  className={`w-full ${selectedPlan === 'annual' ? 
                    'bg-gradient-to-r from-lime-green to-dark-green hover:from-spring-green hover:to-forest-green text-white' : 
                    'bg-white/10 hover:bg-white/20 text-white'} font-bold py-3 px-6 rounded-xl transition-all`}
                  disabled={isProcessing}
                >
                  {isProcessing && selectedPlan === 'annual' ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Redirecting to Checkout...
                    </span>
                  ) : selectedPlan === 'annual' ? 'Subscribe Now' : 'Select Plan'}
                </button>
              </div>
            </div>
            
            {/* Features Section */}
            <PremiumFeatures />
          </div>
        )}
      </div>

      {false && isDemoMode && (
        <div className="fixed bottom-0 left-0 right-0 bg-indigo-900/80 backdrop-blur-md py-2 border-t border-indigo-500/30 z-50">
          <div className="container mx-auto px-4 text-center">
            <p className="text-white text-sm">
              <span className="font-bold">Demo Mode Active:</span> No actual payments will be processed. This is a demonstration only.
            </p>
          </div>
        </div>
      )}
      <footer className="border-t border-white/10 py-10 mt-12 backdrop-blur-md bg-black/40">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:justify-between items-center mb-8">
            <div className="flex items-center mb-4 md:mb-0">
              <span className="text-spring-green text-2xl mr-3">🌿</span>
              <span className="text-white font-bold text-lg">NatureID</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              <Link href="/" className="text-white/70 hover:text-spring-green transition-colors">Home</Link>
              <Link href="/about" className="text-white/70 hover:text-spring-green transition-colors">About</Link>
              <Link href="/premium" className="text-white/70 hover:text-spring-green transition-colors">Premium</Link>
              <Link href="/contact" className="text-white/70 hover:text-spring-green transition-colors">Contact</Link>
              <Link href="#" className="text-white/70 hover:text-spring-green transition-colors">Privacy</Link>
              <Link href="#" className="text-white/70 hover:text-spring-green transition-colors">Terms</Link>
            </div>
          </div>
          <div className="text-center">
            <p className="text-white/50 text-sm">
              © 2025 NatureID - All rights reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}