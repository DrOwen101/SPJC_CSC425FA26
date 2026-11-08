import {useEffect, useRef, useState, type SubmitEvent} from 'react'
import axios from 'axios'

type Student = {
    id: number
    first_name: string
    last_name: string
    email: string
    major_id: string
    major_code: string
    major_name: string
    enrollment_year: number
    is_active: boolean
}

type StudentResponse = {
    student: Student
}

export default function StudentDatabase() {
    const [searchId, setSearchId] = useState('')
    const [student, setStudent] = useState<Student | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const activeRequest = useRef<AbortController | null>(null)
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [major, setMajor] = useState('')
    const [enrollmentYear, setEnrollmentYear] = useState('')
    const [isActive, setIsActive] = useState(true)

    useEffect(() => {
        return () => activeRequest.current?.abort()
    }, [])

    function loadStudent(student: Student) {
        setStudent(student)
        setFirstName(student.first_name)
        setLastName(student.last_name)
        setEmail(student.email)
        setMajor(String(student.major_id))
        setEnrollmentYear(student.enrollment_year.toString())
        setIsActive(student.is_active)
    }

    async function lookupStudent(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault()
        activeRequest.current?.abort() // Cancel any ongoing request

        activeRequest.current = new AbortController()

        setIsLoading(true)
        setError('')
        setStudent(null)

        try {
            const response = await axios.get<StudentResponse>(`http://localhost:3000/api/database/students/${searchId}`, {
                signal: activeRequest.current?.signal,
            })

            console.log(response.data.student) 
            loadStudent(response.data.student)
        } catch (requestError) {
            if (axios.isCancel(requestError)) {
                setError('Request canceled')
            } else {
                console.error('Error fetching student data:', requestError)
                setError('Error fetching student data')
            }
        } finally {
            setIsLoading(false)
        }
    }

    async function createStudent(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault()
        activeRequest.current?.abort() // Cancel any ongoing request

        activeRequest.current = new AbortController()

        setIsLoading(true)
        setError('')
        setStudent(null)

        try {
            const response = await axios.post<StudentResponse>('http://localhost:3000/api/database/students/', {
                first_name: firstName,
                last_name: lastName,
                email: email,
                major_code: major,
                enrollment_year: Number(enrollmentYear),
                is_active: isActive,
            }, {
                signal: activeRequest.current?.signal,
            })

            console.log(response.data.student)
            loadStudent(response.data.student)
        } catch (requestError) {
            if (axios.isCancel(requestError)) {
                setError('Request canceled')
            } else {
                console.error('Error creating student data:', requestError)
                setError('Error creating student data')
            }
        } finally {
            setIsLoading(false)
        }
    }

    async function deleteStudent() {
        if (!student) return

        try {
            await axios.delete(`http://localhost:3000/api/database/students/${student.id}`)
            setStudent(null)
        } catch (error) {
            console.error('Error deleting student data:', error)
            setError('Error deleting student data')
        }
    }

    async function updateStudent(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault()
        
        if (!student) return

        try {
            const response = await axios.put<StudentResponse>(`http://localhost:3000/api/database/students/${student.id}`, {
                first_name: student.first_name,
                last_name: student.last_name,
                email: student.email,
                major_code: student.major_code,
                enrollment_year: student.enrollment_year,
                is_active: student.is_active,
            },
        )

            console.log(response.data.student)
            loadStudent(response.data.student)
        } catch (requestError) {
            if (axios.isCancel(requestError)) {
                setError('Request canceled')
            } else {
                console.error('Error updating student data:', requestError)
                setError('Error updating student data')
            }
        }
    }

return (
    <div>
        <h1>Student Records</h1>
        <form onSubmit={lookupStudent}>
            <input
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Enter student ID"
            />
            <button type="submit" disabled={isLoading}>Search</button>
        </form>

        {error && <p role="alert" style={{ color: 'red' }}>{error}</p>}

        {/* working on a way to combine search results with the create student form so that the user can edit the student record after searching for it. */}

        <div id="search-results">
            {student && (
                <div>
                    <form onSubmit={updateStudent}>
                        <input type="text" value={student.first_name} onChange={(e) => setStudent({...student, first_name: e.target.value})} />
                        <input type="text" value={student.last_name} onChange={(e) => setStudent({...student, last_name: e.target.value})} />
                        <input type="text" value={student.email} onChange={(e) => setStudent({...student, email: e.target.value})} />
                        <input type="text" value={student.major_code} onChange={(e) => setStudent({...student, major_code: e.target.value})} />
                        <input type="text" value={student.major_name} readOnly />
                        <input type="number" value={student.enrollment_year} onChange={(e) => setStudent({...student, enrollment_year: Number(e.target.value)})} />
                        <input type="checkbox" checked={student.is_active} onChange={(e) => setStudent({...student, is_active: e.target.checked})} />
                        <label htmlFor="is-active">Active</label>
                        <button type="submit" disabled={isLoading}>Update Student</button>
                        <button type="button" onClick={() => setStudent(null)}>Clear</button>
                        <button type="button" onClick={deleteStudent} disabled={isLoading}>Delete Student</button>
                    </form>
                </div>
            )}
        </div>
        <form onSubmit={createStudent}>
            <h2>Create New Student</h2>
            <input type="text" placeholder="First Name" onChange={(e) => setFirstName(e.target.value)} />
            <input type="text" placeholder="Last Name" onChange={(e) => setLastName(e.target.value)} />
            <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
            <input type="text" placeholder="Major" onChange={(e) => setMajor(e.target.value)} />
            <input type="number" placeholder="Enrollment Year"  onChange={(e) => setEnrollmentYear(e.target.value)} />
            <input type="checkbox" id="is-active" onChange={(e) => setIsActive(e.target.checked)} />
            <label htmlFor="is-active">Active</label>
            <button type="submit" disabled={isLoading}>Create Student</button>
        </form>
    </div>
)
}
