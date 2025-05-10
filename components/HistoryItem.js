import { useState } from 'react';
import Link from 'next/link';

export default function HistoryItem({ item }) {
  const [expandedView, setExpandedView] = useState(false);

  if (!item || !item.results || !item.results.identification) {
    return null;
  }
  
  const { 
    id, 
    timestamp, 
    imageData, 
    results: { 
      identification: { 
        category, 
        name, 
        scientificName, 
        confidence 
      } 
    } 
  } = item;
  
  // Parse confidence as a percentage
  const confidencePercentage = Math.round(confidence * 100);
  
  // Format date
  const formattedDate = new Date(timestamp).toLocaleString();
  
  return (
    <div className="bg-black/40 backdrop-blur-md rounded-xl border border-white/10 hover:border-spring-green/20 transition-all overflow-hidden shadow-[0_0_25px_-10px_rgba(0,255,127,0.25)]">
      <div className="relative">
        <img 
          src={imageData} 
          alt={name}
          className="w-full h-48 object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-3 py-2">
          <div className="flex items-center">
            <span className="text-lg mr-2">{category === 'plant' ? '🌿' : '🦁'}</span>
            <span className="text-white text-sm font-medium">{category === 'plant' ? 'Plant' : 'Animal'}</span>
          </div>
        </div>
      </div>
      
      <div className="p-5">
        <h3 className="font-semibold text-white text-lg mb-1">{name}</h3>
        <p className="text-spring-green/80 text-sm italic mb-2">{scientificName}</p>
        
        <div className="flex items-center mb-3">
          <span className="text-xs text-white/70 mr-1">Confidence:</span>
          <div className="w-full bg-black/60 rounded-full h-1.5 flex-grow mr-1 border border-white/10">
            <div 
              className={`h-1.5 rounded-full ${confidencePercentage >= 90 ? 'bg-spring-green' : confidencePercentage >= 70 ? 'bg-lime-green' : 'bg-amber-500'}`}
              style={{ width: `${confidencePercentage}%` }}
            ></div>
          </div>
          <span className="text-xs font-semibold text-white">{confidencePercentage}%</span>
        </div>
        
        <div className="text-xs text-white/50">
          {formattedDate}
        </div>
        
        <button
          className="mt-3 text-sm text-spring-green hover:text-white focus:outline-none flex items-center transition-colors"
          onClick={() => setExpandedView(!expandedView)}
        >
          {expandedView ? 'Show Less' : 'Show More'}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-3 w-3 ml-1 transition-transform ${expandedView ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expandedView && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-sm text-white/80">
              {item.results.identification.description || 'No additional description available.'}
            </p>
            
            <Link
              href="/premium"
              className="mt-3 inline-block text-xs px-4 py-2 bg-gradient-to-r from-lime-green to-dark-green hover:from-spring-green hover:to-forest-green text-white rounded-lg shadow-[0_4px_12px_rgba(0,255,127,0.2)] hover:shadow-[0_6px_16px_rgba(0,255,127,0.3)] transition-all"
            >
              View Full Details
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
