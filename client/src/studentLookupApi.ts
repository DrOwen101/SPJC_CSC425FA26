// These fields match GET /api/students in server/src/app.js. The directory
// response does not include the semester/GPA fields from the transcript route.
export type Student = {
  id: number
  name: string
}

export type StudentsResponse = { 
  students: Student[]
}

// Ignore capitalization and leading/trailing spaces, but require a full name.
export function normalizeName(name: string): string {
  return name.trim().toLowerCase()
}

// Accept unknown network data only after checking the envelope and each record.
// An empty students array is valid and will produce a normal no-match result.
export function isStudentsResponse(value: unknown): value is StudentsResponse {
  if (typeof value !== 'object' || value === null || !('students' in value)) return false
  return Array.isArray(value.students) && value.students.every((student: unknown) =>
    typeof student === 'object' && 
    student !== null &&
   'id' in student && typeof student.id === 'number' &&
   'name' in student && typeof student.name === 'string'
  )
}
