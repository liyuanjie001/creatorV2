import { Routes, Route, Navigate } from 'react-router'
import AppShell from './layout/AppShell'
import Inspiration from './pages/Inspiration'
import Notes from './pages/Notes'
import Create from './pages/Create'
import Accounts from './pages/Accounts'
import Analytics from './pages/Analytics'
import Tasks from './pages/Tasks'
import NewTask from './pages/NewTask'
import NewProject from './pages/NewProject'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Assets from './pages/Assets'
import Settings from './pages/Settings'
import Trash from './pages/Trash'
import Profile from './pages/Profile'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/create" replace />} />
        <Route path="/inspiration" element={<Inspiration />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/create" element={<Create />} />
        <Route path="/trends" element={<Navigate to="/inspiration?tab=trends" replace />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/tasks/new" element={<NewTask />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/new" element={<NewProject />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/assets" element={<Assets />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/trash" element={<Trash />} />
        <Route path="/me" element={<Profile />} />
        <Route path="*" element={<Navigate to="/create" replace />} />
      </Route>
    </Routes>
  )
}
