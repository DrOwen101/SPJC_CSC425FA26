import { useEffect, useState } from 'react'
import axios from 'axios'

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
    const [error, setError] = useState('')

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
        <section>
            <h2>Current Alerts</h2>

            {isLoading && <p>Loading alerts...</p>}

            {error && <p style={{ color: 'red' }}>{error}</p>}

            {!isLoading && !error && alerts.length === 0 && (
                <p>No current alerts.</p>
            )}

            {alerts.length > 0 && (
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
            )}
        </section>
    )
}

export default AlertsDatabase