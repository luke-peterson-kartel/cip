import { Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { ProjectsPage } from './features/projects/ProjectsPage'
import { ProjectDetailPage } from './features/projects/ProjectDetailPage'
import { JobDetailPage } from './features/jobs/JobDetailPage'
import { ConversationPage } from './features/request-agent/ConversationPage'
import { UsersPage } from './features/users/UsersPage'
import { AuditLogPage } from './features/audit/AuditLogPage'
import { OrganizationSettingsPage } from './features/organizations/OrganizationSettingsPage'
import { ProfilePage } from './features/auth/ProfilePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:projectId/*" element={<ProjectDetailPage />} />
        <Route path="jobs/:jobId" element={<JobDetailPage />} />
        <Route path="projects/:projectId/conversations/:conversationId" element={<ConversationPage />} />
        <Route path="settings/organization" element={<OrganizationSettingsPage />} />
        <Route path="settings/users" element={<UsersPage />} />
        <Route path="settings/profile" element={<ProfilePage />} />
        <Route path="audit" element={<AuditLogPage />} />
      </Route>
    </Routes>
  )
}

export default App
