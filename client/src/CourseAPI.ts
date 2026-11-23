import axios from 'axios'
export type Course = {
    course_id: number 
    term_id: number 
    section_number: string
    instructor_id: number 
    grading_scheme_id: number 
    course_code_snapshot: string
    title_snapshot: string
    capacity: number 
    delivery_mode: string
}

const origin = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const api = axios.create({
  baseURL: `${origin}/api/dashboard`,
  timeout: 15000,
})

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isCourse(value: unknown): value is Course {
  return isObject(value)
    && typeof value.course_id === 'number'
    && typeof value.term_id === 'number'
    && typeof value.section_number === 'string'
    && typeof value.instructor_id === 'number'
    && typeof value.grading_scheme_id === 'number'
    && typeof value.course_code_snapshot === 'string'
    && typeof value.title_snapshot === 'string'
    && typeof value.capacity === 'number'
    && typeof value.delivery_mode === 'string'
}

function readCourse(data: unknown): Course {
  if (!isObject(data) || !isCourse(data.course)) {
    throw new Error('The API returned an unexpected course record.')
  }
  return data.course
}

export async function listCourses(signal?: AbortSignal): Promise<Course[]> {
  const response = await api.get<unknown>('/course_sections', { signal })
  const data = response.data

  if (!isObject(data) || !Array.isArray(data.courses) || !data.courses.every(isCourse)) {
    throw new Error('The API returned an unexpected course list.')
  }
  return data.courses
}

export async function getCourse(id: number, signal?: AbortSignal): Promise<Course> {
  const response = await api.get<unknown>(`/course_sections/${id}`, { signal })
  return readCourse(response.data)
}

export function courseError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (isObject(data) && typeof data.message === 'string') {
      return data.message
    }
    if (error.code === 'ECONNABORTED') {
      return 'The request timed out. Retrieve the record before retrying a change.'
    }
    return 'Unable to reach course records. Check that the backend is running.'
  }

  if (error instanceof Error) {
    return error.message
  }
  return 'Unable to complete the course request.'
}