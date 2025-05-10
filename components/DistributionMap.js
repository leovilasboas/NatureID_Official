import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

// Importar MapComponents de forma dinâmica (apenas no cliente)
const MapComponents = dynamic(
  () => import('./MapComponents'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-64 bg-black flex items-center justify-center">
        <p className="text-spring-green text-sm">Map loading...</p>
      </div>
    )
  }
);

export default function DistributionMap({ geographicData, centerOnObservation = false, initialLocation = null }) {
  const mapRef = useRef(null);
  
  // Client-side check for window
  const isBrowser = typeof window !== 'undefined';
  
  // Default center position
  const defaultPosition = [20, 0];
  const defaultZoom = 1;
  
  // Debug output de dados geográficos
  useEffect(() => {
    if (geographicData) {
      console.log("DistributionMap recebeu dados:", geographicData);
    } else {
      console.log("DistributionMap sem dados geográficos");
    }
  }, [geographicData]);
  
  // Exit early if we don't have geographic data - retornar um mapa vazio
  if (!geographicData) {
    return (
      <div className="w-full h-96 relative overflow-hidden rounded-lg border border-spring-green/20">
        <div className="absolute top-2 left-2 bg-black/80 px-3 py-1 rounded-full z-10">
          <p className="text-spring-green text-xs font-medium">Distribution Map</p>
        </div>
        
        {/* Mostrar mensagem de dados não disponíveis sem carregar o mapa */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-white/70 text-center px-4 py-2 rounded-lg">
            Detailed distribution data not available
          </div>
        </div>
      </div>
    );
  }
  
  // Extract data
  const densities = geographicData?.density || {};
  const nativeRegions = geographicData?.nativeRegions || [];
  const introducedRegions = geographicData?.introducedRegions || [];
  
  // Track animation state
  const [animationFrame, setAnimationFrame] = useState(0);
  
  useEffect(() => {
    // Animation loop
    const interval = setInterval(() => {
      setAnimationFrame(prev => (prev + 1) % 60);
    }, 50);
    
    return () => clearInterval(interval);
  }, []);
  
  // Calculate the map center
  const calculateMapCenter = () => {
    // Verificar se temos pontos de observação
    if (geographicData?.observationPoints && geographicData.observationPoints.length > 0) {
      // If centerOnObservation is true, center on the first point (useful for visualizing current location)
      if (centerOnObservation) {
        return [geographicData.observationPoints[0].lat, geographicData.observationPoints[0].lng];
      }
      
      // Calculate the average of coordinates to center the map
      let totalLat = 0;
      let totalLng = 0;
      let count = 0;
      
      geographicData.observationPoints.forEach(point => {
        totalLat += point.lat;
        totalLng += point.lng;
        count++;
      });
      
      if (count > 0) {
        return [totalLat / count, totalLng / count];
      }
    }
    
    // If we don't have observation points, use regions with density
    if (Object.keys(densities).length > 0) {
      // Mapping regions to geographic coordinates (approximate center)
      const regionCoordinates = {
        'North America': [40, -100],
        'South America': [-20, -60],
        'Europe': [50, 10],
        'Africa': [0, 20],
        'Asia': [30, 100],
        'Australia': [-25, 135],
        'Antarctica': [-80, 0]
      };
      
      // Find the region with highest density
      let maxDensityRegion = Object.keys(densities).reduce(
        (a, b) => densities[a] > densities[b] ? a : b, 
        Object.keys(densities)[0]
      );
      
      // Return the coordinates of that region
      return regionCoordinates[maxDensityRegion] || defaultPosition;
    }
    
    // If we don't have any data, use the default center
    return defaultPosition;
  };
  
  // Calcular o centro do mapa
  const mapCenter = calculateMapCenter();
  
  // Set greater height for the map, improving visualization with zoom
  return (
    <div className="w-full h-96 relative overflow-hidden rounded-lg border border-spring-green/20">
      <div className="absolute top-2 left-2 bg-black/80 px-3 py-1 rounded-full z-10">
        <p className="text-spring-green text-xs font-medium">📍 Geographic Distribution</p>
      </div>
      
      {/* Instrução para zoom */}
      <div className="absolute top-2 right-2 bg-black/80 px-3 py-1 rounded-full z-10">
        <p className="text-spring-green text-xs font-medium">
          🔍 Zoom in/out
        </p>
      </div>
      
      {/* Habitat label - apenas se não for Unknown */}
      {geographicData.mainHabitat && geographicData.mainHabitat !== "Unknown" && (
        <div className="absolute bottom-2 right-2 bg-black/80 px-3 py-1 rounded-full z-10">
          <p className="text-spring-green text-xs font-medium">
            🌿 {geographicData.mainHabitat} habitat
          </p>
        </div>
      )}
      
      {/* Usar o componente dinâmico para o mapa */}
      <MapComponents 
        mapCenter={mapCenter}
        centerOnObservation={centerOnObservation}
        geographicData={geographicData}
        densities={densities}
        nativeRegions={nativeRegions}
        introducedRegions={introducedRegions}
        defaultPosition={defaultPosition}
        initialLocation={initialLocation}
      />
    </div>
  );
}