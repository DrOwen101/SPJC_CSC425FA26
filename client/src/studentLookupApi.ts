// These fields match GET /api/students in server/src/academicRoutes.js. The directory
// response does not include the semester/GPA fields from the transcript route.
export type Student = {
  studentID: string
  firstName: string
  lastName: string
  major: string
}

export type StudentsResponse = { students: Student[] }

// Ignore capitalization and leading/trailing spaces, but require a full name.
export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase()
}

// Accept unknown network data only after checking the envelope and each record.
// An empty students array is valid and will produce a normal no-match result.
export function isStudentsResponse(value: unknown): value is StudentsResponse {
  if (typeof value !== 'object' || value === null || !('students' in value)) return false
  return Array.isArray(value.students) && value.students.every((student: unknown) =>
    typeof student === 'object' && student !== null
    && 'studentID' in student && typeof student.studentID === 'string'
    && 'firstName' in student && typeof student.firstName === 'string'
    && 'lastName' in student && typeof student.lastName === 'string'
    && 'major' in student && typeof student.major === 'string',
  )
}
