import axios from 'axios'

export const dashboardClient = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL
    || `${window.location.protocol}//${window.location.hostname}:3000`).replace(/\/$/, ''),
  timeout: 12000,
})

export type Session = { token: string; user: { role: 'faculty' | 'student' | 'admin'; displayName: string } }
export type Section = {
  id: string; title: string; meetingDays: string; startsAt: string; endsAt: string
  location: string; studentCount: number
}
export type RosterStudent = { id: number; fullName: string; major: string; sections: string[] }
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'
export type AttendanceRow = { studentId: number; fullName: string; status: AttendanceStatus | null }
export type Grade = {
  studentId: number; fullName: string; gradedItems: number
  earned: number | null; possible: number | null; percentage: number | null
}

export function dashboardError(error: unknown, service = 'admin') {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message
      || `The ${service} service did not respond. Check that the API is running and try again.`
  }
  return 'The action could not be completed. Please try again.'
}

export function facultyError(error: unknown) {
  return dashboardError(error, 'faculty')
}

export async function signIn(username: string, password: string) {
  return (await dashboardClient.post<Session>('/api/faculty/session', { username, password })).data
}

export function createDashboardRequest(token: string, onExpired: () => void, prefix: string) {
  async function request<T>(method: string, url: string, options: {
    signal?: AbortSignal; params?: Record<string, string>; data?: unknown
  } = {}) {
    try {
      return (await dashboardClient.request<T>({
        method, url: `${prefix}${url}`, headers: { Authorization: `Bearer ${token}` }, ...options,
      })).data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) onExpired()
      throw error
    }
  }

  return request
}

export function createFacultyApi(token: string, onExpired: () => void) {
  const request = createDashboardRequest(token, onExpired, '/api/faculty')
  return {
    signOut: () => request<void>('DELETE', '/session'),
    sections: (signal?: AbortSignal) => request<{ sections: Section[] }>('GET', '/sections', { signal }),
    search: (q: string, signal: AbortSignal) => request<{ students: RosterStudent[] }>('GET', '/students', { signal, params: { q } }),
    grades: (id: string, signal?: AbortSignal) =>
      request<{ grades: Grade[] }>('GET', `/sections/${encodeURIComponent(id)}/grades`, { signal }),
    attendance: (id: string, date: string, signal?: AbortSignal) =>
      request<{ roster: AttendanceRow[] }>('GET', `/sections/${encodeURIComponent(id)}/attendance`, { signal, params: { date } }),
    saveAttendance: (id: string, date: string, entries: { studentId: number; status: AttendanceStatus }[]) =>
      request<{ saved: number }>('PUT', `/sections/${encodeURIComponent(id)}/attendance`, { data: { date, entries } }),
  }
}

export type FacultyApi = ReturnType<typeof createFacultyApi>
