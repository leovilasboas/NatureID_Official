import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function Success() {
  const router = useRouter();
  const { session_id } = router.query;
  const [status, setStatus] = useState('loading');
  const [sessionDetails, setSessionDetails] = useState(null);

  useEffect(() => {
    if (!session_id) return;

    // In a real application, you would validate the session with Stripe here
    // For demo purposes, we'll just simulate a successful payment
    const checkoutSession = async () => {
      try {
        // Simulating API call to validate session
        await new Promise(resolve => setTimeout(resolve, 1500));
        setSessionDetails({
          customer_email: 'customer@example.com',
          subscription: {
            plan: 'Premium',
            status: 'active'
          }
        });
        setStatus('success');
      } catch (error) {
        console.error('Error verifying session:', error);
        setStatus('error');
      }
    };

    checkoutSession();
  }, [session_id]);

  return (
    <div className="min-h-screen relative">
      <Head>
        <title>Subscription Success | NatureID</title>
        <meta name="description" content="Your premium subscription has been activated" />
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
              <Link href="/premium" className="text-white hover:text-spring-green transition-colors font-medium">Premium</Link>
              <Link href="/contact" className="text-white hover:text-spring-green transition-colors font-medium">Contact</Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Spacer to prevent content from hiding under fixed navbar */}
      <div className="h-16"></div>
      
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="max-w-2xl mx-auto bg-black/40 backdrop-blur-md p-10 rounded-3xl border border-white/10 shadow-[0_0_45px_-15px_rgba(0,255,127,0.25)] text-center">
          {status === 'loading' && (
            <div className="py-12">
              <div className="animate-spin w-16 h-16 border-4 border-spring-green border-t-transparent rounded-full mx-auto mb-6"></div>
              <h2 className="text-2xl font-bold text-white mb-2">Processing Your Subscription</h2>
              <p className="text-white/70">Please wait while we confirm your payment...</p>
            </div>
          )}
          
          {status === 'success' && (
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
                  <p className="text-white/80 mb-1">Plan: Premium</p>
                  <p className="text-white/80 mb-1">Status: Active</p>
                  <p className="text-white/80">Next billing date: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/"
                  className="bg-gradient-to-r from-lime-green to-dark-green hover:from-spring-green hover:to-forest-green text-white font-bold py-3 px-8 rounded-xl shadow-[0_8px_25px_rgba(0,255,127,0.3)] transition-all hover:shadow-[0_12px_30px_rgba(0,255,127,0.4)] hover:-translate-y-1"
                >
                  Start Exploring
                </Link>
              </div>
            </div>
          )}
          
          {status === 'error' && (
            <div className="py-8">
              <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/50">
                <svg className="w-14 h-14 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              
              <h1 className="text-3xl font-bold mb-6 text-white">Something went wrong</h1>
              <p className="text-white/80 mb-8">We couldn't verify your subscription. Please contact support or try again.</p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/premium"
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 py-3 px-6 rounded-xl transition-all"
                >
                  Try Again
                </Link>
                <Link 
                  href="/contact"
                  className="bg-gradient-to-r from-lime-green to-dark-green hover:from-spring-green hover:to-forest-green text-white font-bold py-3 px-6 rounded-xl shadow-[0_8px_25px_rgba(0,255,127,0.3)] transition-all hover:shadow-[0_12px_30px_rgba(0,255,127,0.4)] hover:-translate-y-1"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

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