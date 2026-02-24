import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE ?? 'http://localhost:5147';

const client = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

export default client;
