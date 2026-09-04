import { useState } from 'react'
import SPJCLogo from './assets/SPJCLogo.jpg'
import Dashboardstudent from './Dashboardstudent'
import Dashboardfaculty from './Dashboardfaculty'
import Dashboardadmin from './Dashboardadmin'
import studentDashHTML from './studentdash.html?url'
import './App.css'

type DashboardRole = 'student' | 'faculty' | 'admin'

function getDashboard(activeDashboard: DashboardRole | null) {
  switch (activeDashboard) {
    case 'student':
      return <Dashboardstudent />
    case 'faculty':
      return <Dashboardfaculty />
    case 'admin':
      return <Dashboardadmin />
    default:
      return null
  }
}

function App() {
  const [count, setCount] = useState(0)
  const [activeDashboard, setActiveDashboard] = useState<DashboardRole | null>(null)
  const dashboard = getDashboard(activeDashboard)
  
  return (
    <>
      <nav className="navbar" aria-label="Main navigation">
        <a className="navbar-brand" href="#center">My Website</a>
        <ul className="navbar-links">
          <li><a href="#center" onClick={() => setActiveDashboard(null)}>Home</a></li>
          <li><a href="#next-steps">About</a></li>
          <li><a href="#social">Contact</a></li>
          <li>
            <button type="button" onClick={() => { window.location.href = studentDashHTML }}>
              StudentDashHTML
            </button>
          </li>
          <li>
            <button type="button" onClick={() => setActiveDashboard('student')}>
              Student Dashboard
            </button>
          </li>
          <li>
            <button type="button" onClick={() => setActiveDashboard('faculty')}>
              Faculty Dashboard
            </button>
          </li>
          <li>
            <button type="button" onClick={() => setActiveDashboard('admin')}>
              Admin Dashboard
            </button>
          </li>
        </ul>
      </nav>

      {activeDashboard ? dashboard : (
        <>
          <section id="center">
            <div className="hero">
              <img src={SPJCLogo} className="base" width="170" height="179" alt="SPJC logo" />
            </div>
            <div>
              <h1>CSC425FA26 Course Project</h1>
              <h1>SPJC</h1> {/* Change to College Name */}
              <p>Edit <code>src/App.tsx</code> and save to test <code>HMR</code></p>
            </div>
            <button type="button" className="counter" onClick={() => setCount((count) => count + 1)}>
              Count is {count}
            </button>
          </section>
          <section id="spacer">
          </section>
        </>
      )}
    </>
  )
}

export default App
