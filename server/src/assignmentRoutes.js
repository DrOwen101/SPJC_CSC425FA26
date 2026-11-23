import express from 'express'
import { pool } from './db.js'
import { createAssignmentData } from './AssignmentData.js'

function invalid(message) {
  return Object.assign(new Error(message), { status: 400 })
}

export function createAssignmentRouter(database=pool){
  const router = express.Router()
  const data = createAssignmentData(database)

  function validateAssignment(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw invalid('Provide an assignment object.')
    if (!Number.isInteger(body.section_id) || body.section_id < 1) throw invalid('Choose a valid section.')
    if (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 160) throw invalid('Title must contain 1–160 characters.')
    if (typeof body.instructions !== 'string') throw invalid('Instructions must be text.')
    if (typeof body.due_at !== 'string' || Number.isNaN(Date.parse(body.due_at))) throw invalid('Provide a valid due date.')
    if (!Number.isFinite(body.max_points) || body.max_points <= 0 || body.max_points > 999999.99) throw invalid('Maximum points must be greater than zero.')
    if (typeof body.is_published !== 'boolean') throw invalid('Published must be true or false.')

    return {
      section_id: body.section_id,
      title: body.title.trim(),
      instructions: body.instructions,
      due_at: body.due_at,
      max_points: body.max_points,
      is_published: body.is_published,
    }
  }

  router.get('/status', async (_request, response) => {
    const assignments = await data.listAssignments()
    response.json({ status: 'ok', service: 'Assignment API', assignmentCount: assignments.length })
  })

  router.get('/assignments', async(request, response) =>{
    response.json({ assignments: await data.listAssignments() })
  })

  router.post('/assignments', async (request, response) => {
    const assignment = await data.createAssignment(validateAssignment(request.body))
    response.status(201).json({ assignment })
  })

  router.put('/assignments/:id', async (request, response) => {
    if (!/^[1-9]\d*$/.test(request.params.id)) throw invalid('Assignment ID must be a positive integer.')
    const assignment = await data.updateAssignment(Number(request.params.id), validateAssignment(request.body))
    if (!assignment) return response.status(404).json({ error: 'NOT_FOUND', message: 'Assignment not found.' })
    response.json({ assignment })
  })

  router.get('/assignments/:id',async(request,response)=>{
    if (!/^\d+$/.test(request.params.id)) throw invalid('Assignment ID must be a positive integer.')
        const assignment = await data.getAssignment(Number(request.params.id))
        if (!assignment) return response.status(404).json({ error: 'NOT_FOUND', message: 'Assignment not found.' })
        response.json({ assignment })
  })

  router.delete('/assignments/:id', async (request, response) => {
    if (!/^[1-9]\d*$/.test(request.params.id)) throw invalid('Assignment ID must be a positive integer.')
    const deleted = await data.deleteAssignment(Number(request.params.id))
    if (!deleted) return response.status(404).json({ error: 'NOT_FOUND', message: 'Assignment not found.' })
    response.status(204).end()
  })

  router.use((error, _request, response, _next) => {
        if (error.status === 400) return response.status(400).json({ error: 'INVALID_INPUT', message: error.message })
        if (error.code === '23503' || error.code === '23001') {
          return response.status(409).json({ error: 'ASSIGNMENT_HAS_SUBMISSIONS', message: 'This assignment has submissions and cannot be deleted.' })
        }
        console.error('Academic database request failed:', error.code || error.name)
        response.status(503).json({ error: 'DATABASE_UNAVAILABLE', message: 'Assignment data is unavailable. Check PostgreSQL and run database setup.' })
    })
  return router
}