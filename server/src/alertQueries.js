import { pool } from './db.js';

export async function getAllAlerts() {
    const result = await pool.query('SELECT * FROM alerts_db.alerts WHERE is_read = FALSE ORDER BY created_at DESC');
    return result.rows;
}

export async function getAlertById(alertID) {
    const result = await pool.query('SELECT * FROM alerts_db.alerts WHERE id = $1', [alertID]);
    return result.rows[0];
}

export async function createAlert(alert) {
    const { subject, message } = alert;
    const result = await pool.query(
        'INSERT INTO alerts_db.alerts (subject, message) VALUES ($1, $2) RETURNING *',
        [subject, message]
    );
    return result.rows[0];
}

export async function markAlertRead(alertID) {
    const result = await pool.query(
        'UPDATE alerts_db.alerts SET is_read = TRUE WHERE id = $1 RETURNING *', [alertID]
    )

    return result.rows[0]
}