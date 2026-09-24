type Course = {
  courseCode: string
  courseTitle: string
  creditHours: number
  grade: string
}

type Semester = {
  term: string
  courses: Course[]
  creditsAttempted: number
  creditsEarned: number
  gpa: number
}

export type Transcript = {
  studentID: string
  firstName: string
  lastName: string
  major: string
  institution: string
  isMockData: boolean
  semesters: Semester[]
  summary: {
    creditsAttempted: number
    creditsEarned: number
    cumulativeGPA: number
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

// Network JSON needs runtime checks even when we use TypeScript.
function isCourse(value: unknown): value is Course {
  return isObject(value)
    && typeof value.courseCode === 'string'
    && typeof value.courseTitle === 'string'
    && isNumber(value.creditHours)
    && typeof value.grade === 'string'
}

function isSemester(value: unknown): value is Semester {
  return isObject(value)
    && typeof value.term === 'string'
    && isNumber(value.creditsAttempted)
    && isNumber(value.creditsEarned)
    && isNumber(value.gpa)
    && Array.isArray(value.courses)
    && value.courses.every(isCourse)
}

export function isTranscript(value: unknown): value is Transcript {
  return isObject(value)
    && typeof value.studentID === 'string'
    && typeof value.firstName === 'string'
    && typeof value.lastName === 'string'
    && typeof value.major === 'string'
    && typeof value.institution === 'string'
    && typeof value.isMockData === 'boolean'
    && isObject(value.summary)
    && isNumber(value.summary.creditsAttempted)
    && isNumber(value.summary.creditsEarned)
    && isNumber(value.summary.cumulativeGPA)
    && Array.isArray(value.semesters)
    && value.semesters.every(isSemester)
}
