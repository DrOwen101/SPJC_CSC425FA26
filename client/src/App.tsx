import { useState } from 'react'
import SPJCLogo from './assets/SPJCLogo.jpg'
import StudentDashboard from './Dashboardstudent'
import FacultyDashboard from './Dashboardfaculty'
import studentDashHTML from './studentdash.html?url'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [showDashboard, setShowDashboard] = useState(false)

  return (
    <>
      <nav className="navbar" aria-label="Main navigation">
        <a className="navbar-brand" href="#center">My Website</a>
        <ul className="navbar-links">
          <li><a href="#center" onClick={() => setShowDashboard(false)}>Home</a></li>
          <li><a href="#next-steps">About</a></li>
          <li><a href="#social">Contact</a></li>
          <li>
            <button type="button" onClick={() => { window.location.href = studentDashHTML }}>
              StudentDashHTML
            </button>
          </li>
          <li>
            <button type="button" onClick={() => setShowDashboard(true)}>
              StudentDashboard
            </button>

            <button type="button" onClick={() => setShowDashboard(true)}>
              FacultyDashboard
            </button>

            <button type="button" onClick={() => setShowDashboard(true)}>
              AdminDashboard
            </button>
          </li>
        </ul>
      </nav>

      {showDashboard ? <StudentDashboard /> : <section id="center">
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
