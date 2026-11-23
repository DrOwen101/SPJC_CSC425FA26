import { useEffect, useState } from 'react'
import { errorMessage } from './apiClient'
import { getRoster, type RosterEntry } from './facultyApi'

// Lab 12: loads one section's roster from the server. `refreshKey` changes
// after a grade is saved, so every card shows the stored values.
export function useRoster(sectionId: number | null, refreshKey: number) {
  const [roster, setRoster] = useState<RosterEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (sectionId === null) return
    let current = true
    setLoading(true)
    setError('')
    getRoster(sectionId)
      .then((rows) => { if (current) setRoster(rows) })
      .catch((requestError) => {
        if (current) {
          setRoster([])
          setError(errorMessage(requestError))
        }
      })
      .finally(() => { if (current) setLoading(false) })
    // A newer section choice replaces an older request's result.
    return () => { current = false }
  }, [sectionId, refreshKey])

  return { roster, setRoster, loading, error }
}
