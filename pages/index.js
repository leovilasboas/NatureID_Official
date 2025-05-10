import { useState } from 'react';
import { useMutation } from 'react-query';
import Head from 'next/head';
import Link from 'next/link';
import ImageUploader from '../components/ImageUploader';
import ResultDisplay from '../components/ResultDisplay';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [results, setResults] = useState(null);

  const identifyMutation = useMutation(async ({ imageData, locationData }) => {
    const response = await fetch('/api/identify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        image: imageData,
        location: locationData 
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      // Create error object with all the details from the API
      const errorObj = new Error(data.message || 'Failed to identify the image');
      errorObj.status = response.status;
      errorObj.details = data;
      throw errorObj;
    }

    return data;
  }, {
    onSuccess: (data) => {
      setResults(data);
    },
  });

  const handleImageSelect = (imageData) => {
    console.log("Image selected:", imageData ? `${imageData.substring(0, 30)}... (length: ${imageData.length})` : "null");
    setImage(imageData);
    setResults(null);
  };
  
  const handleLocationSelect = (locationData) => {
    console.log("Location selected:", locationData);
    setLocation(locationData);
  };

  const handleIdentify = () => {
    if (image) {
      console.log("Sending image for identification, length:", image.length);
      console.log("Location data:", location);
      identifyMutation.mutate({ 
        imageData: image, 
        locationData: location 
      });
    } else {
      console.error("No image to identify");
      alert("Por favor, selecione uma imagem primeiro.");
    }
  };

  return (
    <div className="min-h-screen relative">
      <Head>
        <title>NatureID - Plant & Animal Identification</title>
        <meta name="description" content="Identify plants and animals with AI" />
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
              <span className="text-spring-green text-3xl mr-2">🌿</span>
              <span className="text-white font-bold text-2xl tracking-wide">NatureID</span>
            </div>
            <div className="flex space-x-8">
              <Link href="/" className="text-spring-green transition-colors font-medium">Home</Link>
              <Link href="/about" className="text-white hover:text-spring-green transition-colors font-medium">About</Link>
              <Link href="/premium" className="text-white hover:text-spring-green transition-colors font-medium">Premium</Link>
              <Link href="/contact" className="text-white hover:text-spring-green transition-colors font-medium">Contact</Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Spacer to prevent content from hiding under fixed navbar */}
      <div className="h-16"></div>

      <div className="container mx-auto px-4 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-7xl font-black mb-8 relative" style={{ 
            letterSpacing: '-0.03em'
          }}>
            <span className="inline-block text-spring-green">
              Discover
            </span>{" "}
            <span className="text-white">the Natural World</span>
          </h1>
          <p className="text-2xl font-medium text-white/90 mb-12 max-w-3xl mx-auto">
            Identify plants and animals instantly with our AI technology.
            Just take a photo or upload an image to begin your nature exploration.
          </p>
        </div>

        {/* Main Content */}
        {!results ? (
          <div className="max-w-3xl mx-auto mb-20">
            {/* Unified Photo Card */}
            <div className="bg-black/40 backdrop-blur-md p-10 rounded-3xl border border-white/10 hover:border-spring-green/20 transition-all shadow-[0_0_45px_-15px_rgba(0,255,127,0.25)]">
              <h2 className="text-3xl font-bold mb-8 stripe-gradient-text">
                Add a Photo
              </h2>
              <div className="mb-8">
                <ImageUploader onImageSelect={handleImageSelect} onLocationSelect={handleLocationSelect} />
              </div>
              {image && (
                <button
                  className="w-full bg-gradient-to-r from-lime-green to-dark-green hover:from-spring-green hover:to-forest-green text-white font-bold py-4 px-8 rounded-2xl text-lg shadow-[0_8px_25px_rgba(0,255,127,0.3)] transition-all hover:shadow-[0_12px_30px_rgba(0,255,127,0.4)] hover:-translate-y-1 active:translate-y-0"
                  onClick={handleIdentify}
                  disabled={identifyMutation.isLoading}
                >
                  {identifyMutation.isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing Image...
                    </span>
                  ) : "Identify Now"}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-black/40 backdrop-blur-md p-10 rounded-3xl border border-white/10 mb-20 shadow-[0_0_45px_-15px_rgba(0,255,127,0.25)]">
            <ResultDisplay results={results} onReset={() => {
              setImage(null);
              setResults(null);
            }} />
          </div>
        )}

        {identifyMutation.isError && (
          <div className="p-6 mb-10 bg-red-900/50 text-white rounded-xl border border-red-500/50">
            <p className="font-semibold text-xl mb-2">Error {identifyMutation.error.status && `(${identifyMutation.error.status})`}:</p>
            <p>{identifyMutation.error.message}</p>
            {identifyMutation.error.details?.error && (
              <p className="mt-2 text-red-300">{identifyMutation.error.details.error}</p>
            )}
            {identifyMutation.error.status === 401 && (
              <div className="mt-4 pt-4 border-t border-red-500/30">
                <p className="font-medium">Authentication Error:</p>
                <p className="text-red-300 mt-1">The API key is invalid or missing. Please check your API credentials.</p>
              </div>
            )}
          </div>
        )}

        {/* Features Section */}
        <div className="mb-24">
          <h2 className="text-5xl font-black mb-12 text-center stripe-gradient-text" style={{ letterSpacing: '-0.03em' }}>
            Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-black/40 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:border-spring-green/20 transition-all transform hover:scale-[1.03] hover:-translate-y-2 shadow-[0_0_30px_-10px_rgba(0,255,127,0.2)]">
              <div className="text-spring-green text-4xl mb-4">🌿</div>
              <h3 className="text-2xl font-bold mb-4 text-white">Plants</h3>
              <p className="text-white/80">Identify thousands of plant species with our advanced AI image recognition technology</p>
            </div>
            <div className="bg-black/40 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:border-spring-green/20 transition-all transform hover:scale-[1.03] hover:-translate-y-2 shadow-[0_0_30px_-10px_rgba(0,255,127,0.2)]">
              <div className="text-lime-green text-4xl mb-4">🦁</div>
              <h3 className="text-2xl font-bold mb-4 text-white">Animals</h3>
              <p className="text-white/80">Recognize wild animals from your photos with high accuracy and detailed information</p>
            </div>
            <div className="bg-black/40 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:border-spring-green/20 transition-all transform hover:scale-[1.03] hover:-translate-y-2 shadow-[0_0_30px_-10px_rgba(0,255,127,0.2)]">
              <div className="text-spotify-green text-4xl mb-4">📱</div>
              <h3 className="text-2xl font-bold mb-4 text-white">Easy to Use</h3>
              <p className="text-white/80">Take a photo directly with your camera or upload an existing image to get instant identification</p>
            </div>
          </div>
        </div>

        {/* Final CTA Section */}
        <div className="text-center mb-20 relative p-10 overflow-hidden">
          {/* Blur spot effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-spring-green/10 rounded-full blur-[80px] pointer-events-none"></div>
          
          <h2 className="text-4xl font-black mb-6 text-white relative">Ready to explore nature?</h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">Start identifying plants and animals around you today.</p>
          <Link 
            href="/about" 
            className="inline-block bg-gradient-to-r from-lime-green to-dark-green hover:from-spring-green hover:to-forest-green text-white font-bold py-4 px-10 rounded-2xl text-xl shadow-[0_8px_25px_rgba(0,255,127,0.3)] transition-all hover:shadow-[0_12px_30px_rgba(0,255,127,0.4)] hover:-translate-y-1 active:translate-y-0 relative overflow-hidden group pulse-glow"
          >
            <span className="relative z-10">Get Started</span>
            <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></span>
          </Link>
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
