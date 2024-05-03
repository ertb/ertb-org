import { Toaster } from 'sonner'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/home/home'
import { AdminPage } from './pages/admin/admin'
import { DownloadsPage } from './pages/downloads/downloads'

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<HomePage/>}/>
          <Route path='/downloads' element={<DownloadsPage/>}/>
          <Route path='/admin' element={<AdminPage/>}/>
        </Routes>
      </BrowserRouter>
    <Toaster/>
    </>
  )
}

export default App
