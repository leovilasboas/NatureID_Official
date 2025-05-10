import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Layout({ children }) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => router.pathname === path;

  const navigationItems = [
    { path: '/', label: 'Identify', icon: '/icons/camera.svg' },
    { path: '/history', label: 'History', icon: '/icons/history.svg' },
    { path: '/premium', label: 'Premium', icon: '/icons/premium.svg' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#635bff" />
      </Head>
      
      {/* Header/Navigation - Stripe-inspired */}
      <header className="stripe-header z-10 relative">
        <div className="stripe-container">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <Link href="/">
                <span className="flex items-center cursor-pointer">
                  <span className="text-3xl font-bold text-white stripe-gradient-text">NatureID</span>
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigationItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <span
                    className={`py-2 text-base font-semibold cursor-pointer transition-colors duration-300 ${
                      isActive(item.path)
                        ? 'text-white'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              ))}
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                type="button"
                className="text-white focus:outline-none"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-border-color">
            <div className="stripe-container py-4 space-y-3">
              {navigationItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <span
                    className={`block py-2 text-lg font-medium cursor-pointer transition-colors duration-300 ${
                      isActive(item.path)
                        ? 'text-accent-color'
                        : 'text-primary-color hover:text-accent-color'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <img src={item.icon} alt={item.label} className="w-5 h-5 mr-3" />
                      {item.label}
                    </div>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow fade-in relative z-10">
        <div className="stripe-container py-10">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-10 relative z-10 mt-20">
        <div className="stripe-container">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <p className="text-white/70">
                &copy; {new Date().getFullYear()} NatureID. All rights reserved.
              </p>
            </div>
            <div className="flex space-x-10">
              <a href="#" className="text-white/70 hover:text-white transition-opacity duration-300">
                Privacy
              </a>
              <a href="#" className="text-white/70 hover:text-white transition-opacity duration-300">
                Terms
              </a>
              <a href="#" className="text-white/70 hover:text-white transition-opacity duration-300">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
