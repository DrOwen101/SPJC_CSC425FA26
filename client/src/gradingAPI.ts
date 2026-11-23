import axios from 'axios'

//Export types for Assignments and Submissions
export type Assignment ={
    id: number
    section_id: number
    title: string
    instructions: string
    due_at: string
    max_points: number
    is_published: boolean
}
export type AssignmentDraft = {
    section_id: number
    title: string
    instructions: string
    due_at: string
    max_points: number
    is_published: boolean
}
export type Submission ={ 
    assignment_id: number
    enrollment_id: number
    section_id: number
    submitted_at:Date
    submission_text: string
    points_awarded: number
    feedback: string
    graded_by: number
    graded_at:Date
}

//Connection to the API
const origin = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const api = axios.create({
  baseURL: `${origin}/api/dashboard`,
  timeout: 15000,
})

//Checks that it is an object
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

//Checks that it is an Assignment
function isAssignment(value: unknown): value is Assignment {
  if (!isObject(value)) return false

  return Number.isInteger(value.id)
    && Number.isInteger(value.section_id)
    && typeof value.title === 'string'
    && typeof value.instructions === 'string'
    && typeof value.due_at === 'string' 
    && !Number.isNaN(Date.parse(value.due_at))
    && Number.isFinite(Number(value.max_points))
    && typeof value.is_published === 'boolean'
}

//Checks that it is a Submission
function isSubmission(value: unknown): value is Submission {
  if (!isObject(value)) return false

  return Number.isInteger(value.id)
    && Number.isInteger(value.assignment_id)
    && Number.isInteger(value.enrollment_id)
    && Number.isInteger(value.section_id)
    && typeof value.submitted_at === 'string' 
    && !Number.isNaN(Date.parse(value.submitted_at))
    && typeof value.submission_text === 'string'
    && Number.isInteger(value.points_awarded)
    && typeof value.feedback === 'string'
    && Number.isInteger(value.graded_by)
    && typeof value.graded_at === 'string' 
    && !Number.isNaN(Date.parse(value.graded_at))
}

//Read the Assignment, aka verify it is an Assignment and if so return the information
function readAssignment(data: unknown): Assignment {
  if (!isObject(data) || !isAssignment(data.assignment)) {
    throw new Error('The API returned unexpected assignment data.')
  }

  const assignment = data.assignment as Record<string, unknown>
  return {
    ...assignment,
    due_at: typeof assignment.due_at === 'string'
      ? assignment.due_at
      : new Date(assignment.due_at as string).toISOString(),
    max_points: Number(assignment.max_points)
  } as Assignment
}

//Read the Submission, aka verify it is an Submission and if so return the information
function readSubmission(data: unknown): Submission {
  if (!isObject(data) || !isSubmission(data.submission)) {
    throw new Error('The API returned unexpected submission data.')
  }
  return data.submission
}

//List out all assignments
export async function listAssignments(signal?: AbortSignal): Promise<Assignment[]> {
  const response = await api.get<unknown>('/assignments', { signal })
  const data = response.data

  if (!isObject(data) || !Array.isArray(data.assignments) || !data.assignments.every(isAssignment)) {
    throw new Error('The API returned an unexpected assignment list.')
  }
  return data.assignments.map((assignment) => {
    const record = assignment as Assignment
    return { ...record, max_points: Number(record.max_points) }
  })
}

//List out all Submissions
export async function listSubmissions(signal?: AbortSignal): Promise<Submission[]> {
  const response = await api.get<unknown>('/submission', { signal })
  const data = response.data

  if (!isObject(data) || !Array.isArray(data.submission) || !data.submission.every(isSubmission)) {
    throw new Error('The API returned an unexpected list of submissions.')
  }
  return data.submission
}

//Get an Assignment based on its id
export async function getAssignment(id: number, signal?: AbortSignal): Promise<Assignment> {
  const response = await api.get<unknown>(`/assignments/${id}`, { signal })
  return readAssignment(response.data)
}

//Get a Submission based on its id
export async function getSubmission(id: number, signal?: AbortSignal): Promise<Submission> {
  const response = await api.get<unknown>(`/submission/${id}`, { signal })
  return readSubmission(response.data)
}

//Create an Assignment -> no submission couterpart since the Faculty is not creating submission students are
export async function createAssignment(assignment: AssignmentDraft): Promise<Assignment> {
  const response = await api.post<unknown>('/assignments', {
    ...assignment,
    due_at: new Date(assignment.due_at).toISOString()
  })
  return readAssignment(response.data)
}

//Updates an Assignment-> allows faculty to make changes to their assignemnts
export async function updateAssignment(id: number, assignment: AssignmentDraft): Promise<Assignment> {
  const response = await api.put<unknown>(`/assignments/${id}`, {
    ...assignment,
    due_at: new Date(assignment.due_at).toISOString()
  })
  return readAssignment(response.data)
}

//Allows a Submission to be updated -> this will allow a faculty to grade and leave feedback on a submission
export async function updateSubmission(id: number, submission: Submission): Promise<Submission> {
  const response = await api.put<unknown>(`/submission/${id}`, submission)
  return readSubmission(response.data)
}

//Deletes an Assignment
export async function deleteAssignment(id: number): Promise<void> {
  await api.delete(`/assignments/${id}`)
}

//Reports errors in axios and returned data
export function assignmentError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (isObject(data) && typeof data.message === 'string') {
      return data.message
    }
    if (error.code === 'ECONNABORTED') {
      return 'The request timed out. Retrieve the assignment before retrying a change.'
    }
    return 'Unable to reach assignment records. Check that the backend is running.'
  }

  if (error instanceof Error) {
    return error.message
  }
  return 'Unable to complete the assignment request.'
}

//Reports errors in axios and returned data
export function submissionError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (isObject(data) && typeof data.message === 'string') {
      return data.message
    }
    if (error.code === 'ECONNABORTED') {
      return 'The request timed out. Retrieve the submission before retrying a change.'
    }
    return 'Unable to reach submission records. Check that the backend is running.'
  }

  if (error instanceof Error) {
    return error.message
  }
  return 'Unable to complete the submission request.'
}