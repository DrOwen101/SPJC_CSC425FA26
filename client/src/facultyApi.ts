import axios from 'axios'

export type FacultyProfile = { id: number; firstName: string; lastName: string; email: string }
export type Section = {
    id: number; courseCode: string; courseTitle: string; term: string
    sectionNumber: string; creditHours: number; enrolledCount: number
}
export type Grade = 'A' | 'B' | 'C' | 'D' | 'F'
export const GRADES: Grade[] = ['A', 'B', 'C', 'D', 'F']
export type RosterRow = {
    enrollmentId: number; studentId: number; firstName: string; lastName: string
    email: string; majorName: string; finalGrade: Grade | null; absences: number
}
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'
export const STATUSES: AttendanceStatus[] = ['present', 'absent', 'late', 'excused']
export type AttendanceRow = {
    enrollmentId: number; studentId: number; firstName: string; lastName: string
    status: AttendanceStatus | null; absences: number
}

const origin = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const api = axios.create({ baseURL: `${origin}/api/faculty`, timeout: 15000 })

let token = ''
api.interceptors.request.use((config) => {
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

function list<T>(data: unknown, key: string): T[] {
    const value = (data as Record<string, unknown> | null)?.[key]
    if (!Array.isArray(value)) throw new Error(`The API returned an unexpected ${key} list.`)
    return value as T[]
}

export async function facultyLogin(email: string, passcode: string): Promise<FacultyProfile> {
    const response = await api.post<{ token: string; faculty: FacultyProfile }>('/login', { email, passcode })
    token = response.data.token
    return response.data.faculty
}

export async function facultyLogout(): Promise<void> {
    try {
        await api.post('/logout')
    } catch {
    } finally {
        token = ''
    }
}

export async function listSections(): Promise<Section[]> {
    const response = await api.get<unknown>('/sections')
    return list<Section>(response.data, 'sections')
}

export async function getRoster(sectionId: number): Promise<RosterRow[]> {
    const response = await api.get<unknown>(`/sections/${sectionId}/roster`)
    return list<RosterRow>(response.data, 'roster')
}

export async function saveGrade(enrollmentId: number, finalGrade: Grade | null): Promise<void> {
    await api.put(`/enrollments/${enrollmentId}/grade`, { finalGrade })
}

export async function getAttendance(sectionId: number, date: string): Promise<AttendanceRow[]> {
    const response = await api.get<unknown>(`/sections/${sectionId}/attendance`, { params: { date } })
    return list<AttendanceRow>(response.data, 'attendance')
}

export async function saveAttendance(
    sectionId: number,
    date: string,
    records: { enrollmentId: number; status: AttendanceStatus }[],
): Promise<void> {
    await api.put(`/sections/${sectionId}/attendance`, { date, records })
}

export function facultyError(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const data: unknown = error.response?.data
        if (typeof data === 'object' && data !== null && typeof (data as { message?: unknown }).message === 'string') {
            return (data as { message: string }).message
        }
        if (error.code === 'ECONNABORTED') return 'The request timed out. Try again.'
        return 'Unable to reach the faculty service. Check that the backend is running.'
    }
    return error instanceof Error ? error.message : 'Unable to complete the faculty request.'
}