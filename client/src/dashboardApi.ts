import axios from 'axios'

export type Major = { id: number; code: string; name: string }
export type StudentInput = {
  firstName: string; lastName: string; email: string
  majorId: number; enrollmentYear: number; isActive: boolean
}
export type SavedStudent = StudentInput & {
  id: number; majorName: string; createdAt: string; updatedAt: string
}
export type RequestEntry = { method: string; path: string; status: number | string; time: string }

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, ''),
  timeout: 15000,
})

// This wrapper records actual completed Axios requests for the lab demonstration.
export function dashboardApi(record: (entry: RequestEntry) => void) {
  async function request<T>(method: string, path: string, data?: StudentInput): Promise<T> {
    try {
      const response = await api.request<T>({ method, url: `/api/dashboard${path}`, data })
      record({ method, path: `/api/dashboard${path}`, status: response.status, time: new Date().toISOString() })
      return response.data
    } catch (error) {
      record({ method, path: `/api/dashboard${path}`, status: axios.isAxiosError(error) ? error.response?.status || 'network error' : 'error', time: new Date().toISOString() })
      throw error
    }
  }
  return {
    majors: () => request<{ majors: Major[] }>('GET', '/majors'),
    list: () => request<{ students: SavedStudent[] }>('GET', '/students'),
    get: (id: number) => request<{ student: SavedStudent }>('GET', `/students/${id}`),
    create: (data: StudentInput) => request<{ student: SavedStudent }>('POST', '/students', data),
    update: (id: number, data: StudentInput) => request<{ student: SavedStudent }>('PUT', `/students/${id}`, data),
    remove: (id: number) => request<{ deletedId: number }>('DELETE', `/students/${id}`),
  }
}
export function requestError(error: unknown): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || 'The request could not be confirmed. Retrieve the record before retrying.'
  }
  return 'The request failed.'
}
