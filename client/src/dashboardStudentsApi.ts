import { api } from './apiClient'

// The shapes the Express /api/dashboard routes send back.
export type Major = { id: number; code: string; name: string }

export type DashboardStudent = {
  id: number
  firstName: string
  lastName: string
  email: string
  majorId: number
  majorName: string
  enrollmentYear: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// The values a user can type in. The database creates id and the timestamps.
export type StudentInput = Pick<DashboardStudent, 'firstName' | 'lastName' | 'email' | 'majorId' | 'enrollmentYear' | 'isActive'>

// GET /api/dashboard/majors → 200 { majors }
export async function listMajors() {
  const response = await api.get<{ majors: Major[] }>('/api/dashboard/majors')
  return response.data.majors
}

// POST /api/dashboard/students → 201 { student }
export async function createStudent(input: StudentInput) {
  const response = await api.post<{ student: DashboardStudent }>('/api/dashboard/students', input)
  return response.data.student
}

// GET /api/dashboard/students/:id → 200 { student } or 404
export async function getStudent(id: number) {
  const response = await api.get<{ student: DashboardStudent }>(`/api/dashboard/students/${id}`)
  return response.data.student
}

// PUT /api/dashboard/students/:id → 200 { student } or 404
export async function updateStudent(id: number, input: StudentInput) {
  const response = await api.put<{ student: DashboardStudent }>(`/api/dashboard/students/${id}`, input)
  return response.data.student
}

// DELETE /api/dashboard/students/:id → 200 { deletedId } or 404
export async function deleteStudent(id: number) {
  const response = await api.delete<{ deletedId: number }>(`/api/dashboard/students/${id}`)
  return response.data.deletedId
}
