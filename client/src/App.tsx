import { useEffect, useState } from 'react'
import SPJCLogo from './assets/SPJCLogo.jpg'
import './App.css'

import StudentDashboard from './StudentDashboard'
import FacultyDashboard from './FacultyDashboard'
import AdminDashboard from './AdminDashboard'

function App() {
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(window.location.hash)

  useEffect(() => {
    const handleHashChange = () => {
      setPage(window.location.hash)
    }

    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  return (
    <>
      <nav className="navbar" aria-label="Main navigation">
        <a className="navbar-brand" href="#home">
          SPJC
        </a>

        <ul className="navbar-links">
          <li>
            <a href="#home">Home</a>
          </li>
          <li>
            <a href="#student">Student</a>
          </li>
          <li>
            <a href="#faculty">Faculty</a>
          </li>
          <li>
            <a href="#admin">Admin</a>
          </li>
        </ul>
      </nav>

      <main>
        {page === '#student' && <StudentDashboard />}

        {page === '#faculty' && <FacultyDashboard />}

        {page === '#admin' && <AdminDashboard />}

        {(page === '' || page === '#home') && (
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
              <h2>SPJC</h2>
            </div>

            <button
              type="button"
              className="counter"
              onClick={() => setCount((count) => count + 1)}
            >
              Count is {count}
            </button>
          </section>
        )}
      </main>
    </>
  )
}

export default App