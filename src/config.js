const API_URL = import.meta.env.PROD 
  ? 'https://voice-challan-api.onrender.com'
  : 'http://localhost:10000';

export { API_URL }; 