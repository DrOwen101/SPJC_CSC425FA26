import { useEffect, useState } from 'react'
import SPJCLogo from './assets/SPJCLogo.jpg'
import Dashboardadmin from './Dashboardadmin'
import Dashboardadmin from './Dashboardadmin'
import Dashboardfaculty from './Dashboardfaculty'
import Dashboardstudent from './Dashboardstudent'
import Dashboardstudent from './Dashboardstudent'
import './App.css'

// A union type restricts role values to these three strings.
type DashboardRole = 'student' | 'faculty' | 'admin'

// Match both page links and section links, so refresh and Back/Forward work.
// These IDs must match the id attributes in the three dashboard components.
function getRole(hash: string): DashboardRole | null {
  const id = hash.slice(1)
  if (['student-dashboard', 'gpa', 'attendance', 'transcript', 'alerts', 'courses'].includes(id)) return 'student'
  if (['faculty-dashboard', 'faculty-courses', 'class-rosters', 'grading', 'faculty-alerts', 'teaching-schedule'].includes(id)) return 'faculty'
  if (['admin-dashboard', 'user-management', 'course-management', 'reports', 'admin-alerts', 'system-status'].includes(id)) return 'admin'
  return null
}

// Explicit switch cases keep the role-to-component relationship easy to follow.
function getDashboard(activeDashboard: DashboardRole | null) {
  switch (activeDashboard) {
    case 'student': return <Dashboardstudent />
    case 'faculty': return <Dashboardfaculty />
    case 'admin': return <Dashboardadmin />
    default: return null
  }
}

function App() {
  
  //const [count, setCount] = useState(0)

  const [activeDashboard, setActiveDashboard] = useState<DashboardRole | null>(null)
  const dashboard = getDashboard(activeDashboard)
  const contentId = activeDashboard ? `${activeDashboard}-dashboard` : 'center'

  // Subscribe once, then clean up the listener when this component unmounts.
  useEffect(() => {
    function handleHashChange() {
      setHash(window.location.hash)
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // React must render the destination before we move focus to it. This helps
  // keyboard and screen-reader users follow page/section changes. tabIndex=-1
  // on the destination allows focus without creating an extra Tab stop.
  useEffect(() => {
    const target = document.getElementById(hash.slice(1))
    if (target) {
      target.focus({ preventScroll: true })
      target.scrollIntoView({ block: 'start' })
    }
    document.title = activeDashboard
      ? `${activeDashboard[0].toUpperCase()}${activeDashboard.slice(1)} Dashboard | CSC425FA26`
      : 'San Pedro Junior College | SPJC'
  }, [hash, activeDashboard])

  return (
    <>
      {/* First keyboard stop: bypass repeated navigation. CSS reveals on focus. */}
      <a className="skip-link" href={`#${contentId}`}>Skip to main content</a>
      <nav className="navbar" aria-label="Main navigation">
        <a className="navbar-brand" href="#center">SPJC</a>
        <ul className="navbar-links">
          <li><a href="#center" aria-current={activeDashboard === null ? 'page' : undefined}>Home</a></li>
          <li><a href="#student-dashboard" aria-current={activeDashboard === 'student' ? 'page' : undefined}>Student</a></li>
          <li><a href="#faculty-dashboard" aria-current={activeDashboard === 'faculty' ? 'page' : undefined}>Faculty</a></li>
          <li><a href="#admin-dashboard" aria-current={activeDashboard === 'admin' ? 'page' : undefined}>Admin</a></li>
        </ul>
      </nav>

      {dashboard ?? <section id="center">
        <div className="hero">
          <img src={SPJCLogo} className="base" width="170" height="179" alt="SPJC logo" />
        </div>
        <div>
          <h1>CSC425FA26 Course Project</h1>
          <h1>SPJC</h1> {/*SPJC*/}
          <p>Edit <code>src/App.tsx</code> and save to test <code>HMR</code></p>
        </div>
        {/* <button type="button" className="counter" onClick={() => setCount((count) => count + 1)}>
          Count is {count}
        </button> */}
      </section>}
      <section id="spacer">
        
      </section>
    </>
  )
}

export default App
