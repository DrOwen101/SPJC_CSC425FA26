import { useEffect, useId, useState } from 'react'
import {getFaculty} from './facultyAPI'

export default function FacultyLookup(){
    const [facultyID, setFacultyID] = useState('')


    return(
        <form onSubmit={restrictCourses} noValidate>
        <label htmlFor={`${labelId}-student-name`}>Employee Number</label>
        <div className="transcript-card-controls">
          <input
            id={`${labelId}-student-name`}
            name="studentName"
            type="text"
            autoComplete="off"
            value={facultyID}
            onChange={(event) => {
              setFacultyID(event.target.value)
              setInputError('')
            }}
            aria-describedby={`${labelId}-help${inputError ? ` ${labelId}-input-error` : ''}`}
            aria-invalid={inputError ? true : undefined}
          />
          <button type="submit">Search</button>
        </div>
        <p id={`${labelId}-help`} className="transcript-card-help">Enter the starting letter as well.</p>
        {inputError && <p id={`${labelId}-input-error`} className="transcript-card-error" role="alert">{inputError}</p>}
      </form>
    )
}