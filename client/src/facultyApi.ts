import { api, setAuthToken } from './apiClient'

// Lab 12: sign-in and faculty-only requests. The shared Axios client adds the
// sign-in token to every request, and the server checks it on every route.

export type SignedInUser = { id: number; role: 'student' | 'faculty'; name: string }

export type Section = {
  id: number
  courseCode: string
  title: string
  sectionNumber: string
  termCode: string
  studentCount: number
  gradedCount: number
}

export type RosterEntry = {
  enrollmentId: number
  studentId: number
  firstName: string
  lastName: string
  email: string
  majorName: string
  finalGrade: string | null
  gradePostedAt: string | null
}

export type RosterMatch = {
  studentId: number
  firstName: string
  lastName: string
  email: string
  majorName: string
  sections: string[]
}

export const sectionLabel = (section: Section) =>
  `${section.courseCode}-${section.sectionNumber} ${section.title} (${section.termCode})`

// POST /api/auth/login → 200 { token, user }
export async function signIn(email: string, password: string) {
  const response = await api.post<{ token: string; user: SignedInUser }>('/api/auth/login', { email, password })
  setAuthToken(response.data.token)
  return response.data.user
}

// GET /api/auth/me → 200 { user } or 401
export async function currentUser() {
  const response = await api.get<{ user: SignedInUser }>('/api/auth/me')
  return response.data.user
}

// POST /api/auth/logout → 204. The token is forgotten even if the request fails.
export async function signOut() {
  try {
    await api.post('/api/auth/logout')
  } finally {
    setAuthToken(null)
  }
}

// GET /api/faculty/sections → 200 { sections }
export async function listMySections() {
  const response = await api.get<{ sections: Section[] }>('/api/faculty/sections')
  return response.data.sections
}

// GET /api/faculty/sections/:sectionId/roster → 200 { roster } or 404
export async function getRoster(sectionId: number) {
  const response = await api.get<{ roster: RosterEntry[] }>(`/api/faculty/sections/${sectionId}/roster`)
  return response.data.roster
}

// PUT /api/faculty/sections/:sectionId/enrollments/:enrollmentId/grade → 200 { enrollment } or 404
// Sending the same grade twice gives the same result, so retrying after an
// unknown outcome is safe.
export async function postFinalGrade(sectionId: number, enrollmentId: number, finalGrade: string | null) {
  const response = await api.put<{ enrollment: Pick<RosterEntry, 'enrollmentId' | 'finalGrade' | 'gradePostedAt'> }>(
    `/api/faculty/sections/${sectionId}/enrollments/${enrollmentId}/grade`,
    { finalGrade },
  )
  return response.data.enrollment
}

// GET /api/faculty/students/search?q= → 200 { students } from your sections only
export async function searchMyStudents(query: string, signal?: AbortSignal) {
  const response = await api.get<{ students: RosterMatch[] }>('/api/faculty/students/search', { params: { q: query }, signal })
  return response.data.students
}
