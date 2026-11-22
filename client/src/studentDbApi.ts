import axios from 'axios'

// PostgreSQL student record
export type DbStudent = {
  student_id: number
  first_name: string
  last_name: string
  email: string
}

// Express backend connection
const api = axios.create({
  baseURL: 'http://localhost:3000/api/db',
  timeout: 10000,
})

// READ ALL — Retrieve students from PostgreSQL
export async function getAllStudents(): Promise<DbStudent[]> {
  const response = await api.get<{ students: DbStudent[] }>('/students')
  return response.data.students
}

// READ ONE — Retrieve a student by ID
export async function getStudentById(id: number): Promise<DbStudent> {
  const response = await api.get<{ student: DbStudent }>(`/students/${id}`)
  return response.data.student
}

// CREATE — Insert a student into PostgreSQL
export async function createStudent(student: DbStudent): Promise<DbStudent> {
  const response = await api.post<{ student: DbStudent }>('/students', student)
  return response.data.student
}

// UPDATE — Modify an existing student
export async function updateStudent(
  id: number,
  student: Omit<DbStudent, 'student_id'>
): Promise<DbStudent> {
  const response = await api.patch<{ student: DbStudent }>(
    `/students/${id}`,
    student
  )
  return response.data.student
}

// DELETE — Remove a student from PostgreSQL
export async function deleteStudent(id: number): Promise<void> {
  await api.delete(`/students/${id}`)
}