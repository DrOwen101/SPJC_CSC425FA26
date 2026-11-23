export type FacultyCourse = {
  courseId: number
  courseCode: string
  courseTitle: string
  section: string
  term: string
}

export type RosterStudent = {
  studentID: string
  firstName: string
  lastName: string
  major: string
}

const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL
  || `${window.location.protocol}//${window.location.hostname}:3000`
).replace(/\/$/, '')

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isFacultyCourse(value: unknown): value is FacultyCourse {
  return isObject(value)
    && typeof value.courseId === 'number'
    && Number.isInteger(value.courseId)
    && typeof value.courseCode === 'string'
    && typeof value.courseTitle === 'string'
    && typeof value.section === 'string'
    && typeof value.term === 'string'
}

function isRosterStudent(value: unknown): value is RosterStudent {
  return isObject(value)
    && typeof value.studentID === 'string'
    && typeof value.firstName === 'string'
    && typeof value.lastName === 'string'
    && typeof value.major === 'string'
}

function isCoursesResponse(
  value: unknown,
): value is { courses: FacultyCourse[] } {
  return isObject(value)
    && Array.isArray(value.courses)
    && value.courses.every(isFacultyCourse)
}

function isRosterResponse(
  value: unknown,
): value is { students: RosterStudent[] } {
  return isObject(value)
    && Array.isArray(value.students)
    && value.students.every(isRosterStudent)
}

async function getJson(path: string): Promise<unknown> {
  const response = await fetch(`${apiBaseUrl}${path}`)
  if (!response.ok) {
    throw new Error(`Faculty request failed (HTTP ${response.status}).`)
  }
  const data: unknown = await response.json()
  return data
}

export async function getFacultyCourses(): Promise<FacultyCourse[]> {
  const data = await getJson('/api/faculty/courses')
  if (!isCoursesResponse(data)) {
    throw new Error('The faculty course service returned unexpected data.')
  }
  return data.courses
}

export async function getCourseRoster(courseId: number): Promise<RosterStudent[]> {
  if (!Number.isInteger(courseId) || courseId < 1) {
    throw new Error('Course ID must be a positive number.')
  }

  const data = await getJson(
    `/api/faculty/courses/${courseId}/roster`,
  )
  if (!isRosterResponse(data)) {
    throw new Error('The faculty roster service returned unexpected data.')
  }
  return data.students
}