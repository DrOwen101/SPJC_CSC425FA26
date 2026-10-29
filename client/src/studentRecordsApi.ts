import axios from 'axios'

export type Major = {
  id: number
  code: string
  name: string
}

// The form sends these fields when creating or updating a student.
export type StudentInput = {
  firstName: string
  lastName: string
  email: string
  majorId: number
  enrollmentYear: number
  isActive: boolean
}

// A saved student also has an ID, major name, and database timestamps.
export type StudentRecord = StudentInput & {
  id: number
  majorName: string
  createdAt: string
  updatedAt: string
}

// Use the Vite proxy locally, or a configured API origin when deployed.
const origin = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const api = axios.create({
  baseURL: `${origin}/api/dashboard`,
  timeout: 15000,
})

// These checks validate actual JSON. TypeScript types alone cannot validate
// data received over the network. "value is ..." tells TypeScript what we checked.
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isMajor(value: unknown): value is Major {
  if (!isObject(value)) return false

  return Number.isInteger(value.id)
    && typeof value.code === 'string'
    && typeof value.name === 'string'
}

function isStudent(value: unknown): value is StudentRecord {
  if (!isObject(value)) return false

  return Number.isInteger(value.id)
    && Number.isInteger(value.majorId)
    && Number.isInteger(value.enrollmentYear)
    && typeof value.isActive === 'boolean'
    && typeof value.firstName === 'string'
    && typeof value.lastName === 'string'
    && typeof value.email === 'string'
    && typeof value.majorName === 'string'
    && typeof value.createdAt === 'string'
    && typeof value.updatedAt === 'string'
}

function readStudent(data: unknown): StudentRecord {
  if (!isObject(data) || !isStudent(data.student)) {
    throw new Error('The API returned an unexpected student record.')
  }
  return data.student
}

export async function listMajors(signal?: AbortSignal): Promise<Major[]> {
  const response = await api.get<unknown>('/majors', { signal })
  const data = response.data

  if (!isObject(data) || !Array.isArray(data.majors) || !data.majors.every(isMajor)) {
    throw new Error('The API returned an unexpected major list.')
  }
  return data.majors
}

// AllStudents calls this helper; it is our function, not a React built-in.
// async returns a Promise. await waits for Axios without blocking the page.
// The optional signal lets the component cancel an outdated request.
export async function listStudentRecords(signal?: AbortSignal): Promise<StudentRecord[]> {
  const response = await api.get<unknown>('/students', { signal })
  const data = response.data

  if (!isObject(data) || !Array.isArray(data.students) || !data.students.every(isStudent)) {
    throw new Error('The API returned an unexpected student list.')
  }
  return data.students
}

export async function getStudentRecord(id: number, signal?: AbortSignal): Promise<StudentRecord> {
  const response = await api.get<unknown>(`/students/${id}`, { signal })
  return readStudent(response.data)
}

export async function createStudentRecord(student: StudentInput): Promise<StudentRecord> {
  const response = await api.post<unknown>('/students', student)
  return readStudent(response.data)
}

export async function updateStudentRecord(id: number, student: StudentInput): Promise<StudentRecord> {
  const response = await api.put<unknown>(`/students/${id}`, student)
  return readStudent(response.data)
}

export async function deleteStudentRecord(id: number): Promise<void> {
  await api.delete(`/students/${id}`)
}

export function studentRecordsError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (isObject(data) && typeof data.message === 'string') {
      return data.message
    }
    if (error.code === 'ECONNABORTED') {
      return 'The request timed out. Retrieve the record before retrying a change.'
    }
    return 'Unable to reach student records. Check that the backend is running.'
  }

  if (error instanceof Error) {
    return error.message
  }
  return 'Unable to complete the student request.'
}
