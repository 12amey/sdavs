import { apiClient } from './api';

// Deforestation API
export const deforestationApi = {
    detectForCity: (cityName: string) =>
        apiClient.post(`/environment/deforestation/detect/${cityName}`),

    getRisk: (cityName: string) =>
        apiClient.get(`/environment/deforestation/risk/${cityName}`),

    getTrend: (cityName: string) =>
        apiClient.get(`/environment/deforestation/trend/${cityName}`)
};

// Flood/NDWI API
export const floodApi = {
    detectRisk: (cityName: string) =>
        apiClient.post(`/environment/flood/detect/${cityName}`),

    getNdwiTrend: (cityName: string) =>
        apiClient.get(`/environment/flood/ndwi/${cityName}`),

    getActiveAlerts: () =>
        apiClient.get('/environment/flood/alerts')
};

// AQI API
export const aqiApi = {
    fetchForCity: (cityName: string, latitude: number, longitude: number) =>
        apiClient.post(`/environment/aqi/fetch/${cityName}?latitude=${latitude}&longitude=${longitude}`),

    getCurrent: (cityName: string) =>
        apiClient.get(`/environment/aqi/current/${cityName}`),

    getTrend: (cityName: string) =>
        apiClient.get(`/environment/aqi/trend/${cityName}`)
};

// Environmental Risk API
export const riskApi = {
    calculate: (cityName: string) =>
        apiClient.post(`/environment/risk/calculate/${cityName}`),

    getRisk: (cityName: string) =>
        apiClient.get(`/environment/risk/${cityName}`),

    getAllRisks: () =>
        apiClient.get('/environment/risk/all')
};
