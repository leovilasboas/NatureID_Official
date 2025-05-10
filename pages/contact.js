import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

export default function Contact() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Simple validation
    if (!formState.name || !formState.email || !formState.message) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (!formState.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    // In a real app, this would send data to a backend API
    console.log('Form submitted:', formState);
    
    // Simulate successful submission
    setSubmitted(true);
    setError('');
  };

  return (
    <div className="min-h-screen relative">
      <Head>
        <title>Contact Us | NatureID</title>
        <meta name="description" content="Get in touch with the NatureID team for support, partnerships, or feedback." />
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
              <Link href="/contact" className="text-spring-green transition-colors font-medium">Contact</Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Spacer to prevent content from hiding under fixed navbar */}
      <div className="h-16"></div>
      
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-black mb-8 text-white">Get in <span className="text-spring-green">Touch</span></h1>
          <p className="text-2xl font-medium text-white/90 mb-12 max-w-3xl mx-auto">
            Have questions, feedback, or interested in partnerships? We'd love to hear from you.
          </p>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          <div className="bg-black/40 backdrop-blur-md p-10 rounded-3xl border border-white/10 transition-all shadow-[0_0_45px_-15px_rgba(0,255,127,0.25)]">
            {!submitted ? (
              <>
                <h2 className="text-3xl font-bold mb-8 stripe-gradient-text">Send us a Message</h2>
                {error && (
                  <div className="mb-6 p-4 bg-red-900/40 border border-red-500/50 rounded-lg text-white">
                    {error}
                  </div>
                )}
                <form onSubmit={handleSubmit}>
                  <div className="mb-6">
                    <label htmlFor="name" className="block text-white font-medium mb-2">Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formState.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-black/60 border border-white/20 rounded-lg focus:border-spring-green/50 focus:outline-none text-white"
                      placeholder="Your name"
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="email" className="block text-white font-medium mb-2">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formState.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-black/60 border border-white/20 rounded-lg focus:border-spring-green/50 focus:outline-none text-white"
                      placeholder="Your email address"
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="subject" className="block text-white font-medium mb-2">Subject</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formState.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-black/60 border border-white/20 rounded-lg focus:border-spring-green/50 focus:outline-none text-white"
                      placeholder="What is this regarding?"
                    />
                  </div>
                  
                  <div className="mb-8">
                    <label htmlFor="message" className="block text-white font-medium mb-2">Message *</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formState.message}
                      onChange={handleChange}
                      rows="6"
                      className="w-full px-4 py-3 bg-black/60 border border-white/20 rounded-lg focus:border-spring-green/50 focus:outline-none text-white resize-none"
                      placeholder="Your message"
                    ></textarea>
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-lime-green to-dark-green hover:from-spring-green hover:to-forest-green text-white font-bold py-4 px-8 rounded-xl text-lg shadow-[0_8px_25px_rgba(0,255,127,0.3)] transition-all hover:shadow-[0_12px_30px_rgba(0,255,127,0.4)] hover:-translate-y-1 active:translate-y-0"
                  >
                    Send Message
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-spring-green text-6xl mb-6">✓</div>
                <h2 className="text-3xl font-bold mb-4 text-white">Message Sent!</h2>
                <p className="text-white/90 mb-8">Thank you for reaching out. We'll get back to you as soon as possible.</p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormState({
                      name: '',
                      email: '',
                      subject: '',
                      message: ''
                    });
                  }}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Send Another Message
                </button>
              </div>
            )}
          </div>
          
          <div className="space-y-8">
            <div className="bg-black/40 backdrop-blur-md p-8 rounded-3xl border border-white/10 transition-all shadow-[0_0_45px_-15px_rgba(0,255,127,0.25)]">
              <h2 className="text-2xl font-bold mb-6 stripe-gradient-text">Contact Information</h2>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-spring-green/20 p-3 rounded-full mr-4">
                    <svg className="w-6 h-6 text-spring-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">Email</h3>
                    <a href="mailto:support@natureid.app" className="text-spring-green hover:underline">support@natureid.app</a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-spring-green/20 p-3 rounded-full mr-4">
                    <svg className="w-6 h-6 text-spring-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">Phone</h3>
                    <p className="text-white/90">+1 (555) 123-4567</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-spring-green/20 p-3 rounded-full mr-4">
                    <svg className="w-6 h-6 text-spring-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">Address</h3>
                    <p className="text-white/90">123 Nature Avenue<br />Palo Alto, CA 94301<br />United States</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-black/40 backdrop-blur-md p-8 rounded-3xl border border-white/10 transition-all shadow-[0_0_45px_-15px_rgba(0,255,127,0.25)]">
              <h2 className="text-2xl font-bold mb-6 stripe-gradient-text">Connect with us</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <a href="#" className="flex items-center p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                  <div className="bg-[#1DA1F2]/20 p-2 rounded-full mr-3">
                    <span className="text-2xl">🐦</span>
                  </div>
                  <span className="text-white font-medium">Twitter</span>
                </a>
                
                <a href="#" className="flex items-center p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                  <div className="bg-[#4267B2]/20 p-2 rounded-full mr-3">
                    <span className="text-2xl">📘</span>
                  </div>
                  <span className="text-white font-medium">Facebook</span>
                </a>
                
                <a href="#" className="flex items-center p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                  <div className="bg-[#C13584]/20 p-2 rounded-full mr-3">
                    <span className="text-2xl">📷</span>
                  </div>
                  <span className="text-white font-medium">Instagram</span>
                </a>
                
                <a href="#" className="flex items-center p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                  <div className="bg-[#FF0000]/20 p-2 rounded-full mr-3">
                    <span className="text-2xl">📺</span>
                  </div>
                  <span className="text-white font-medium">YouTube</span>
                </a>
              </div>
            </div>
          </div>
        </div>
        
        {/* FAQ Section */}
        <div className="mb-24">
          <h2 className="text-4xl font-bold mb-10 text-center text-white">Frequently Asked Questions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-black/40 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:border-spring-green/20 transition-all">
              <h3 className="text-xl font-bold mb-4 text-white">How accurate is NatureID?</h3>
              <p className="text-white/80">Our AI can identify thousands of plant and animal species with an accuracy rate of over 90% for common species. Factors like image quality and angle can affect results.</p>
            </div>
            
            <div className="bg-black/40 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:border-spring-green/20 transition-all">
              <h3 className="text-xl font-bold mb-4 text-white">Is the app available worldwide?</h3>
              <p className="text-white/80">Yes! NatureID is available globally, with species databases covering most regions. Our location feature helps narrow down possibilities based on your geographic area.</p>
            </div>
            
            <div className="bg-black/40 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:border-spring-green/20 transition-all">
              <h3 className="text-xl font-bold mb-4 text-white">How do I get the best identification results?</h3>
              <p className="text-white/80">For best results, take clear, well-lit photos that focus on distinctive features like leaves, flowers, or patterns. Adding location data also improves accuracy.</p>
            </div>
            
            <div className="bg-black/40 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:border-spring-green/20 transition-all">
              <h3 className="text-xl font-bold mb-4 text-white">What's included in the Premium subscription?</h3>
              <p className="text-white/80">Premium includes unlimited identifications, detailed species information, offline mode, and priority customer support. Visit our Premium page to learn more.</p>
            </div>
          </div>
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