import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

export default function SpeciesMap({ species, isPremium = false }) {
  const mapRef = useRef(null);
  const leafletRef = useRef(null);

  useEffect(() => {
    // Only load leaflet on the client side
    if (typeof window !== 'undefined' && !leafletRef.current) {
      const L = require('leaflet');
      leafletRef.current = L;
      
      // Fix for the marker icon in Leaflet
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/images/marker-icon-2x.png',
        iconUrl: '/images/marker-icon.png',
        shadowUrl: '/images/marker-shadow.png',
      });
      
      // Initialize the map
      if (mapRef.current && !mapRef.current._leaflet_id) {
        const map = L.map(mapRef.current, {
          center: [20, 0], // Default to world center
          zoom: 2,
          zoomControl: false,
          attributionControl: false,
          dragging: isPremium, // Only allow interaction in premium mode
          touchZoom: isPremium,
          doubleClickZoom: isPremium,
          scrollWheelZoom: isPremium,
          boxZoom: isPremium,
          tap: isPremium,
        });
        
        // Add a blurred overlay for non-premium
        if (!isPremium) {
          // Create a semi-transparent overlay
          const overlayDiv = document.createElement('div');
          overlayDiv.style.position = 'absolute';
          overlayDiv.style.top = '0';
          overlayDiv.style.left = '0';
          overlayDiv.style.right = '0';
          overlayDiv.style.bottom = '0';
          overlayDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
          overlayDiv.style.zIndex = '1000';
          overlayDiv.style.display = 'flex';
          overlayDiv.style.alignItems = 'center';
          overlayDiv.style.justifyContent = 'center';
          
          const premiumMessage = document.createElement('div');
          premiumMessage.innerHTML = `
            <div style="text-align: center; color: #00FF7F; padding: 10px; border-radius: 5px;">
              <div style="font-size: 24px; margin-bottom: 8px;">🔒</div>
              <p style="margin: 0; font-weight: bold;">Premium Feature</p>
              <p style="margin: 5px 0 0; font-size: 12px;">Upgrade to see detailed distribution maps</p>
            </div>
          `;
          
          overlayDiv.appendChild(premiumMessage);
          mapRef.current.appendChild(overlayDiv);
        }
        
        // Add a stylized dark mode tile layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19
        }).addTo(map);
        
        // Add a simulated range area for the species
        // In a real app, this would use actual geographic data for the species
        const getSimulatedRange = () => {
          // For demo purposes, create a random polygon
          const center = [Math.random() * 60 - 30, Math.random() * 120 - 60];
          const points = [];
          const numPoints = 5 + Math.floor(Math.random() * 5);
          const radius = 5 + Math.random() * 15;
          
          for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const x = center[0] + Math.cos(angle) * radius * (0.8 + Math.random() * 0.4);
            const y = center[1] + Math.sin(angle) * radius * (0.8 + Math.random() * 0.4);
            points.push([x, y]);
          }
          points.push(points[0]); // Close the polygon
          return points;
        };
        
        // Add the range polygon
        L.polygon(getSimulatedRange(), {
          color: '#00FF7F',
          fillColor: '#00FF7F',
          fillOpacity: 0.2,
          weight: 2
        }).addTo(map);
      }
    }
    
    // Cleanup function
    return () => {
      if (mapRef.current && mapRef.current._leaflet_id && leafletRef.current) {
        leafletRef.current.remove();
      }
    };
  }, [isPremium]);

  return (
    <div className="w-full h-64 rounded-xl overflow-hidden border border-white/10">
      <div ref={mapRef} className="w-full h-full bg-black/40"></div>
    </div>
  );
}