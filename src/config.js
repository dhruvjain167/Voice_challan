const API_URL = import.meta.env.PROD 
  ? 'https://voice-challan-api.onrender.com'
  : 'http://localhost:5173';

export const config = {
  apiUrl: API_URL,
  endpoints: {
    health: '/api/health',
    generatePdf: '/api/generate-pdf',
    downloadPdf: '/api/download-pdf',
  }
}; 