// NASA EONET (Earth Observatory Natural Event Tracker) API Integration
// Real-time natural events and disasters tracking

export interface EONETEvent {
  id: string;
  title: string;
  description: string;
  link: string;
  categories: Array<{
    id: number;
    title: string;
  }>;
  sources: Array<{
    id: string;
    url: string;
  }>;
  geometry: Array<{
    magnitudeValue?: number;
    magnitudeUnit?: string;
    date: string;
    type: string;
    coordinates: number[];
  }>;
}

export interface EONETCategory {
  id: number;
  title: string;
  link: string;
  description: string;
  layers: string;
}

class NASAEONETService {
  private readonly API_KEY = import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY';
  private readonly BASE_URL = 'https://eonet.gsfc.nasa.gov/api/v3';
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Fetch real-time natural events
  async fetchEvents(
    category?: string,
    status: 'open' | 'closed' | 'all' = 'open',
    limit: number = 100,
    days?: number
  ): Promise<EONETEvent[]> {
    try {
      const cacheKey = `events_${category}_${status}_${limit}_${days}`;
      
      // Check cache first
      if (this.isCacheValid(cacheKey)) {
        console.log('Returning cached EONET events');
        return this.cache.get(cacheKey)!.data;
      }

      let url = `${this.BASE_URL}/events`;
      const params = new URLSearchParams();
      
      if (category) params.append('category', category);
      if (status !== 'all') params.append('status', status);
      if (limit) params.append('limit', limit.toString());
      if (days) params.append('days', days.toString());
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      console.log('Fetching real NASA EONET events from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SatelliteAnalysisSystem/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`EONET API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const events = data.events || [];
      
      // Cache the results
      this.cache.set(cacheKey, {
        data: events,
        timestamp: Date.now()
      });

      console.log(`Fetched ${events.length} real EONET events`);
      return events;
    } catch (error) {
      console.error('Error fetching EONET events:', error);
      throw error;
    }
  }

  // Fetch event categories
  async fetchCategories(): Promise<EONETCategory[]> {
    try {
      const cacheKey = 'categories';
      
      if (this.isCacheValid(cacheKey)) {
        return this.cache.get(cacheKey)!.data;
      }

      const url = `${this.BASE_URL}/categories`;
      
      console.log('Fetching EONET categories from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SatelliteAnalysisSystem/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`EONET API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const categories = data.categories || [];
      
      this.cache.set(cacheKey, {
        data: categories,
        timestamp: Date.now()
      });

      return categories;
    } catch (error) {
      console.error('Error fetching EONET categories:', error);
      throw error;
    }
  }

  // Fetch specific event by ID
  async fetchEventById(eventId: string): Promise<EONETEvent | null> {
    try {
      const cacheKey = `event_${eventId}`;
      
      if (this.isCacheValid(cacheKey)) {
        return this.cache.get(cacheKey)!.data;
      }

      const url = `${this.BASE_URL}/events/${eventId}`;
      
      console.log('Fetching EONET event by ID:', eventId);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SatelliteAnalysisSystem/1.0'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`EONET API error: ${response.status} ${response.statusText}`);
      }

      const event = await response.json();
      
      this.cache.set(cacheKey, {
        data: event,
        timestamp: Date.now()
      });

      return event;
    } catch (error) {
      console.error('Error fetching EONET event by ID:', error);
      throw error;
    }
  }

  // Get events by geographic bounds
  async fetchEventsByBounds(
    minLat: number,
    maxLat: number,
    minLon: number,
    maxLon: number,
    category?: string
  ): Promise<EONETEvent[]> {
    try {
      const allEvents = await this.fetchEvents(category, 'open', 500);
      
      // Filter events by geographic bounds
      const filteredEvents = allEvents.filter(event => {
        return event.geometry.some(geom => {
          if (geom.type === 'Point') {
            const [lon, lat] = geom.coordinates;
            return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
          } else if (geom.type === 'Polygon') {
            // Check if any point of the polygon is within bounds
            return geom.coordinates.some((coord: number[]) => {
              const [lon, lat] = coord;
              return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
            });
          }
          return false;
        });
      });

      console.log(`Found ${filteredEvents.length} events in bounds`);
      return filteredEvents;
    } catch (error) {
      console.error('Error fetching events by bounds:', error);
      throw error;
    }
  }

  // Get recent events (last N days)
  async fetchRecentEvents(days: number = 30, category?: string): Promise<EONETEvent[]> {
    try {
      return await this.fetchEvents(category, 'open', 100, days);
    } catch (error) {
      console.error('Error fetching recent events:', error);
      throw error;
    }
  }

  // Get event statistics
  async getEventStatistics(): Promise<{
    totalEvents: number;
    eventsByCategory: { [key: string]: number };
    recentEvents: number;
    activeEvents: number;
  }> {
    try {
      const [allEvents, categories] = await Promise.all([
        this.fetchEvents(undefined, 'all', 1000),
        this.fetchCategories()
      ]);

      const recentEvents = await this.fetchRecentEvents(7);
      const activeEvents = await this.fetchEvents(undefined, 'open', 1000);

      const eventsByCategory: { [key: string]: number } = {};
      
      categories.forEach(cat => {
        eventsByCategory[cat.title] = 0;
      });

      allEvents.forEach(event => {
        event.categories.forEach(cat => {
          if (eventsByCategory[cat.title] !== undefined) {
            eventsByCategory[cat.title]++;
          }
        });
      });

      return {
        totalEvents: allEvents.length,
        eventsByCategory,
        recentEvents: recentEvents.length,
        activeEvents: activeEvents.length
      };
    } catch (error) {
      console.error('Error getting event statistics:', error);
      throw error;
    }
  }

  // Helper methods
  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    return (Date.now() - cached.timestamp) < this.CACHE_DURATION;
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
    console.log('EONET API cache cleared');
  }

  // Get API status
  async getAPIStatus(): Promise<{
    status: 'online' | 'offline';
    responseTime: number;
    lastCheck: string;
    eventsAvailable: number;
  }> {
    const startTime = Date.now();
    
    try {
      const events = await this.fetchEvents(undefined, 'open', 1);
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'online',
        responseTime,
        lastCheck: new Date().toISOString(),
        eventsAvailable: events.length
      };
    } catch (error) {
      return {
        status: 'offline',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        eventsAvailable: 0
      };
    }
  }

  // Convert EONET event to our satellite data format
  convertToSatelliteData(event: EONETEvent): any {
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      categories: event.categories.map(cat => cat.title),
      coordinates: event.geometry.map(geom => ({
        type: geom.type,
        coordinates: geom.coordinates,
        date: geom.date,
        magnitude: geom.magnitudeValue
      })),
      sources: event.sources,
      link: event.link
    };
  }
}

export const nasaEONETAPI = new NASAEONETService();