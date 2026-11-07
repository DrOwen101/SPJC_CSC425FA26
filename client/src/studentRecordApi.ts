
import axios from 'axios'

// Student information returned by PostgreSQL
export interface StudentRecord {
  id: number
  first_name: string
  last_name: string
  email: string
  major_id: number
  major?: string
  enrollment_year: number
  is_active: boolean
}

// Fields required to create or update a student
export type StudentInput = Pick<
  StudentRecord,
  'first_name' | 'last_name' | 'email' | 'major_id' | 'enrollment_year' | 'is_active'
>

const API_URL = 'http://localhost:3000/api/student-records'

// READ
// Retrieve all students
export async function getStudents(): Promise<StudentRecord[]> {
  const response = await axios.get<{ students: StudentRecord[] }>(API_URL)
  return response.data.students
}

// READ
// Retrieve one student by ID
export async function getStudent(id: number): Promise<StudentRecord> {
  const response = await axios.get<StudentRecord>(`${API_URL}/${id}`)
  return response.data
}

// CREATE
// Add a student
export async function createStudent(student: StudentInput): Promise<StudentRecord> {
  const response = await axios.post<StudentRecord>(API_URL, student)
  return response.data
}

// UPDATE
// Modify a student
export async function updateStudent(id: number, student: StudentInput): Promise<StudentRecord> {
  const response = await axios.put<StudentRecord>(`${API_URL}/${id}`, student)
  return response.data
}

// DELETE
// Permanently remove a student
export async function deleteStudent(id: number): Promise<void> {
  await axios.delete(`${API_URL}/${id}`)
}
