import axios from 'axios';

const NASA_API_KEY = import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY';

export interface NASAImageData {
  title: string;
  url: string;
  date: string;
  explanation: string;
  hdurl?: string;
  media_type: string;
}

export interface EarthImageryData {
  date: string;
  url: string;
  id: string;
  resource: {
    dataset: string;
    planet: string;
  };
}

export async function fetchAstronomyPictureOfDay(date?: string): Promise<NASAImageData> {
  try {
    const url = date
      ? `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&date=${date}`
      : `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`;

    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching NASA APOD:', error);
    throw error;
  }
}

export async function fetchEarthImagery(
  lat: number,
  lon: number,
  date?: string,
  dim: number = 0.15
): Promise<string> {
  try {
    const dateParam = date || new Date().toISOString().split('T')[0];
    const url = `https://api.nasa.gov/planetary/earth/imagery?lon=${lon}&lat=${lat}&date=${dateParam}&dim=${dim}&api_key=${NASA_API_KEY}`;

    return url;
  } catch (error) {
    console.error('Error fetching Earth imagery:', error);
    throw error;
  }
}

export async function fetchEarthAssets(
  lat: number,
  lon: number,
  begin?: string,
  end?: string
): Promise<EarthImageryData[]> {
  try {
    const beginDate = begin || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = end || new Date().toISOString().split('T')[0];

    const url = `https://api.nasa.gov/planetary/earth/assets?lon=${lon}&lat=${lat}&begin=${beginDate}&end=${endDate}&api_key=${NASA_API_KEY}`;

    const response = await axios.get(url);
    return response.data.results || [];
  } catch (error) {
    console.error('Error fetching Earth assets:', error);
    throw error;
  }
}

export async function fetchMarsRoverPhotos(
  rover: 'curiosity' | 'opportunity' | 'spirit' = 'curiosity',
  sol: number = 1000
): Promise<any[]> {
  try {
    const url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/photos?sol=${sol}&api_key=${NASA_API_KEY}`;

    const response = await axios.get(url);
    return response.data.photos || [];
  } catch (error) {
    console.error('Error fetching Mars rover photos:', error);
    throw error;
  }
}

export async function searchNASAImages(query: string, mediaType: 'image' | 'video' | 'audio' = 'image'): Promise<any[]> {
  try {
    const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=${mediaType}`;

    const response = await axios.get(url);
    return response.data.collection.items || [];
  } catch (error) {
    console.error('Error searching NASA images:', error);
    throw error;
  }
}

export async function fetchNEOData(startDate?: string, endDate?: string): Promise<any> {
  try {
    const start = startDate || new Date().toISOString().split('T')[0];
    const end = endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${start}&end_date=${end}&api_key=${NASA_API_KEY}`;

    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching NEO data:', error);
    throw error;
  }
}
