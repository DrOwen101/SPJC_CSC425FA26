// These fields match GET /api/students in server/src/academicRoutes.js. The directory
// response does not include the semester/GPA fields from the transcript route.
export type Course = {
  courseTitle: string
  sectionNumber: string
  instructor: string
  enrollment: number
  seats: number
  courseMaterials: string
}

export type CoursesResponse = { courses: Course[] }

// Ignore capitalization and leading/trailing spaces, but require a full name.
export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase()
}

// Accept unknown network data only after checking the envelope and each record.
// An empty courses array is valid and will produce a normal no-match result.
export function isCoursesResponse(value: unknown): value is CoursesResponse {
  if (typeof value !== 'object' || value === null || !('courses' in value)) return false
  return Array.isArray(value.courses) && value.courses.every((course: unknown) =>
    typeof course === 'object' && course !== null
    && 'courseTitle' in course && typeof course.courseTitle === 'string'
    && 'sectionNumber' in course && typeof course.sectionNumber === 'string'
    && 'instructor' in course && typeof course.instructor === 'string'
    && 'enrollment' in course && typeof course.enrollment === 'number'
    && 'seats' in course && typeof course.seats === 'number'
    && 'courseMaterials' in course && typeof course.courseMaterials === 'string',
  )
}