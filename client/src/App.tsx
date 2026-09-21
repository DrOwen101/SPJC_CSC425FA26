import { useEffect, useState, type MouseEvent } from 'react'
import SPJCLogo from './assets/SPJCLogo.jpg'
import Dashboardfaculty from './Dashboardfaculty'
import Dashboardstudent from './Dashboardstudent'
import Dashboardadmin from './Dashboardadmin'
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
  const [activeDashboard, setActiveDashboard] = useState<DashboardRole | null>(() => (
    window.location.hash === '#student-dashboard' ? 'student' : null
  ))
  const dashboard = getDashboard(activeDashboard)

  useEffect(() => {
    const targetId = activeDashboard === null
      ? 'center'
      : `${activeDashboard === 'faculty' ? 'faculty' : activeDashboard}-dashboard`
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [activeDashboard])

  function selectDashboard(dashboardRole: DashboardRole | null, event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()
    setActiveDashboard(dashboardRole)
  }

  return (
    <>
      <nav className="navbar" aria-label="Main navigation">
        <a className="navbar-brand" href="#center" onClick={(event) => selectDashboard(null, event)}>
          My Website
        </a>
        <ul className="navbar-links">
          <li><a href="#center" onClick={(event) => selectDashboard(null, event)}>Home</a></li>
          <li>
            <a href="#student-dashboard" onClick={(event) => selectDashboard('student', event)}>
              Student
            </a>
          </li>
          <li>
            <a href="#facultydashboard" onClick={(event) => selectDashboard('faculty', event)}>
              Faculty
            </a>
          </li>
          <li>
            <a href="#admin-dashboard" onClick={(event) => selectDashboard('admin', event)}>
              Admin
            </a>
          </li>
        </ul>
      </nav>

      {dashboard ?? <section id="center">
        <div className="hero">
          <img src={SPJCLogo} className="base" width="170" height="179" alt="SPJC logo" />
        </div>
        <div>
          <h1 className="landing-title">CSC425FA26 Course Project</h1>
          <h1 className="landing-title">SPJC</h1> {/* Change to College Name */}
          <p>Edit <code>src/App.tsx</code> and save to test <code>HMR</code></p>
        </div>
        {/* <button type="button" className="counter" onClick={() => setCount((count) => count + 1)}>
         // Count is {count}
        </button> */}
      </section>}
      <section id="spacer">
        
      </section>
    </>
  )
}

export default App
