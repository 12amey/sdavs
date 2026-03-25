// src/services/api.ts
import axios from "axios";
import { nasaEONETAPI } from "./nasaEONETAPI";

// Base URL for backend
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081/api";

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(`API ${error.response.status}:`, error.response.data?.message || error.message);
    }
    return Promise.reject(error);
  }
);

export { apiClient };

// ----------------------------
// Satellite Analysis API
// ----------------------------
export const satelliteApi = {
  analyzeArea: async (params: {
    startLatitude: number;
    startLongitude: number;
    endLatitude: number;
    endLongitude: number;
    regionName?: string;
    analysisType?: string;
  }, userId?: number) => {
    const response = await apiClient.post("/satellite/analyze", params, {
      params: userId ? { userId } : undefined
    });

    // Enhance with NASA EONET events
    try {
      const realEvents = await nasaEONETAPI.fetchEventsByBounds(
        params.startLatitude,
        params.endLatitude,
        params.startLongitude,
        params.endLongitude
      );

      if (realEvents.length > 0) {
        response.data.alerts = [
          ...(response.data.alerts || []),
          ...realEvents.map(event => `NASA: ${event.title}`)
        ];
        response.data.realEvents = realEvents.map(event => ({
          id: event.id,
          title: event.title,
          categories: event.categories.map(cat => cat.title),
          coordinates: event.geometry[0]?.coordinates
        }));
      }
    } catch {
      // NASA enhancement is optional
    }

    return response.data;
  },

  healthCheck: async () => {
    const response = await apiClient.get("/satellite/health");
    return {
      status: "OK",
      message: response.data,
      backend: "Java Spring Boot",
      timestamp: new Date().toISOString()
    };
  },

  getSatelliteData: async (minLat: number, maxLat: number, minLon: number, maxLon: number) => {
    const response = await apiClient.get("/satellite/data", {
      params: { minLat, maxLat, minLon, maxLon }
    });
    return response.data;
  },

  getSentinel2Data: async (minLat: number, maxLat: number, minLon: number, maxLon: number) => {
    try {
      const response = await apiClient.get("/satellite/sentinel-2", {
        params: { minLat, maxLat, minLon, maxLon }
      });
      return response.data;
    } catch {
      return null;
    }
  },

  getAnalysisHistory: async (userId: number) => {
    const response = await apiClient.get(`/satellite/history/${userId}`);
    return response.data;
  },

  analyze: async (params: {
    region: string;
    startDate: string;
    endDate: string;
  }) => {
    const response = await apiClient.post("/satellite/analyze", params);
    return response.data;
  },

  predictNDVI: async (lat: number, lng: number, months: number = 12) => {
    const response = await apiClient.post("/ml/predict/ndvi", { lat, lon: lng, months });
    return response.data;
  },

  predictDeforestation: async (minLat: number, maxLat: number, minLon: number, maxLon: number) => {
    const response = await apiClient.post("/ml/predict/deforestation", {
      minLat, maxLat, minLon, maxLon
    });
    return response.data;
  },

  predictClimate: async (lat: number, lng: number, years: number = 10) => {
    const response = await apiClient.post("/ml/predict/climate", { lat, lon: lng, years });
    return response.data;
  }
};

// ----------------------------
// Image Processing API
// ----------------------------
export const imageProcessingApi = {
  processImage: async (imageFile: File) => {
    const formData = new FormData();
    formData.append("image", imageFile);

    const response = await axios.post(`${API_BASE}/image/process`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000,
    });

    return response.data;
  },

  applyFilter: async (imageFile: File, filterType: string) => {
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("filterType", filterType);

    const response = await axios.post(`${API_BASE}/image/filter`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      responseType: "blob",
      timeout: 60000,
    });

    return response.data;
  },

  resizeImage: async (imageFile: File, width: number, height: number) => {
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("width", width.toString());
    formData.append("height", height.toString());

    const response = await axios.post(`${API_BASE}/image/resize`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      responseType: "blob",
      timeout: 60000,
    });

    return response.data;
  },

  healthCheck: async () => {
    const response = await apiClient.get("/image/health");
    return response.data;
  }
};

// ----------------------------
// Legacy ML Prediction APIs
// ----------------------------
export const predictNDVI = async (coords: { lat: number; lon: number }) => {
  return satelliteApi.predictNDVI(coords.lat, coords.lon);
};

export const predictDeforestation = async (coords: { lat: number; lon: number }) => {
  return satelliteApi.predictDeforestation(
    coords.lat - 0.1, coords.lat + 0.1,
    coords.lon - 0.1, coords.lon + 0.1
  );
};

// ----------------------------
// User Session APIs
// ----------------------------
export const loginUser = async (credentials: {
  username: string;
  password: string;
}) => {
  const response = await apiClient.post("/user/login", credentials);
  return response.data;
};

export const logoutUser = async () => {
  const response = await apiClient.post("/user/logout");
  return response.data;
};

export const fetchHistory = async (userId: string) => {
  const response = await apiClient.get(`/user/${userId}/history`);
  return response.data;
};