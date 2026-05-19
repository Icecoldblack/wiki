import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import CourseExplorer from './course-explorer'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CourseExplorer />
  </StrictMode>,
)
