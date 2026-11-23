import axios from 'axios'
export type Faculty ={
    id: number
    employee_number : string
    first_name: string
    last_name: string
    email: string
    is_active: boolean
}

const origin = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const api = axios.create({
  baseURL: `${origin}/api/dashboard`,
  timeout: 15000,
})

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isFaculty(value: unknown): value is Faculty {
  return isObject(value)
    && typeof value.id === 'number'
    && typeof value.employee_number === 'string'
    && typeof value.first_name === 'string'
    && typeof value.last_name === 'string'
    && typeof value.email === 'string'
    && typeof value.is_active === 'boolean'
}

function readFaculty(data: unknown): Faculty {
  if (!isObject(data) || !isFaculty(data.faculty)) {
    throw new Error('The API returned an unexpected faculty record.')
  }
  return data.faculty
}

export async function listFaculty(signal?: AbortSignal): Promise<Faculty[]> {
  const response = await api.get<unknown>('/faculty', { signal })
  const data = response.data

  if (!isObject(data) || !Array.isArray(data.faculty) || !data.faculty.every(isFaculty)) {
    throw new Error('The API returned an unexpected faculty list.')
  }
  return data.faculty
}

export async function getFaculty(id: number, signal?: AbortSignal): Promise<Faculty> {
  const response = await api.get<unknown>(`/faculty/${id}`, { signal })
  return readFaculty(response.data)
}

export function facultyError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (isObject(data) && typeof data.message === 'string') {
      return data.message
    }
    if (error.code === 'ECONNABORTED') {
      return 'The request timed out. Retrieve the record before retrying a change.'
    }
    return 'Unable to reach faculty records. Check that the backend is running.'
  }

  if (error instanceof Error) {
    return error.message
  }
  return 'Unable to complete the faculty request.'
}