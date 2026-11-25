import axios from 'axios'

// The client for our own API. Same origin: Vite proxies /api in development.
// Sign-in, sign-out, and the session go through auth-client.ts instead.
export const api = axios.create({
  baseURL: '/api',
  responseType: 'json',
  // Reject responses that aren't valid JSON (for example a proxy's HTML error page)
  // instead of returning them as a string.
  transitional: { silentJSONParsing: false },
})
