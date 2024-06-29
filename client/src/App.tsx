import { Toaster } from '@/components/ui/toaster'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/home/home'
import { AdminPage } from './pages/admin/admin'
import { DownloadsPage } from './pages/downloads/downloads'
import { Members } from './pages/admin/members'
import { Files } from './pages/admin/files'
import { Messages } from './pages/admin/messages'
import { NotFound } from './components/not-found'
import { Users } from './pages/admin/users'
import { ClientConfigProvider } from './contexts/client-config-context'

function App() {
  return (
    <ClientConfigProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<HomePage/>}/>
          <Route path='downloads' element={<DownloadsPage/>}/>
          <Route path='admin' element={<AdminPage/>}>
            <Route path='' element={<Navigate to="files" replace/>}/>
            <Route path='files' element={<Files/>}/>
            <Route path='members' element={<Members/>}/>
            <Route path='messages' element={<Messages/>}/>
            <Route path='users' element={<Users/>}/>
          </Route>
          <Route path='*' element={<NotFound/>}/>
        </Routes>
      </BrowserRouter>
      <Toaster/>
    </ClientConfigProvider>
  )
}

export default App
