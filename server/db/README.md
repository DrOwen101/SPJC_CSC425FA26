# Lab 10: Student records database

Students are stored in PostgreSQL and managed from the **Student Records** card on the student dashboard. All people in the data are fictional.

## Tables (schema `student_dashboard`)

| Table | Primary key | Other keys and constraints |
|---|---|---|
| `majors` | `id` (identity) | `code` UNIQUE, 2 to 10 capital letters. `name` UNIQUE, not blank. |
| `students` | `id` (identity) | `major_id` FOREIGN KEY → `majors(id)`, ON DELETE RESTRICT. `email` UNIQUE and lowercase. `enrollment_year` from 2000 to 2100. `is_active` defaults to true. `created_at` and `updated_at` timestamps. |

One major has many students. A student cannot point to a major that does not exist, and a major cannot be deleted while students still use it. The `id` is how each student record is tracked through create, retrieve, edit, and delete.

## Setup (Windows PowerShell, from the repository root)

1. Create the database once, if it does not exist yet:
   ```powershell
   psql -h localhost -U postgres -d postgres -c "CREATE DATABASE csc425_practice;"
   ```
   If `psql` is not recognized, add PostgreSQL to the terminal first (change `18` to your version):
   ```powershell
   $env:Path = "C:\Program Files\PostgreSQL\18\bin;" + $env:Path
   ```
2. Create the tables, then insert the sample data. Both files are safe to run again.
   ```powershell
   psql -h localhost -U postgres -d csc425_practice -f server/db/schema.sql
   psql -h localhost -U postgres -d csc425_practice -f server/db/seed.sql
   ```
   `seed.sql` ends with a query that lists the sample students.
3. Copy `server/.env.example` to `server/.env` and enter your own PostgreSQL password. `.env` is ignored by Git.
4. Install and start:
   ```powershell
   npm ci --prefix server
   npm ci --prefix client
   npm run dev
   ```
5. Check the database connection at `http://localhost:3000/api/health`, then open the dashboard at `http://localhost:5173`.

## Endpoints

All requests and responses use JSON. The dashboard calls them through the shared Axios client in `client/src/apiClient.ts`, using the functions in `client/src/dashboardStudentsApi.ts`.

| Method | Path | Purpose | Request body | Success | Errors |
|---|---|---|---|---|---|
| GET | `/api/dashboard/majors` | List majors for the dropdown | none | 200 `{ majors: [{ id, code, name }] }` | 503 |
| GET | `/api/dashboard/students` | List every student | none | 200 `{ students: [...] }` | 503 |
| POST | `/api/dashboard/students` | Create a student | `{ firstName, lastName, email, majorId, enrollmentYear, isActive }` | 201 `{ student }` | 400 invalid field, 409 duplicate email or missing major, 503 |
| GET | `/api/dashboard/students/:id` | Get one student | none | 200 `{ student }` | 400 bad id, 404 not found, 503 |
| PUT | `/api/dashboard/students/:id` | Replace one student's values | same as POST | 200 `{ student }` | 400, 404, 409, 503 |
| DELETE | `/api/dashboard/students/:id` | Delete one student | none | 200 `{ deletedId }` | 400, 404, 503 |

`student` has `id`, `firstName`, `lastName`, `email`, `majorId`, `majorName`, `enrollmentYear`, `isActive`, `createdAt`, and `updatedAt`.

## Checking the database directly

```sql
SELECT s.id, s.first_name, s.last_name, s.email, m.name AS major,
       s.enrollment_year, s.is_active, s.updated_at
FROM student_dashboard.students s
JOIN student_dashboard.majors m ON m.id = s.major_id
ORDER BY s.id;
```

For one record, add `WHERE s.id = 4` (use the id shown on the dashboard).
