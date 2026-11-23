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

export type FinalGrade = 'A' | 'B' | 'C' | 'D' | 'F'

export type CourseGrade = RosterStudent & {
  grade: FinalGrade | null
}

export type ScheduleMeetingType = 'class' | 'office_hours'
export type Weekday = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'

export type TeachingScheduleEntry = {
  scheduleId: number
  meetingType: ScheduleMeetingType
  courseId: number | null
  courseCode: string | null
  courseTitle: string | null
  section: string | null
  dayOfWeek: Weekday
  startTime: string
  endTime: string
  location: string
}

export type NewTeachingScheduleEntry = {
  meetingType: ScheduleMeetingType
  courseId: number | null
  dayOfWeek: Weekday
  startTime: string
  endTime: string
  location: string
}

function isFinalGrade(value: unknown): value is FinalGrade {
  return value === 'A' || value === 'B' || value === 'C' || value === 'D' || value === 'F'
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

function isCourseGrade(value: unknown): value is CourseGrade {
  return isObject(value)
    && typeof value.studentID === 'string'
    && typeof value.firstName === 'string'
    && typeof value.lastName === 'string'
    && typeof value.major === 'string'
    && (value.grade === null || isFinalGrade(value.grade))
}

function isScheduleEntry(value: unknown): value is TeachingScheduleEntry {
  return isObject(value)
    && typeof value.scheduleId === 'number'
    && (value.meetingType === 'class' || value.meetingType === 'office_hours')
    && (value.courseId === null || typeof value.courseId === 'number')
    && (value.courseCode === null || typeof value.courseCode === 'string')
    && (value.courseTitle === null || typeof value.courseTitle === 'string')
    && (value.section === null || typeof value.section === 'string')
    && typeof value.dayOfWeek === 'string'
    && typeof value.startTime === 'string'
    && typeof value.endTime === 'string'
    && typeof value.location === 'string'
}

async function requestJson(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(`${apiBaseUrl}${path}`, init)
  if (!response.ok) {
    let message = `Faculty request failed (HTTP ${response.status}).`
    try {
      const errorData: unknown = await response.json()
      if (isObject(errorData) && typeof errorData.message === 'string') {
        message = errorData.message
      }
    } catch {
      // Keep the HTTP error when the server does not return JSON.
    }
    throw new Error(message)
  }
  if (response.status === 204) return null
  return response.json() as Promise<unknown>
}

export async function getFacultyCourses(): Promise<FacultyCourse[]> {
  const data = await requestJson('/api/faculty/courses')
  if (!isCoursesResponse(data)) {
    throw new Error('The faculty course service returned unexpected data.')
  }
  return data.courses
}

export async function getCourseRoster(courseId: number): Promise<RosterStudent[]> {
  if (!Number.isInteger(courseId) || courseId < 1) {
    throw new Error('Course ID must be a positive number.')
  }

  const data = await requestJson(
    `/api/faculty/courses/${courseId}/roster`,
  )
  if (!isRosterResponse(data)) {
    throw new Error('The faculty roster service returned unexpected data.')
  }
  return data.students
}

export async function getCourseGrades(courseId: number): Promise<CourseGrade[]> {
  if (!Number.isInteger(courseId) || courseId < 1) {
    throw new Error('Course ID must be a positive number.')
  }
  const data = await requestJson(`/api/faculty/courses/${courseId}/grades`)
  if (!isObject(data) || !Array.isArray(data.students) || !data.students.every(isCourseGrade)) {
    throw new Error('The faculty grading service returned unexpected data.')
  }
  return data.students
}

export async function saveCourseGrade(
  courseId: number,
  studentID: string,
  grade: FinalGrade,
): Promise<void> {
  if (!Number.isInteger(courseId) || courseId < 1) {
    throw new Error('Course ID must be a positive number.')
  }
  const response = await requestJson(
    `/api/faculty/courses/${courseId}/grades/${encodeURIComponent(studentID)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grade }),
    },
  )
  if (!isObject(response) || !isObject(response.student)) {
    throw new Error('The faculty grading service returned unexpected data.')
  }
}

export async function getTeachingSchedule(): Promise<TeachingScheduleEntry[]> {
  const data = await requestJson('/api/faculty/schedule')
  if (!isObject(data) || !Array.isArray(data.schedule) || !data.schedule.every(isScheduleEntry)) {
    throw new Error('The faculty schedule service returned unexpected data.')
  }
  return data.schedule
}

export async function addTeachingScheduleEntry(
  entry: NewTeachingScheduleEntry,
): Promise<void> {
  await requestJson('/api/faculty/schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  })
}

export async function deleteTeachingScheduleEntry(scheduleId: number): Promise<void> {
  if (!Number.isInteger(scheduleId) || scheduleId < 1) {
    throw new Error('Schedule ID must be a positive number.')
  }
  await requestJson(`/api/faculty/schedule/${scheduleId}`, { method: 'DELETE' })
}