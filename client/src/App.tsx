import { useState } from 'react'
import SPJCLogo from './assets/SPJCLogo.jpg'
import StudentDashboard from './Dashboardstudent'
import FacultyDashboard from './FacultyDashboard'
import AdminDashboard from './AdminDashboard'
import './App.css'

type DashboardRole = 'student' | 'faculty' | 'admin'

function getDashboard(activeDashboard: DashboardRole | null) {
  switch (activeDashboard) {
    case 'student':
      return <StudentDashboard />
    case 'faculty':
      return <FacultyDashboard />
    case 'admin':
      return <AdminDashboard />
    default:
      return null
  }
}


function App() {
  const [activeDashboard, setActiveDashboard] = useState<DashboardRole | null>(null)
  const dashboard = getDashboard(activeDashboard)



  return (
    <>
      <nav className="navbar" aria-label="Main navigation">
        <a className="navbar-brand" href="#center">My Website</a>

        <ul className="navbar-links">
          <li>
            <a href="#center" onClick={() => setActiveDashboard(null)}>
              Home
            </a>
          </li>

          <li>
            <a href="#student-dashboard" onClick={() => setActiveDashboard('student')}>
              Student
            </a>
          </li>

          <li>
            <a href="#faculty-dashboard" onClick={() => setActiveDashboard('faculty')}>
              Faculty
            </a>
          </li>

          <li>
            <a href="#admin-dashboard" onClick={() => setActiveDashboard('admin')}>
              Admin
            </a>
          </li>
        </ul>
      </nav>
          {dashboard ?? (
        <section id="center">
          <div className="hero">
            <img
              src={SPJCLogo}
              className="base"
              width="170"
              height="179"
              alt="SPJC logo"
            />
          </div>

          <div>
            <h1>CSC425FA26 Course Project</h1>
            <h1>SPJC</h1>
            <p>
              Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
            </p>
          </div>
        </section>
      )}

      <section id="spacer">
      </section>
    </>
  )
}

export default App