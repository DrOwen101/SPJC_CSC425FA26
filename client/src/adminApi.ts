import { createDashboardRequest, dashboardClient, type Section, type Session } from './facultyApi'

export const departments = [
  { id: 'CSC', name: 'Computing' }, { id: 'MAT', name: 'Mathematics' }, { id: 'GEN', name: 'General' },
]

export type AdminSection = Section & { department: string; instructor: string }
export type Instructor = { id: number; name: string }
export type SectionInput = {
  id: string; title: string; department: string; instructorId: number
  meetingDays: string; startsAt: string; endsAt: string; location: string
}
export type Concern = { studentId: number; fullName: string; sectionId: string; absences: number; lastAbsence: string }

export async function adminSignIn(username: string, password: string) {
  return (await dashboardClient.post<Session>('/api/admin/session', { username, password })).data
}

export function createAdminApi(token: string, expire: () => void) {
  const request = createDashboardRequest(token, expire, '/api/admin')
  function filter(department: string, signal?: AbortSignal) {
    return { params: department ? { department } : undefined, signal }
  }
  return {
    signOut: () => request<void>('DELETE', '/session'),
    instructors: (signal?: AbortSignal) => request<{ instructors: Instructor[] }>('GET', '/instructors', { signal }),
    sections: (department = '', signal?: AbortSignal) => request<{ sections: AdminSection[] }>('GET', '/sections', filter(department, signal)),
    concerns: (department = '', signal?: AbortSignal) => request<{ concerns: Concern[] }>('GET', '/attendance-concerns', filter(department, signal)),
    createSection: (data: SectionInput) => request<{ section: { id: string } }>('POST', '/sections', { data }),
    assignInstructor: (id: string, instructorId: number) => request<{ section: { id: string; instructor: string } }>(
      'PATCH', `/sections/${encodeURIComponent(id)}/instructor`, { data: { instructorId } },
    ),
  }
}

export type AdminApi = ReturnType<typeof createAdminApi>
