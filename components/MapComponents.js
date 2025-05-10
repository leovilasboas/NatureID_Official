import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

export default function MapComponents({ 
  mapCenter, 
  centerOnObservation = false,
  geographicData, 
  densities, 
  nativeRegions, 
  introducedRegions,
  defaultPosition,
  initialLocation = null
}) {
  // Fix para os ícones do Leaflet  
  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl;
    
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
  }, []);

  // Mapeamento de regiões para coordenadas geográficas (centro aproximado)
  const regionCoordinates = {
    'North America': [40, -100],
    'South America': [-20, -60],
    'Europe': [50, 10],
    'Africa': [0, 20],
    'Asia': [30, 100],
    'Australia': [-25, 135],
    'Antarctica': [-80, 0]
  };

  // Determine zoom level based on current location or if we're centering on a specific point
  const initialZoom = initialLocation ? 7 : (centerOnObservation ? 12 : 2);
  
  return (
    <MapContainer 
      center={initialLocation ? [initialLocation.lat, initialLocation.lng] : mapCenter} 
      zoom={initialZoom} 
      style={{ height: '100%', width: '100%', zIndex: 1 }}
      attributionControl={false}
      zoomControl={false}
      dragging={true}
      touchZoom={true}
      scrollWheelZoom={true}
      doubleClickZoom={true}
    >
      {/* Adicionar controle de zoom em posição personalizada */}
      <ZoomControl position="bottomright" />
      
      {/* Use mapa escuro para combinar com o tema da aplicação */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      
      {/* Pontos de observação reais do iNaturalist */}
      {geographicData?.observationPoints && geographicData.observationPoints.map((point, index) => (
        <Circle
          key={`point-${point.id || index}`}
          center={[point.lat, point.lng]}
          radius={10000} // 10km
          pathOptions={{
            fillColor: '#1DB954',
            fillOpacity: 0.7,
            color: '#00ff7f',
            weight: 1
          }}
        >
          <Popup>
            <div className="text-sm">
              <span className="font-bold">📌 Observation</span>
              <br />
              <span>{point.place || 'Location data unavailable'}</span>
              {point.observed_on && (
                <>
                  <br />
                  <span>📅 {new Date(point.observed_on).toLocaleDateString()}</span>
                </>
              )}
            </div>
          </Popup>
        </Circle>
      ))}
      
      {/* Círculos de densidade para cada região */}
      {Object.entries(densities).map(([region, density]) => {
        if (density <= 0) return null;
        const coords = regionCoordinates[region];
        if (!coords) return null;
        
        // Calcular raio proporcional à densidade (em km)
        // Ajustes para tornar os círculos mais estéticos
        const radius = Math.max(500000, density * 1500000); // Mínimo de 500km, máximo de 1500km
        
        return (
          <Circle
            key={region}
            center={coords}
            radius={radius}
            pathOptions={{
              fillColor: '#1DB954',
              fillOpacity: 0.2 + (density * 0.3),
              color: '#1DB954',
              weight: 1
            }}
          >
            <Popup>
              <div className="text-sm">
                <span className="font-bold">🌎 {region}</span>
                <br />
                <span>Population: {Math.round(density * 100)}% of species</span>
              </div>
            </Popup>
          </Circle>
        );
      })}
      
      {/* Current Location Marker */}
      {initialLocation && (
        <Circle
          center={[initialLocation.lat, initialLocation.lng]}
          radius={10000} // 10km
          pathOptions={{
            fillColor: '#FF4757',
            fillOpacity: 0.6,
            color: '#FF0000',
            weight: 2
          }}
        >
          <Popup>
            <div className="text-sm">
              <span className="font-bold">📍 Current Location</span>
              <br />
              <span>{initialLocation.lat.toFixed(4)}, {initialLocation.lng.toFixed(4)}</span>
            </div>
          </Popup>
        </Circle>
      )}
      
      {/* Marcadores para regiões nativas */}
      {nativeRegions.map((region, index) => {
        const coords = regionCoordinates[region];
        if (!coords) return null;
        
        return (
          <Circle
            key={`native-${region}`}
            center={coords}
            radius={500000} // 500km
            pathOptions={{
              fillColor: '#00ff7f',
              fillOpacity: 0.4,
              color: '#00ff7f',
              weight: 2
            }}
          >
            <Popup>
              <div className="text-sm">
                <span className="font-bold">🌱 {region}</span>
                <br />
                <span className="text-green-500">Native Habitat</span>
              </div>
            </Popup>
          </Circle>
        );
      })}
      
      {/* Marcadores para regiões introduzidas */}
      {introducedRegions.map((region, index) => {
        const coords = regionCoordinates[region];
        if (!coords) return null;
        
        return (
          <Circle
            key={`introduced-${region}`}
            center={coords}
            radius={300000} // 300km
            pathOptions={{
              fillColor: '#ffff00',
              fillOpacity: 0.3,
              color: '#ffff00',
              weight: 1
            }}
          >
            <Popup>
              <div className="text-sm">
                <span className="font-bold">🌍 {region}</span>
                <br />
                <span className="text-yellow-500">Introduced Species</span>
              </div>
            </Popup>
          </Circle>
        );
      })}
    </MapContainer>
  );
}