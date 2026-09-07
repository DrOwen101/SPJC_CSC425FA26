import { useState } from 'react'
import SPJCLogo from './assets/SPJCLogo.jpg'
import Dashboard from './Dashboardstudent'
import AdminDashboard from './Dashboardadmin'
import FacultyDashboard from './Dashboardfaculty'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [activeDashboard, setActiveDashboard] = useState<'student' | 'admin' | 'faculty' | ''>('')

  return (
    <>
      <nav className="navbar" aria-label="Main navigation">
        <a className="navbar-brand" href="#center">My Website</a>
        <ul className="navbar-links">
          <li><a href="#center" onClick={() => setActiveDashboard('')}>Home</a></li>
          <li><a href="#next-steps">About</a></li>
          <li><a href="#social">Contact</a></li>
          <li>
            <details className="navbar-dashboard-menu">
              <summary>Dashboards</summary>
              <div>
                <button type="button" onClick={() => setActiveDashboard('student')}>Student Dashboard</button>
                <button type="button" onClick={() => setActiveDashboard('admin')}>Admin Dashboard</button>
                <button type="button" onClick={() => setActiveDashboard('faculty')}>Faculty Dashboard</button>
              </div>
            </details>
          </li>
        </ul>
      </nav>

      {activeDashboard === 'student' ? <Dashboard /> :
       activeDashboard === 'admin' ? <AdminDashboard /> :
       activeDashboard === 'faculty' ? <FacultyDashboard /> : <section id="center">
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
      </section>}
      <section id="spacer">
        
      </section>
    </>
  )
}

export default App
