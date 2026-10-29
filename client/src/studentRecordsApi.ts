import axios from 'axios'

export type Major = { id: number; code: string; name: string }
export type StudentInput = {
  firstName: string
  lastName: string
  email: string
  majorId: number
  enrollmentYear: number
  isActive: boolean
}
export type StudentRecord = StudentInput & {
  id: number
  majorName: string
  createdAt: string
  updatedAt: string
}

const origin = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const api = axios.create({ baseURL: `${origin}/api/dashboard`, timeout: 15000 })

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
function isStudent(value: unknown): value is StudentRecord {
  return isObject(value) && Number.isInteger(value.id) && Number.isInteger(value.majorId)
    && Number.isInteger(value.enrollmentYear) && typeof value.isActive === 'boolean'
    && ['firstName', 'lastName', 'email', 'majorName', 'createdAt', 'updatedAt'].every((key) => typeof value[key] === 'string')
}
function readStudent(value: unknown): StudentRecord {
  if (!isObject(value) || !isStudent(value.student)) throw new Error('The API returned an unexpected student record.')
  return value.student
}

export async function listMajors(signal?: AbortSignal): Promise<Major[]> {
  const { data } = await api.get<unknown>('/majors', { signal })
  if (!isObject(data) || !Array.isArray(data.majors) || !data.majors.every((major: unknown) =>
    isObject(major) && Number.isInteger(major.id) && typeof major.code === 'string' && typeof major.name === 'string')) {
    throw new Error('The API returned an unexpected major list.')
  }
  return data.majors as Major[]
}
export async function listStudentRecords(signal?: AbortSignal): Promise<StudentRecord[]> {
  const { data } = await api.get<unknown>('/students', { signal })
  if (!isObject(data) || !Array.isArray(data.students) || !data.students.every(isStudent)) {
    throw new Error('The API returned an unexpected student list.')
  }
  return data.students
}
export async function getStudentRecord(id: number, signal?: AbortSignal): Promise<StudentRecord> {
  return readStudent((await api.get<unknown>(`/students/${id}`, { signal })).data)
}
export async function createStudentRecord(student: StudentInput): Promise<StudentRecord> {
  return readStudent((await api.post<unknown>('/students', student)).data)
}
export async function updateStudentRecord(id: number, student: StudentInput): Promise<StudentRecord> {
  return readStudent((await api.put<unknown>(`/students/${id}`, student)).data)
}
export async function deleteStudentRecord(id: number): Promise<void> {
  await api.delete(`/students/${id}`)
}
export function studentRecordsError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (isObject(error.response?.data) && typeof error.response.data.message === 'string') return error.response.data.message
    if (error.code === 'ECONNABORTED') return 'The request timed out. Retrieve the record before retrying a change.'
    return 'Unable to reach student records. Check that the backend is running.'
  }
  return error instanceof Error ? error.message : 'Unable to complete the student request.'
}
