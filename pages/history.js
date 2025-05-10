import { useQuery, useMutation } from 'react-query';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import HistoryItem from '../components/HistoryItem';

export default function History() {
  const [filter, setFilter] = useState('all');
  
  const { data: historyItems = [], isLoading, isError, refetch } = useQuery(
    ['history', filter],
    async () => {
      const response = await fetch(`/api/history?type=${filter}`);
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }
      return response.json();
    }
  );

  const clearMutation = useMutation(
    async () => {
      const response = await fetch('/api/history', {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to clear history');
      }
      return response.json();
    },
    {
      onSuccess: () => {
        refetch();
      },
    }
  );

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your history?')) {
      clearMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen relative">
      <Head>
        <title>Identification History | NatureID</title>
        <meta name="description" content="View your plant and animal identification history" />
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
        <div className="text-center mb-12">
          <h1 className="text-6xl font-black mb-8 text-white">Your <span className="text-spring-green">History</span></h1>
          <p className="text-2xl font-medium text-white/90 mb-12 max-w-3xl mx-auto">
            View and manage your previous plant and animal identifications
          </p>
        </div>
        
        <div className="bg-black/40 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden shadow-[0_0_45px_-15px_rgba(0,255,127,0.25)] mb-20">
          <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
              <div className="flex bg-black/60 p-1 rounded-full border border-white/20 shadow-lg">
                <button
                  className={`py-2 px-6 rounded-full text-sm font-medium transition-all ${filter === 'all' ? 'bg-spring-green text-black' : 'text-white hover:text-spring-green'}`}
                  onClick={() => setFilter('all')}
                >
                  All
                </button>
                <button
                  className={`py-2 px-6 rounded-full text-sm font-medium transition-all ${filter === 'plant' ? 'bg-spring-green text-black' : 'text-white hover:text-spring-green'}`}
                  onClick={() => setFilter('plant')}
                >
                  Plants
                </button>
                <button
                  className={`py-2 px-6 rounded-full text-sm font-medium transition-all ${filter === 'animal' ? 'bg-spring-green text-black' : 'text-white hover:text-spring-green'}`}
                  onClick={() => setFilter('animal')}
                >
                  Animals
                </button>
              </div>
              <button
                className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors font-medium"
                onClick={handleClearHistory}
                disabled={historyItems.length === 0}
              >
                Clear History
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-16">
                <svg className="animate-spin h-12 w-12 text-spring-green" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : isError ? (
              <div className="p-6 mb-6 bg-red-900/40 border border-red-500/50 rounded-xl text-white">
                <p className="font-semibold text-xl mb-2">Error loading history</p>
                <p>We couldn't load your identification history. Please try again later.</p>
              </div>
            ) : historyItems.length === 0 ? (
              <div className="text-center py-16 bg-black/20 rounded-xl border border-white/10">
                <div className="text-spring-green text-5xl mb-4">📜</div>
                <h3 className="text-2xl font-bold text-white mb-2">No history yet</h3>
                <p className="text-white/70 mb-6">Start identifying plants and animals to build your history</p>
                <Link href="/" className="inline-block bg-gradient-to-r from-lime-green to-dark-green hover:from-spring-green hover:to-forest-green text-white font-bold py-3 px-6 rounded-xl shadow-[0_8px_25px_rgba(0,255,127,0.3)] transition-all hover:-translate-y-1 active:translate-y-0">
                  Start Identifying
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {historyItems.map((item) => (
                  <HistoryItem key={item.id} item={item} />
                ))}
              </div>
            )}
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
