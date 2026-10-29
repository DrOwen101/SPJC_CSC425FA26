// All user-supplied values use $1, $2, ... parameters, never SQL interpolation.
const columns = `s.id, s.first_name AS "firstName", s.last_name AS "lastName",
  s.email, s.major_id AS "majorId", m.name AS "majorName",
  s.enrollment_year AS "enrollmentYear", s.is_active AS "isActive",
  s.created_at AS "createdAt", s.updated_at AS "updatedAt"`

export function createStudentRecordsData(database) {
  return {
    async listMajors() {
      return (await database.query('SELECT id, code, name FROM student_dashboard.majors ORDER BY name')).rows
    },
    async listStudents() {
      return (await database.query(`SELECT ${columns}
        FROM student_dashboard.students s JOIN student_dashboard.majors m ON m.id = s.major_id
        ORDER BY s.id`)).rows
    },
    async getStudent(id) {
      return (await database.query(`SELECT ${columns}
        FROM student_dashboard.students s JOIN student_dashboard.majors m ON m.id = s.major_id
        WHERE s.id = $1`, [id])).rows[0]
    },
    async createStudent(student) {
      // A CTE returns the saved row and major name in the same SQL statement.
      return (await database.query(`WITH saved AS (
        INSERT INTO student_dashboard.students
          (first_name, last_name, email, major_id, enrollment_year, is_active)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
      ) SELECT ${columns} FROM saved s JOIN student_dashboard.majors m ON m.id = s.major_id`,
      [student.firstName, student.lastName, student.email, student.majorId, student.enrollmentYear, student.isActive])).rows[0]
    },
    async updateStudent(id, student) {
      return (await database.query(`WITH saved AS (
        UPDATE student_dashboard.students
        SET first_name = $1, last_name = $2, email = $3, major_id = $4,
            enrollment_year = $5, is_active = $6, updated_at = clock_timestamp()
        WHERE id = $7 RETURNING *
      ) SELECT ${columns} FROM saved s JOIN student_dashboard.majors m ON m.id = s.major_id`,
      [student.firstName, student.lastName, student.email, student.majorId, student.enrollmentYear, student.isActive, id])).rows[0]
    },
    async deleteStudent(id) {
      return (await database.query('DELETE FROM student_dashboard.students WHERE id = $1 RETURNING id', [id])).rowCount > 0
    },
  }
}
