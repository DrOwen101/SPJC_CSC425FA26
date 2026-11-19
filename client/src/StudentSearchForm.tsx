import type { SubmitEvent } from 'react'
import './StudentLookup.css'

type Props = {
  inputId: string
  helpId: string
  value: string
  label: string
  inputError: string
  onChange: (value: string) => void
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void
  maxLength?: number
}

export default function StudentSearchForm({ inputId, helpId, value, label, inputError, onChange, onSubmit, maxLength }: Props) {
  const errorId = inputId === 'student-name' ? 'lookup-input-error' : `${inputId}-error`
  return (
    <>
      <form onSubmit={onSubmit} noValidate>
        <label htmlFor={inputId}>{label}</label>
        <div className="student-lookup-controls">
          <input
            id={inputId}
            name="studentName"
            type="text"
            autoComplete="off"
            value={value}
            maxLength={maxLength}
            onChange={(event) => onChange(event.target.value)}
            aria-describedby={inputError ? `${helpId} ${errorId}` : helpId}
            aria-invalid={inputError ? true : undefined}
          />
          <button type="submit">Search</button>
        </div>
      </form>
      {inputError && <p id={errorId} className="field-error" role="alert">{inputError}</p>}
    </>
  )
}
