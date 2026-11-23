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

// Lab 12: the sign-in token for faculty-only routes. It is kept in
// sessionStorage so a page refresh stays signed in, and it is cleared when the
// browser tab closes. Every request through `api` sends it automatically.
const TOKEN_KEY = 'csc425-auth-token'

export function getAuthToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setAuthToken(token: string | null) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token)
    else sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    // Storage can be blocked (private windows). Sign-in then lasts until refresh.
  }
  memoryToken = token
}

let memoryToken = getAuthToken()

api.interceptors.request.use((config) => {
  if (memoryToken) config.headers.Authorization = `Bearer ${memoryToken}`
  return config
})

// Turns any Axios error into a message that is safe to show in the UI.
export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const serverMessage = (error.response?.data as { error?: unknown } | undefined)?.error
    if (typeof serverMessage === 'string') return serverMessage
    if (error.response) return `The server returned HTTP ${error.response.status}. Nothing was saved.`
    // No response means the outcome is unknown: a save may have reached the
    // database before the connection failed. Say so instead of "nothing saved."
    if (error.code === 'ECONNABORTED') {
      return 'The request timed out, so it is not known whether the change was saved. Reload the record to check before trying again.'
    }
    return 'Unable to reach the API, so it is not known whether the change was saved. Check that the server is running, then reload the record to check.'
  }
  return 'Something went wrong. Please try again.'
}
