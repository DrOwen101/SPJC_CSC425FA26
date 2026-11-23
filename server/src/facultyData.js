export function createFaculty(database) {
  return {
    async listFaculty() {
      const result = await database.query(`
        SELECT id,
          employee_number,
          first_name,
          last_name,
          email,
          is_active
        FROM student_dashboard.faculty
        ORDER BY id
      `)
      return result.rows
    },

    async getFaculty(id) {
      const result = await database.query(
        `SELECT id,
          employee_number,
          first_name,
          last_name,
          email,
          is_active
         FROM student_dashboard.faculty
         WHERE id = $1`,
        [id]
      )
      return result.rows[0]
    }
  }
}
