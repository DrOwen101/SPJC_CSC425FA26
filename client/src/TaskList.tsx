import { Willow } from '@svar-ui/react-core'
import { Tasklist } from '@svar-ui/react-tasklist'

import '@svar-ui/react-core/style.css'
import '@svar-ui/react-tasklist/style.css'

const initialTasks = [
  {
    id: 7,
    content: 'Grade CSC425 HARs',
    status: 1,
  },
  {
    id: 8,
    content: 'Beg administration to turn heat on in Business Building',
    status: 0,
  },
]

function TaskList() {
  const storageKey = 'facultyTasks'

  const savedTasks = localStorage.getItem(storageKey)
  const value = savedTasks
    ? JSON.parse(savedTasks)
    : initialTasks

  return (
    <section id="task-list" className="dashboard-card task-list">
      <h2>Task List</h2>
        <Willow>
          <Tasklist
            value={value}
            onChange={({ value }) => {
              localStorage.setItem(storageKey, JSON.stringify(value))
            }}
          />
        </Willow>
        </section>
  )
}

export default TaskList