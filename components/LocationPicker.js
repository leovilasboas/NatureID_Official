import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Importando componentes do Leaflet apenas no cliente
const LeafletComponents = dynamic(() => import('./LeafletComponents'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-black/40 rounded-lg flex items-center justify-center">
      <p className="text-spring-green">Carregando mapa...</p>
    </div>
  )
});

// Este fix é necessário porque o Leaflet espera que as imagens estejam no contexto global
// Não precisamos mais dessas funções aqui, elas foram movidas para o LeafletComponents

export default function LocationPicker({ onLocationSelect, initialLocation = null }) {
  const [position, setPosition] = useState(initialLocation);
  const [locationName, setLocationName] = useState('');
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Default center if no position is set
  const defaultCenter = { lat: 0, lng: 0 };

  // Update parent component when position changes
  useEffect(() => {
    if (position) {
      fetchLocationName(position.lat, position.lng)
        .then(name => {
          setLocationName(name);
          onLocationSelect({ 
            coords: position, 
            name: name,
            source: isUsingCurrentLocation ? 'gps' : 'manual'
          });
        });
    }
  }, [position, isUsingCurrentLocation, onLocationSelect]);

  // Get current location from browser
  const getCurrentLocation = () => {
    setLoading(true);
    setError(null);
    
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setPosition({ lat: latitude, lng: longitude });
        setIsUsingCurrentLocation(true);
        setLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setError('Unable to retrieve your location. Please allow location access or enter a location manually.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  // Fetch location name from coordinates using reverse geocoding
  const fetchLocationName = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      
      if (data && data.display_name) {
        return data.display_name;
      } else {
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
    } catch (error) {
      console.error('Error fetching location name:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  // Search for locations by name
  const searchLocation = async () => {
    if (!manualInput.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualInput)}`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        setSearchResults(data);
      } else {
        setError('No locations found. Please try a different search term.');
        setSearchResults([]);
      }
    } catch (error) {
      setError('Error searching for location. Please try again.');
      console.error('Error searching for location:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle location selection from search results
  const handleLocationSelect = (result) => {
    setPosition({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) });
    setIsUsingCurrentLocation(false);
    setSearchResults([]);
    setManualInput('');
  };

  return (
    <div className="bg-black/40 backdrop-blur-md rounded-lg p-4 mb-6 w-full">
      <h3 className="text-white font-medium mb-4">Add Location</h3>
      
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <button
          className="flex-1 bg-spring-green/20 hover:bg-spring-green/30 text-white rounded-md py-2 px-4 flex items-center justify-center transition-colors"
          onClick={getCurrentLocation}
          disabled={loading}
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
          Use Current Location
        </button>
        
        <div className="flex-1 flex">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Search location..."
            className="flex-grow px-4 py-2 bg-black/40 border border-white/20 rounded-l-md text-white outline-none focus:border-spring-green/50"
            onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
          />
          <button
            onClick={searchLocation}
            className="bg-spring-green/20 hover:bg-spring-green/30 border border-white/20 border-l-0 rounded-r-md px-3 text-white"
            disabled={loading}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="mb-4 max-h-48 overflow-y-auto bg-black/60 border border-white/10 rounded-md">
          <ul className="divide-y divide-white/10">
            {searchResults.map((result) => (
              <li 
                key={result.place_id} 
                className="p-2 hover:bg-spring-green/10 cursor-pointer text-white text-sm"
                onClick={() => handleLocationSelect(result)}
              >
                {result.display_name}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-600/20 border border-red-600/30 rounded-md text-white text-sm">
          {error}
        </div>
      )}
      
      {/* Map */}
      <div className="h-64 rounded-lg overflow-hidden mb-2">
        <LeafletComponents 
          position={position} 
          setPosition={setPosition} 
          defaultCenter={defaultCenter}
        />
      </div>
      
      {/* Selected Location Display */}
      {position && locationName && (
        <div className="p-3 bg-spring-green/10 border border-spring-green/30 rounded-md text-white text-sm">
          <div className="font-medium mb-1">Selected Location:</div>
          <div>{locationName}</div>
          <div className="text-xs text-white/70 mt-1">
            Coordinates: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
          </div>
        </div>
      )}
      
      <div className="text-xs text-white/60 mt-2">
        Tip: Click on the map to select an exact location or use the buttons above to search or use your current location.
      </div>
    </div>
  );
}