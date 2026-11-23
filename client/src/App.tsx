import { useCallback, useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import SPJCLogo from './assets/SPJCLogo.jpg'
import Dashboardadmin from './Dashboardadmin'
import Dashboardfaculty from './Dashboardfaculty'
import Dashboardstudent from './Dashboardstudent'
import { PopOutWindow } from './PopOutWindow'
import { verifyInstructorCode } from './instructorCodeAPI'

// A union type restricts role values to these three strings.
type DashboardRole = 'student' | 'faculty' | 'admin'

// Match both page links and section links, so refresh and Back/Forward work.
// These IDs must match the id attributes in the three dashboard components.
function getRole(hash: string): DashboardRole | null {
  const id = hash.slice(1)
  if (['student-dashboard', 'all-students', 'weather', 'student-records', 'student-lookup', 'gpa', 'attendance', 'transcript'].includes(id)) return 'student'
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
  const [hash, setHash] = useState(() => window.location.hash)
  const [isFacultyAuthorized, setIsFacultyAuthorized] = useState(false)
  const requestedDashboard = getRole(hash)
  const activeDashboard = requestedDashboard === 'faculty' && !isFacultyAuthorized
    ? null
    : requestedDashboard
  const dashboard = getDashboard(activeDashboard)
  const contentId = activeDashboard ? `${activeDashboard}-dashboard` : 'center'
  const [isAccessOpen, setIsAccessOpen] = useState(false)
  const [instructorCode, setInstructorCode] = useState('')
  const [verificationMessage, setVerificationMessage] = useState('')
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)
  const [popupError, setPopupError] = useState('')
  const popupWindow = useRef<Window | null>(null)
  const activePopupWindow = isAccessOpen ? popupWindow.current : null

  const closeFacultyAccess = useCallback(() => {
    popupWindow.current = null
    setIsAccessOpen(false)
    setInstructorCode('')
    setVerificationMessage('')
  }, [])

  function openFacultyAccess(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()
    setIsFacultyAuthorized(false)
    if (window.location.hash !== '#center') window.location.hash = '#center'

    if (popupWindow.current && !popupWindow.current.closed) {
      popupWindow.current.focus()
      return
    }

    const newWindow = window.open('', 'faculty-access', 'width=520,height=420,resizable=yes,scrollbars=yes')
    if (!newWindow) {
      setPopupError('The pop-up was blocked. Allow pop-ups for this site and try again.')
      return
    }

    newWindow.document.title = 'Faculty Access'
    popupWindow.current = newWindow
    setPopupError('')
    setInstructorCode('')
    setVerificationMessage('')
    setIsAccessOpen(true)
  }

  async function handleInstructorCodeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isVerifyingCode) return

    setIsVerifyingCode(true)
    setVerificationMessage('')
    try {
      const isValid = await verifyInstructorCode(instructorCode)
      if (!isValid) {
        setIsFacultyAuthorized(false)
        setInstructorCode('')
        setVerificationMessage('Access Denied')
        if (window.location.hash !== '#center') window.location.hash = '#center'
        return
      }

      setIsFacultyAuthorized(true)
      closeFacultyAccess()
      if (window.location.hash !== '#faculty-dashboard') window.location.hash = '#faculty-dashboard'
    } catch {
      setVerificationMessage('Unable to verify the instructor code. Check the connection and try again.')
    } finally {
      setIsVerifyingCode(false)
    }
  }

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
    if (requestedDashboard === 'faculty' && !isFacultyAuthorized) {
      if (window.location.hash !== '#center') window.location.hash = '#center'
      return
    }

    const target = document.getElementById(hash.slice(1))
    if (target) {
      target.focus({ preventScroll: true })
      target.scrollIntoView({ block: 'start' })
    }
    document.title = activeDashboard
      ? `${activeDashboard[0].toUpperCase()}${activeDashboard.slice(1)} Dashboard | CSC425FA26`
      : 'San Pedro Junior College | SPJC'
  }, [hash, activeDashboard, requestedDashboard, isFacultyAuthorized])

  return (
    <>
      {/* First keyboard stop: bypass repeated navigation. CSS reveals on focus. */}
      <a className="skip-link" href={`#${contentId}`}>Skip to main content</a>
      <nav className="navbar" aria-label="Main navigation">
        <a className="navbar-brand" href="#center">SPJC</a>
        {/* aria-current announces the selected page. CSS also adds an underline
            and border, so selection is communicated by more than color alone. */}
        <ul className="navbar-links">
          <li><a href="#center" aria-current={activeDashboard === null ? 'page' : undefined}>Home</a></li>
          <li><a href="#student-dashboard" aria-current={activeDashboard === 'student' ? 'page' : undefined}>Student</a></li>
          <li><a href="#faculty-dashboard" aria-current={activeDashboard === 'faculty' ? 'page' : undefined}
            onClick={openFacultyAccess}>Faculty</a></li>
          <li><a href="#admin-dashboard" aria-current={activeDashboard === 'admin' ? 'page' : undefined}>Admin</a></li>
        </ul>
      </nav>
      {popupError && <p role="alert" className="field-error">{popupError}</p>}
      {activePopupWindow && (
        <PopOutWindow popupWindow={activePopupWindow} title="Faculty Access" onClose={closeFacultyAccess}>
          <main className="faculty-access" aria-labelledby="faculty-access-heading">
            <h1 id="faculty-access-heading">Faculty Dashboard Access</h1>
            <p>Enter your instructor code to continue.</p>
            <form onSubmit={handleInstructorCodeSubmit}>
              <label htmlFor="faculty-instructor-code">Instructor code</label>
              <input id="faculty-instructor-code" type="password" autoComplete="off" maxLength={4}
                required value={instructorCode} disabled={isVerifyingCode}
                onChange={(event) => setInstructorCode(event.target.value)} />
              <button type="submit" disabled={isVerifyingCode}>
                {isVerifyingCode ? 'Checking…' : 'Continue'}
              </button>
              <button type="button" disabled={isVerifyingCode} onClick={closeFacultyAccess}>Cancel</button>
            </form>
            {verificationMessage && <p role="alert">{verificationMessage}</p>}
          </main>
        </PopOutWindow>
      )}

      {/* Only one main landmark renders at a time, including on the home page. */}
      {dashboard ?? (
        <main id="center" aria-labelledby="home-title" tabIndex={-1}>
          <div className="hero">
            <img src={SPJCLogo} className="base" width="170" height="179" alt="SPJC logo" />
          </div>
          <div>
            <p className="eyebrow">CSC425FA26 Course Project</p>
            <h1 id="home-title">San Pedro Junior College</h1>
            <p>Choose Student, Faculty, or Admin to explore a dashboard.</p>
          </div>
        </main>
      )}
    </>
  )
}

export default App