// These fields match the name-search response from GET /api/students in
// server/src/app.js. Transcript and GPA data come from a separate endpoint.
export type Student = {
  studentID: string
  firstName: string
  lastName: string
  major: string
  institution: string
}

export type StudentsResponse = { students: Student[] }

// Ignore capitalization and leading/trailing spaces, but require a full name.
export function normalizeName(name: string): string {
  return name.trim().toLowerCase()
}

// Accept unknown network data only after checking the envelope and each record.
// An empty students array is valid and will produce a normal no-match result.
export function isStudentsResponse(value: unknown): value is StudentsResponse {
  if (typeof value !== 'object' || value === null || !('students' in value)) return false
  return Array.isArray(value.students) && value.students.every(isStudentRecord)
}

export function isStudentRecord(value: unknown): value is Student {
  return typeof value === 'object' && value !== null
    && 'studentID' in value && typeof value.studentID === 'string'
    && 'firstName' in value && typeof value.firstName === 'string'
    && 'lastName' in value && typeof value.lastName === 'string'
    && 'major' in value && typeof value.major === 'string'
    && 'institution' in value && typeof value.institution === 'string'
}
