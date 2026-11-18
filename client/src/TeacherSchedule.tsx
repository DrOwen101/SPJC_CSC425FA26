import { useEffect, useState } from "react";
import axios from "axios";

export default function TeachingSchedule() {
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        axios.get("http://localhost:3000/api/teaching-schedule")
            .then((response) => {
                setSchedule(response.data);
            })
            .catch(() => {
                setError("Unable to load teaching schedule.");
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    if (loading) return <p>Loading schedule...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div>
            <h2>Teaching Schedule</h2>
            <table>
                <thead>
                    <tr>
                        <th>Course</th>
                        <th>Teacher</th>
                        <th>Day</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Room</th>
                    </tr>
                </thead>

                <tbody>
                    {schedule.map((course) => (
                        <tr key={course.schedule_id}>
                            <td>{course.course_code}</td>
                            <td>{course.teacher_id}</td>
                            <td>{course.day_of_week}</td>
                            <td>{course.start_time}</td>
                            <td>{course.end_time}</td>
                            <td>{course.room}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

