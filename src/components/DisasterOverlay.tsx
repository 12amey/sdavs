import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import L from 'leaflet';

interface Disaster {
  id: number;
  eonetId: string;
  title: string;
  category: string;
  latitude: number;
  longitude: number;
  eventDate: string;
  severity?: string;
  description?: string;
}

interface DisasterOverlayProps {
  map: L.Map | null;
}

const DISASTER_ICONS: Record<string, string> = {
  'Wildfires': '🔥',
  'Severe Storms': '⛈️',
  'Volcanoes': '🌋',
  'Floods': '🌊',
  'Drought': '🏜️',
  'Earthquakes': '⚠️',
  'Sea and Lake Ice': '🧊',
  'Snow': '❄️',
  'Dust and Haze': '💨',
  'default': '⚠️'
};

const DISASTER_COLORS: Record<string, string> = {
  'Wildfires': '#FF4500',
  'Severe Storms': '#4169E1',
  'Volcanoes': '#DC143C',
  'Floods': '#1E90FF',
  'Drought': '#DEB887',
  'Earthquakes': '#8B0000',
  'default': '#FF6B6B'
};

export function DisasterOverlay({ map }: DisasterOverlayProps) {
  const { data: disasters } = useQuery<Disaster[]>({
    queryKey: ['disasters'],
    queryFn: async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') : 'http://localhost:8081';
        const response = await fetch(`${baseUrl}/api/disasters`);
        if (!response.ok) {
          console.error('Failed to fetch disasters:', response.statusText);
          return []; // Return empty array on error
        }
        const data = await response.json();
        return Array.isArray(data) ? data : []; // Ensure we always return an array
      } catch (error) {
        console.error('Error fetching disasters:', error);
        return []; // Return empty array on error
      }
    },
    refetchInterval: 300000, // Refresh every 5 minutes
    staleTime: 240000, // Consider fresh for 4 minutes
    retry: 2, // Retry failed requests
    retryDelay: 1000 // Wait 1 second before retrying
  });

  useEffect(() => {
    if (!map || !disasters || disasters.length === 0) return;

    const markers: L.Marker[] = [];

    disasters.forEach((disaster) => {
      // Create custom icon
      const emoji = DISASTER_ICONS[disaster.category] || DISASTER_ICONS.default;
      const color = DISASTER_COLORS[disaster.category] || DISASTER_COLORS.default;

      const icon = L.divIcon({
        className: 'disaster-marker',
        html: `
          <div style="
            background: ${color};
            border: 3px solid white;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-center;
            font-size: 24px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            cursor: pointer;
          ">
            ${emoji}
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      // Create marker
      const marker = L.marker([disaster.latitude, disaster.longitude], { icon })
        .addTo(map);

      // Create popup
      const eventDate = new Date(disaster.eventDate);
      const daysAgo = Math.floor((Date.now() - eventDate.getTime()) / (1000 * 60 * 60 * 24));

      marker.bindPopup(`
        <div style="min-width: 250px; font-family: system-ui;">
          <h3 style="margin: 0 0 10px 0; color: ${color}; font-size: 16px; font-weight: bold;">
            ${emoji} ${disaster.title}
          </h3>
          <div style="font-size: 13px; line-height: 1.6;">
            <p style="margin: 5px 0;"><strong>Type:</strong> ${disaster.category}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${eventDate.toLocaleDateString()} (${daysAgo} days ago)</p>
            ${disaster.severity ? `<p style="margin: 5px 0;"><strong>Severity:</strong> ${disaster.severity}</p>` : ''}
            ${disaster.description ? `<p style="margin: 5px 0; color: #666;">${disaster.description}</p>` : ''}
          </div>
          <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 11px; color: #999;">
            Source: NASA EONET
          </div>
        </div>
      `, {
        maxWidth: 300,
        className: 'disaster-popup'
      });

      markers.push(marker);
    });

    // Cleanup function
    return () => {
      markers.forEach(marker => marker.remove());
    };
  }, [map, disasters]);

  return null; // This is just a functional component, no UI render
}
