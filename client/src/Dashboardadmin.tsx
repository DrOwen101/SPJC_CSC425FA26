import SPJCLogo from './assets/SPJCLogo.jpg'

function Dashboardadmin() {
  return (
    <>
      <header>
        <div className="dashboard-title">
          <h1>Admin Dashboard</h1>
          <img className="dashboard-logo" src={SPJCLogo} alt="SPJC logo" />
        </div>
        <p>University Admin Portal</p>

        <nav
          aria-label="Admin navigation"
          style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}
        >
          <a href="#enrollment-overview">Enrollment</a>
          <a href="#attendance-concerns">Attendance</a>
          <a href="#student-success">Student Success</a>
          <a href="#financial-summary">Finance</a>
          <a href="#student-management">Students</a>
          <a href="#course-management">Courses</a>
        </nav>
      </header>

      <main>
        <article id="enrollment-overview">
          <h2>Enrollment Overview</h2>
          <p>Current Enrollment: 1,500</p>
          <p>Fall 2025: 1,100</p>
          <p>Spring 2026: 1,300</p>
          <p>Fall 2026: 1,500</p>
          <nav
            aria-label="Enrollment actions"
            style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}
          >
            <a href="#enrollment-trends">View Enrollment Trends</a>
          </nav>
        </article>

        <article id="attendance-concerns">
          <h2>Attendance Concerns</h2>
          <p>8 students require attention.</p>
          <p>John Doe: 6 absences</p>
          <p>Jane Doe: 5 absences</p>
          <p>Justice Noback: 100 absences</p>
          <nav
            aria-label="Attendance actions"
            style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}
          >
            <a href="#attendance-records">View Attendance Concerns</a>
          </nav>
        </article>

        <article id="student-success">
          <h2>Student Success</h2>
          <p>Average GPA: 3.21</p>
          <p>Academic Warnings: 38</p>
          <p>Students At Risk: 52</p>
          <p>Student Feedback Forum: 15 posts</p>
          <nav
            aria-label="Student success actions"
            style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}
          >
            <a href="#student-success-report">View Student Success Report</a>
          </nav>
        </article>

        <article id="financial-summary">
          <h2>Financial Summary</h2>
          <p>Total Charges: $185,400</p>
          <p>Total Payments: $150,000</p>
          <p>WIP</p>
          <nav
            aria-label="Financial actions"
            style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}
          >
            <a href="#financial-report">View Financial Report</a>
          </nav>
        </article>

        <article id="student-management">
          <h2>Student Management</h2>
          <nav
            aria-label="Student management actions"
            style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}
          >
            <a href="#search-students">Search Students</a>
            <a href="#create-student">Create Student Record</a>
            <a href="#update-student">Update Student Information</a>
          </nav>
        </article>

        <article id="course-management">
          <h2>Course &amp; Section Management</h2>
          <p>Active Sections: 86</p>
          <p>Unassigned Instructors: 3</p>
          <p>CSC 425 - Section 01 - Dr. Owen</p>
          <nav
            aria-label="Course management actions"
            style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}
          >
            <a href="#assign-instructor">Assign Instructor</a>
          </nav>
        </article>
      </main>
    </>
  )
}

export default Dashboardadmin
