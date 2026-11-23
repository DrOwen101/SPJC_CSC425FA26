import axios from 'axios'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
  || `${window.location.protocol}//${window.location.hostname}:3000`

export const facultyApi = axios.create({
  baseURL: apiBaseUrl.replace(/\/$/, ''),
  withCredentials: true,
})
