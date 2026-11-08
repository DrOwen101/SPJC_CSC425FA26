import axios from 'axios'

// One place sets the API base URL for every request that uses this client.
// Change environments with VITE_API_BASE_URL in client/.env.local instead of
// editing URLs inside components.
export const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL || `${window.location.protocol}//${window.location.hostname}:3000`
).replace(/\/$/, '')

export const api = axios.create({
  baseURL: apiBaseUrl,
  // Give up after 10 seconds so a stuck request shows an error instead of hanging.
  timeout: 10000,
})

// Turns any Axios error into a message that is safe to show in the UI.
export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const serverMessage = (error.response?.data as { error?: unknown } | undefined)?.error
    if (typeof serverMessage === 'string') return serverMessage
    if (error.response) return `The server returned HTTP ${error.response.status}. Nothing was saved.`
    if (error.code === 'ECONNABORTED') return 'The request timed out. Nothing was saved. Please try again.'
    return 'Unable to reach the API. Check that the server is running.'
  }
  return 'Something went wrong. Please try again.'
}
