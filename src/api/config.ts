export const API_BASE = import.meta.env.VITE_USE_MOCK !== 'false'
  ? ''
  : (import.meta.env.VITE_API_BASE_URL ?? '')
