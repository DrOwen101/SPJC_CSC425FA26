import { useState, type FormEvent } from 'react'
import { facultyError, facultyLogin, type FacultyProfile } from './facultyApi'

export default function FacultyLogin({ onSignedIn }: { onSignedIn: (faculty: FacultyProfile) => void }) {
    const [email, setEmail] = useState('')
    const [passcode, setPasscode] = useState('')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setBusy(true)
        setError('')
        try {
            onSignedIn(await facultyLogin(email, passcode))
        } catch (requestError) {
            setError(facultyError(requestError))
            setBusy(false)
        }
    }

    return (
        <section className="dashboard-card faculty-card" aria-labelledby="faculty-login-heading">
            <h2 id="faculty-login-heading">Faculty sign-in</h2>
            <p>These features are for faculty only. The server checks your sign-in on every request.</p>
            <form onSubmit={handleSubmit}>
                <div className="faculty-form-row">
                    <div>
                        <label htmlFor="faculty-email">Email</label>
                        <input id="faculty-email" type="email" required value={email} autoComplete="off"
                            onChange={(event) => setEmail(event.target.value)} />
                    </div>
                    <div>
                        <label htmlFor="faculty-passcode">Passcode</label>
                        <input id="faculty-passcode" type="password" required value={passcode} autoComplete="off"
                            onChange={(event) => setPasscode(event.target.value)} />
                    </div>
                    <button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
                </div>
            </form>
            {error && <p role="alert" className="field-error">{error}</p>}
        </section>
    )
}