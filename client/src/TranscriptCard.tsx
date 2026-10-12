import { useEffect, useId, useState, type FormEvent } from "react";
import axios from "axios";
import "./TranscriptCard.css";
import { isTranscript, type Transcript } from "./transcriptApi";

// By default, connect to the API on the same computer as the frontend.
// For a separately hosted API, set VITE_API_BASE_URL or pass apiBaseUrl.
const defaultApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:3000`;

type TranscriptCardProps = {
  id?: string;
  apiBaseUrl?: string;
};

// The async Axios request is below; transcriptApi.ts contains only data types and validation.
function TranscriptCard({
  id,
  apiBaseUrl = defaultApiBaseUrl,
}: TranscriptCardProps) {
  const labelId = useId();
  const [studentID, setStudentID] = useState("1001");
  const [request, setRequest] = useState({ studentID: "1001" });
  const [result, setResult] = useState({
    transcript: null as Transcript | null,
    isLoading: true,
    error: "",
  });
  const { transcript, isLoading, error } = result;
  const [inputError, setInputError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setResult({ transcript: null, isLoading: true, error: "" });

    const timeout = window.setTimeout(() => {
      controller.abort();
      setResult({
        transcript: null,
        isLoading: false,
        error: "The transcript request timed out. Please try again.",
      });
    }, 15000);

    async function getTranscript() {
      try {
        // Call the Express GET /api/transcripts/:studentID route in the server folder.
        // await waits for the response; Axios puts the parsed JSON in response.data.
        const response = await axios.get<unknown>(
          `${apiBaseUrl.replace(/\/$/, "")}/api/transcripts/${request.studentID}`,
          { signal: controller.signal },
        );
        if (controller.signal.aborted) return;
        const transcript = response.data;
        if (
          !isTranscript(transcript) ||
          transcript.studentID !== request.studentID
        ) {
          throw new Error(
            "The transcript service returned an unexpected response. Please try again.",
          );
        }
        setResult({ transcript, isLoading: false, error: "" });
      } catch (requestError) {
        if (controller.signal.aborted) return;
        let error = "Unable to load the transcript. Please try again.";
        // Axios rejects HTTP errors (such as 404) as well as network failures.
        if (axios.isAxiosError(requestError)) {
          const status = requestError.response?.status;
          if (status === 404)
            error = `No mock student was found with student ID ${request.studentID}. Try 1001–1005.`;
          else if (status)
            error = `The transcript request failed (HTTP ${status}). Please try again.`;
          else
            error =
              "Unable to reach the transcript service. Check your connection and try again.";
        } else if (requestError instanceof Error) {
          error = requestError.message;
        }
        setResult({ transcript: null, isLoading: false, error });
      } finally {
        window.clearTimeout(timeout);
      }
    }

    void getTranscript();

    // Cancel when leaving the dashboard or starting another request, so an
    // older response cannot overwrite the currently requested student's data.
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [apiBaseUrl, request]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;
    const nextStudentID = studentID.trim();
    if (!/^\d{4}$/.test(nextStudentID)) {
      setInputError("Enter a four-digit student ID, such as 1001.");
      return;
    }

    setInputError("");
    setStudentID(nextStudentID);
    // A new request object also lets the same ID be loaded again after an error.
    setRequest({ studentID: nextStudentID });
  }

  let status = "No transcript loaded.";
  if (isLoading) status = `Loading transcript for ${request.studentID}…`;
  else if (transcript)
    status = `Transcript loaded for ${transcript.firstName} ${transcript.lastName}.`;

  return (
    <section
      id={id}
      className="transcript-card"
      aria-labelledby={`${labelId}-heading`}
      tabIndex={-1}
    >
      <h2 id={`${labelId}-heading`}>Student Transcript</h2>

      <form onSubmit={handleSubmit}>
        <label htmlFor={`${labelId}-student`}>Student ID</label>
        <input
          id={`${labelId}-student`}
          type="text"
          value={studentID}
          onChange={(event) => setStudentID(event.target.value)}
          aria-invalid={Boolean(inputError)}
          aria-describedby={inputError ? `${labelId}-error` : undefined}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Loading..." : "Get Transcript"}
        </button>
      </form>

      {inputError && (
        <p id={`${labelId}-error`} role="alert">
          {inputError}
        </p>
      )}

      <p role="status">{status}</p>

      {error && <p role="alert">{error}</p>}

      {transcript && (
        <div>
          <h3>
            {transcript.firstName} {transcript.lastName}
          </h3>
          <p>Student ID: {transcript.studentID}</p>
          <p>Major: {transcript.major}</p>
          <p>Institution: {transcript.institution}</p>

          {transcript.isMockData && (
            <p>This transcript contains mock student data.</p>
          )}

          {transcript.semesters.map((semester, index) => (
            <section key={`${semester.term}-${index}`}>
              <h4>{semester.term}</h4>

              <table>
                <caption>Courses for {semester.term}</caption>
                <thead>
                  <tr>
                    <th scope="col">Course</th>
                    <th scope="col">Title</th>
                    <th scope="col">Credits</th>
                    <th scope="col">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {semester.courses.map((course, courseIndex) => (
                    <tr key={`${course.courseCode}-${courseIndex}`}>
                      <td>{course.courseCode}</td>
                      <td>{course.courseTitle}</td>
                      <td>{course.creditHours}</td>
                      <td>{course.grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p>Credits Attempted: {semester.creditsAttempted}</p>
              <p>Credits Earned: {semester.creditsEarned}</p>
              <p>Term GPA: {semester.gpa.toFixed(2)}</p>
            </section>
          ))}

          <h3>Academic Summary</h3>
          <p>Credits Attempted: {transcript.summary.creditsAttempted}</p>
          <p>Credits Earned: {transcript.summary.creditsEarned}</p>
          <p>Cumulative GPA: {transcript.summary.cumulativeGPA.toFixed(2)}</p>
        </div>
      )}
    </section>
  );
}

export default TranscriptCard;
