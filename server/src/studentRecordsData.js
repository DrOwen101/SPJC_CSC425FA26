// All user-supplied values use $1, $2, ... parameters, never SQL interpolation.
const columns = `s.id, s.first_name AS "firstName", s.last_name AS "lastName",
  s.email, s.major_id AS "majorId", m.name AS "majorName",
  s.enrollment_year AS "enrollmentYear", s.is_active AS "isActive",
  s.created_at AS "createdAt", s.updated_at AS "updatedAt"`

// The router supplies the PostgreSQL pool. Tests can supply a separate test database.
export function createStudentRecordsData(database) {
  return {
    async listMajors() {
      const result = await database.query(
        'SELECT id, code, name FROM student_dashboard.majors ORDER BY name',
      )
      return result.rows
    },
    async listStudents() {
      const result = await database.query(`SELECT ${columns}
        FROM student_dashboard.students s JOIN student_dashboard.majors m ON m.id = s.major_id
        ORDER BY s.id`)
      return result.rows
    },
    async getStudent(id) {
      const result = await database.query(`SELECT ${columns}
        FROM student_dashboard.students s JOIN student_dashboard.majors m ON m.id = s.major_id
        WHERE s.id = $1`, [id])
      return result.rows[0]
    },
    async createStudent(student) {
      // WITH saved names the INSERT result so the final SELECT can join its major.
      // One statement saves and returns the record, including the major name.
      const result = await database.query(`WITH saved AS (
        INSERT INTO student_dashboard.students
          (first_name, last_name, email, major_id, enrollment_year, is_active)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
      ) SELECT ${columns} FROM saved s JOIN student_dashboard.majors m ON m.id = s.major_id`,
      [student.firstName, student.lastName, student.email, student.majorId, student.enrollmentYear, student.isActive])
      return result.rows[0]
    },
    async updateStudent(id, student) {
      const result = await database.query(`WITH saved AS (
        UPDATE student_dashboard.students
        SET first_name = $1, last_name = $2, email = $3, major_id = $4,
            enrollment_year = $5, is_active = $6, updated_at = clock_timestamp()
        WHERE id = $7 RETURNING *
      ) SELECT ${columns} FROM saved s JOIN student_dashboard.majors m ON m.id = s.major_id`,
      [student.firstName, student.lastName, student.email, student.majorId, student.enrollmentYear, student.isActive, id])
      return result.rows[0]
    },
    async deleteStudent(id) {
      const result = await database.query(
        'DELETE FROM student_dashboard.students WHERE id = $1 RETURNING id',
        [id],
      )
      return result.rowCount > 0
    },
  }
}
