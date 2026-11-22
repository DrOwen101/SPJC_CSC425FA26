import axios from 'axios'

export type FacultyRoster = {
  enrollment_id: number
  course_code: string
  student_id: number
  first_name: string
  last_name: string
}

export interface FacultyAdvisingNote {
  note_id: number
  student_id: number
  first_name: string
  last_name: string
  note_text: string
}

const api = axios.create({
  baseURL: 'http://localhost:3000/api/faculty',
  timeout: 10000,
  withCredentials: true,

})

export async function getFacultyRosters(): Promise<FacultyRoster[]> {
  const response = await api.get<{ rosters: FacultyRoster[] }>('/rosters')
  return response.data.rosters
}

export type FacultyGrade = {
  enrollment_id: number
  course_code: string
  grade: string | null
  student_id: number
  first_name: string
  last_name: string
}

export async function getFacultyGrades(): Promise<FacultyGrade[]> {
  const response = await api.get<{ grades: FacultyGrade[] }>('/grades')
  return response.data.grades
}

export async function updateFacultyGrade(
  enrollmentId: number,
  grade: string
): Promise<void> {
  await api.patch(`/grades/${enrollmentId}`, {
    grade,
  })
}

export type FacultyCourse = {
  course_code: string
  student_count: number
}

export async function getFacultyCourses(): Promise<FacultyCourse[]> {
  const response = await api.get<{ courses: FacultyCourse[] }>('/courses')
  return response.data.courses
}

export async function loginFaculty(token: string): Promise<void> {
  await api.post('/login', { token })
}

export async function checkFacultySession(): Promise<boolean> {
  try {
    const response = await api.get<{ authenticated: boolean }>('/session')
    return response.data.authenticated
  } catch {
    return false
  }
}

export async function logoutFaculty(): Promise<void> {
  await api.post('/logout')
}


export async function getFacultyAdvisingNotes(): Promise<{
  notes: FacultyAdvisingNote[]
}> {
  const response = await api.get<{
    notes: FacultyAdvisingNote[]
  }>('/advising-notes')

  return response.data
}

export async function createFacultyAdvisingNote(
  studentId: number,
  noteText: string
) {
const response = await api.post('/advising-notes', {
        student_id: studentId,
    note_text: noteText
  })

  return response.data
}
