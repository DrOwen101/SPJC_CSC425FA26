const gradePoints = {
  'A+': 4, A: 4, 'A-': 3.7, 'B+': 3.3, B: 3, 'B-': 2.7,
  'C+': 2.3, C: 2, 'C-': 1.7, 'D+': 1.3, D: 1, 'D-': 0.7, F: 0,
}
const studentColumns = `s.id::text AS "studentID", s.first_name AS "firstName",
  s.last_name AS "lastName", m.name AS major`
const studentTables = 'student_dashboard.students s JOIN student_dashboard.majors m ON m.id = s.major_id'
const roundedGpa = (points, credits) => credits ? Number((points / credits).toFixed(2)) : 0

export function createAcademicData(database) {
  return {
    async listStudents(name) {
      return (await database.query(`SELECT ${studentColumns} FROM ${studentTables}
        ${name === undefined ? '' : `WHERE lower(regexp_replace(btrim(s.first_name || ' ' || s.last_name), '[[:space:]]+', ' ', 'g')) = $1`}
        ORDER BY s.id`, name === undefined ? [] : [name])).rows
    },
    async getStudent(id) {
      return (await database.query(`SELECT ${studentColumns} FROM ${studentTables} WHERE s.id = $1`, [id])).rows[0]
    },
    async getTranscript(student) {
      const { rows } = await database.query(`SELECT institution, term, term_start, course_code, course_title,
          credit_hours, grade, is_sample
        FROM student_dashboard.transcript_courses WHERE student_id = $1
        ORDER BY term_start, course_code`, [student.studentID])
      if (!rows.length) return null

      const terms = new Map()
      let totalPoints = 0
      let creditsAttempted = 0
      let creditsEarned = 0
      for (const row of rows) {
        const key = row.term_start.toISOString()
        if (!terms.has(key)) terms.set(key, { term: row.term, courses: [], creditsAttempted: 0, creditsEarned: 0, points: 0 })
        const semester = terms.get(key)
        semester.courses.push({ courseCode: row.course_code, courseTitle: row.course_title, creditHours: row.credit_hours, grade: row.grade })
        const earned = row.grade === 'F' ? 0 : row.credit_hours
        const points = row.credit_hours * gradePoints[row.grade]
        semester.creditsAttempted += row.credit_hours
        semester.creditsEarned += earned
        semester.points += points
        creditsAttempted += row.credit_hours
        creditsEarned += earned
        totalPoints += points
      }
      return {
        ...student,
        institution: [...new Set(rows.map((row) => row.institution))].join(' / '),
        isMockData: rows.some((row) => row.is_sample),
        semesters: [...terms.values()].map(({ points, ...semester }) => ({ ...semester, gpa: roundedGpa(points, semester.creditsAttempted) })),
        summary: { creditsAttempted, creditsEarned, cumulativeGPA: roundedGpa(totalPoints, creditsAttempted) },
      }
    },
  }
}
