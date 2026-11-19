import { useEffect, useState, type FormEvent } from 'react'
import axios from 'axios'
import './alertsDb.css'

type Alert = {
    id: number
    subject: string
    message: string
    created_at: string
    is_read: boolean
}

function AlertsDatabase() {
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [subject, setSubject] = useState('')
    const [message, setMessage] = useState('')

    async function createAlert(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        setIsSubmitting(true)
        setError('')

        try {
            const response = await axios.post<{ alert: Alert }>(
                'http://localhost:3000/api/database/alerts',
                {
                    subject: subject.trim(),
                    message: message.trim(),
                }
            )

            setAlerts((currentAlerts) => [
                response.data.alert,
                ...currentAlerts,
            ])
            setSubject('')
            setMessage('')
        } catch (requestError) {
            if (axios.isAxiosError(requestError) && requestError.response) {
                setError(requestError.response.data.message ?? 'Unable to add the alert.')
            } else {
                setError('Unable to add the alert.')
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    async function markAsRead(alertId: number) {
    try {
        await axios.patch(
            `http://localhost:3000/api/database/alerts/${alertId}/read`
        )

        setAlerts((currentAlerts) =>
            currentAlerts.filter((alert) => alert.id !== alertId)
        )
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            setError(error.response.data.message ?? 'Unable to update alert.')
        } else {
            setError('Unable to mark the alert as read.')
        }
    }
    }

    useEffect(() => {
        const controller = new AbortController()

    async function loadAlerts() {
        setIsLoading(true)
        setError('')

        try {
            const response = await axios.get(
                'http://localhost:3000/api/database/alerts_db',
                { signal: controller.signal }
            )

            setAlerts(response.data.alerts)
        } catch (error) {
            if (axios.isCancel(error)) {
                return
            }

            if (axios.isAxiosError(error) && error.response) {
                setError(error.response.data.message ?? 'Unable to load alerts.')
            } else {
                setError('An unexpected error occurred.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    void loadAlerts()

    return () => controller.abort()

    }, [])

    return (
        <section id="faculty-alerts" className="dashboard-card alerts-database">
            <h2>Current Alerts</h2>

            <form className="alerts-database-form" onSubmit={createAlert}>
                <div>
                    <label htmlFor="alert-subject">Subject</label>
                    <input
                        id="alert-subject"
                        name="subject"
                        value={subject}
                        onChange={(event) => setSubject(event.target.value)}
                        maxLength={100}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="alert-message">Message</label>
                    <textarea
                        id="alert-message"
                        name="message"
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        maxLength={255}
                        rows={3}
                        required
                    />
                </div>

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Adding alert...' : 'Add Alert'}
                </button>
            </form>

            {isLoading && <p>Loading alerts...</p>}

            {error && <p className="alerts-database-error" role="alert">{error}</p>}

            {!isLoading && !error && alerts.length === 0 && (
                <p>No current alerts.</p>
            )}

            {alerts.length > 0 && (
                <div className="alerts-database-table-wrapper">
                <table>
                    <caption>Current alerts</caption>
                    <thead>
                        <tr>
                            <th>Subject</th>
                            <th>Message</th>
                            <th>Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {alerts.map((alert) => (
                            <tr key={alert.id}>
                                <td>{alert.subject}</td>
                                <td>{alert.message}</td>
                                <td>
                                    {new Date(alert.created_at).toLocaleString()}
                                </td>
                                <td>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={alert.is_read}
                                        onChange={() => void markAsRead(alert.id)}
                                    />
                                    Mark as read
                                </label>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            )}
        </section>
    )
}

export default AlertsDatabase