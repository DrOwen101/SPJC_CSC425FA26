// Local requests go through Vite's /api proxy, using the frontend's actual port.
// A separately hosted API can override this with its public base URL.
export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
