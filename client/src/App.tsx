import { Toaster } from '@/components/ui/toaster'
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'
import { HomePage } from './pages/home/home'
import { AdminPage } from './pages/admin/admin'
import { DownloadsPage } from './pages/downloads/downloads'
import { Members } from './pages/admin/members'
import { Files } from './pages/admin/files'
import { Messages } from './pages/admin/messages'
import { About } from './pages/admin/about'
import { NotFound } from './components/not-found'
import { Users } from './pages/admin/users'
import { ClientConfigProvider } from './contexts/client-config-context'

// a data router is required for useBlocker (used by the About editor to block navigation
// away from unsaved changes)
const router = createBrowserRouter([
  { path: '/', element: <HomePage/> },
  { path: 'downloads', element: <DownloadsPage/> },
  {
    path: 'admin',
    element: <AdminPage/>,
    children: [
      { index: true, element: <Navigate to="files" replace/> },
      { path: 'files', element: <Files/> },
      { path: 'about', element: <About/> },
      { path: 'members', element: <Members/> },
      { path: 'messages', element: <Messages/> },
      { path: 'users', element: <Users/> },
    ],
  },
  { path: '*', element: <NotFound/> },
])

function App() {
  return (
    <ClientConfigProvider>
      <RouterProvider router={router}/>
      <Toaster/>
    </ClientConfigProvider>
  )
}

export default App
