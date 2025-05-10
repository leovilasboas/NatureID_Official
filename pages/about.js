import Head from 'next/head';
import Link from 'next/link';

export default function About() {
  return (
    <div className="min-h-screen relative">
      <Head>
        <title>About NatureID | Plant & Animal Identification App</title>
        <meta name="description" content="Learn about NatureID, our mission, technology, and the team behind the premier plant and animal identification application." />
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
              <Link href="/about" className="text-spring-green transition-colors font-medium">About</Link>
              <Link href="/premium" className="text-white hover:text-spring-green transition-colors font-medium">Premium</Link>
              <Link href="/contact" className="text-white hover:text-spring-green transition-colors font-medium">Contact</Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Spacer to prevent content from hiding under fixed navbar */}
      <div className="h-16"></div>
      
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-black mb-8 text-white">About <span className="text-spring-green">NatureID</span></h1>
          <p className="text-2xl font-medium text-white/90 mb-12 max-w-3xl mx-auto">
            Connecting people with the natural world through technology and discovery.
          </p>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          <div className="bg-black/40 backdrop-blur-md p-10 rounded-3xl border border-white/10 hover:border-spring-green/20 transition-all shadow-[0_0_45px_-15px_rgba(0,255,127,0.25)]">
            <h2 className="text-3xl font-bold mb-8 stripe-gradient-text">Our Mission</h2>
            <div className="prose prose-lg prose-invert max-w-none text-white/90">
              <p>At NatureID, we're on a mission to connect people with the natural world around them. Our AI-powered identification tool helps everyone from casual nature enthusiasts to serious researchers identify plants and animals instantly.</p>
              <p>We believe that understanding what we see in nature is the first step to appreciating and protecting it. By making species identification accessible to everyone, we hope to inspire a deeper connection with biodiversity and promote conservation efforts worldwide.</p>
              <p>Founded in 2023, NatureID combines cutting-edge artificial intelligence with extensive biological databases to provide accurate, real-time identification of thousands of species.</p>
            </div>
          </div>
          
          <div className="bg-black/40 backdrop-blur-md p-10 rounded-3xl border border-white/10 hover:border-spring-green/20 transition-all shadow-[0_0_45px_-15px_rgba(0,255,127,0.25)]">
            <h2 className="text-3xl font-bold mb-8 stripe-gradient-text">Our Technology</h2>
            <div className="prose prose-lg prose-invert max-w-none text-white/90">
              <p>NatureID utilizes state-of-the-art computer vision and machine learning algorithms to analyze images and identify species with remarkable accuracy. Our technology can recognize thousands of plant and animal species from around the world.</p>
              <p>We continually train our models on millions of verified observations, collaborating with botanists, zoologists, and naturalists to ensure scientific accuracy. Our system not only identifies species but also provides valuable information about their habitat, distribution, and conservation status.</p>
              <p>By incorporating location data, NatureID can also narrow down possibilities based on geographic distribution, further improving accuracy. Our goal is to make the identification process as seamless and reliable as possible.</p>
            </div>
          </div>
        </div>
        
        {/* Team Section */}
        <div className="mb-24">
          <h2 className="text-5xl font-black mb-12 text-center stripe-gradient-text" style={{ letterSpacing: '-0.03em' }}>
            Our Team
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-black/40 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:border-spring-green/20 transition-all transform hover:scale-[1.03] hover:-translate-y-2 shadow-[0_0_30px_-10px_rgba(0,255,127,0.2)]">
              <div className="h-64 rounded-2xl mb-6 overflow-hidden shadow-lg">
                <div className="w-full h-full bg-gradient-to-br from-lime-green/40 to-forest-green/40 flex items-center justify-center">
                  <span className="text-5xl">👩‍🔬</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2 text-white">Dr. Ana Silva</h3>
              <p className="text-spring-green font-medium mb-4">Lead Botanist</p>
              <p className="text-white/80">Ph.D. in Botany from Oxford University with over 15 years of experience in plant taxonomy and field research.</p>
            </div>
            
            <div className="bg-black/40 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:border-spring-green/20 transition-all transform hover:scale-[1.03] hover:-translate-y-2 shadow-[0_0_30px_-10px_rgba(0,255,127,0.2)]">
              <div className="h-64 rounded-2xl mb-6 overflow-hidden shadow-lg">
                <div className="w-full h-full bg-gradient-to-br from-lime-green/40 to-forest-green/40 flex items-center justify-center">
                  <span className="text-5xl">👨‍💻</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2 text-white">Marco Chen</h3>
              <p className="text-spring-green font-medium mb-4">AI Engineering Lead</p>
              <p className="text-white/80">Former machine learning researcher at Google with expertise in computer vision and deep learning for biological classification.</p>
            </div>
            
            <div className="bg-black/40 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:border-spring-green/20 transition-all transform hover:scale-[1.03] hover:-translate-y-2 shadow-[0_0_30px_-10px_rgba(0,255,127,0.2)]">
              <div className="h-64 rounded-2xl mb-6 overflow-hidden shadow-lg">
                <div className="w-full h-full bg-gradient-to-br from-lime-green/40 to-forest-green/40 flex items-center justify-center">
                  <span className="text-5xl">👨‍🦱</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2 text-white">James Wilson</h3>
              <p className="text-spring-green font-medium mb-4">Conservation Director</p>
              <p className="text-white/80">Wildlife conservationist with 12 years at National Geographic, focusing on biodiversity mapping and species preservation.</p>
            </div>
          </div>
        </div>
        
        {/* Partners Section */}
        <div className="mb-24">
          <h2 className="text-4xl font-bold mb-10 text-center text-white">Our Partners</h2>
          <div className="flex flex-wrap justify-center items-center gap-12">
            <div className="bg-white/5 hover:bg-white/10 transition-colors rounded-2xl p-6 w-64 h-36 flex items-center justify-center border border-white/10 hover:border-spring-green/30">
              <span className="text-4xl mr-3">🌳</span>
              <span className="text-white font-semibold text-xl">National Park Service</span>
            </div>
            <div className="bg-white/5 hover:bg-white/10 transition-colors rounded-2xl p-6 w-64 h-36 flex items-center justify-center border border-white/10 hover:border-spring-green/30">
              <span className="text-4xl mr-3">🌍</span>
              <span className="text-white font-semibold text-xl">World Wildlife Fund</span>
            </div>
            <div className="bg-white/5 hover:bg-white/10 transition-colors rounded-2xl p-6 w-64 h-36 flex items-center justify-center border border-white/10 hover:border-spring-green/30">
              <span className="text-4xl mr-3">🔬</span>
              <span className="text-white font-semibold text-xl">Smithsonian Institute</span>
            </div>
            <div className="bg-white/5 hover:bg-white/10 transition-colors rounded-2xl p-6 w-64 h-36 flex items-center justify-center border border-white/10 hover:border-spring-green/30">
              <span className="text-4xl mr-3">📚</span>
              <span className="text-white font-semibold text-xl">iNaturalist</span>
            </div>
          </div>
        </div>
        
        {/* Final CTA Section */}
        <div className="text-center mb-20 relative p-10 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-spring-green/10 rounded-full blur-[80px] pointer-events-none"></div>
          
          <h2 className="text-4xl font-black mb-6 text-white relative">Join Our Mission</h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Help us promote biodiversity awareness and conservation through technology.
          </p>
          <Link 
            href="/premium" 
            className="inline-block bg-gradient-to-r from-lime-green to-dark-green hover:from-spring-green hover:to-forest-green text-white font-bold py-4 px-10 rounded-2xl text-xl shadow-[0_8px_25px_rgba(0,255,127,0.3)] transition-all hover:shadow-[0_12px_30px_rgba(0,255,127,0.4)] hover:-translate-y-1 active:translate-y-0 relative overflow-hidden group pulse-glow"
          >
            <span className="relative z-10">Get Premium</span>
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