import express from 'express'
import { pool } from './db.js'
import { createSubmission } from './SubmissionData.js'


function invalid(message) {
  return Object.assign(new Error(message), { status: 400 })
}

export function createSubmissionRouter(database=pool){
  const router = express.Router()
  const data = createSubmission(database)

  router.get('/status', async (_request, response) => {
    const students = await data.listSubmission()
    response.json({ status: 'ok', service: 'Student database API', studentCount: students.length })
  })

  router.get('/submissions', async(request, response) =>{
    response.json({submissions: await data.listSubmissions()})
  })

  router.get('/submissions:section_id', async(request,response)=>{
    response.json({submissions: await data.listSubmissions(Number(request.section_id))})
  })

  router.get('/submission/:id',async(request,response)=>{
    if (!/^\d+$/.test(request.params.id)) throw invalid('Submission ID must be a positive integer.')
        const submission = await data.getSubmission(Number(request.params.id))
        if (!submission) return response.status(404).json({ error: 'NOT_FOUND', message: 'Submission not found.' })
        response.json({ submission })
  })

  router.use((error, _request, response, _next) => {
        if (error.status === 400) return response.status(400).json({ error: 'INVALID_INPUT', message: error.message })
        console.error('Academic database request failed:', error.code || error.name)
        response.status(503).json({ error: 'DATABASE_UNAVAILABLE', message: 'Assignment data is unavailable. Check PostgreSQL and run database setup.' })
    })
  return router
}