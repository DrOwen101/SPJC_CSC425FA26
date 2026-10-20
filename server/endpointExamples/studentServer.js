import express from 'express'
import { getStudents, addStudent } from './studentDb.js'
export const studentRoutes = express.Router()
studentRoutes.get('/', async (req, res) => {
  const students = await getStudents()
  res.json({ students })
})
studentRoutes.post('/', async (req, res) => {
  const { firstName, lastName, major } = req.body ?? {}
  if (
    typeof firstName !== 'string' || firstName.trim() === '' ||
    typeof lastName !== 'string' || lastName.trim() === '' ||
    typeof major !== 'string' || major.trim() === ''
  ) {
    return res.status(400).json({ message: 'Complete all three fields.' })
  }
  const student = await addStudent(
    firstName.trim(), lastName.trim(), major.trim(),
  )
  res.status(201).json({ message: 'Student added.', student })
})
studentRoutes.use((error, req, res, next) => {
  console.error(error.message)
  res.status(500).json({ message: 'Database request failed.' })
})
