import 'dotenv/config'
import { app } from './app.js'

const port = Number(process.env.PORT) || 3000
const host = process.env.HOST || '0.0.0.0'

app.listen(port, host, () => {
  console.log(`CSC 425 API listening on http://localhost:${port}`)
  console.log(`Example transcript: http://localhost:${port}/api/transcripts/1001`)
})
