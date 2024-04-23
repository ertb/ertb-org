import './App.css'
import { Toaster } from 'sonner'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/home/home'
import { AdminPage } from './pages/admin/admin'
import { UserLoginProvider } from './contexts/user-login-context'

function App() {
  return (
    <>
    <UserLoginProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<HomePage/>}/>
          <Route path='/admin' element={<AdminPage/>}/>
        </Routes>
      </BrowserRouter>
    </UserLoginProvider>
    <Toaster/>
    </>
  )
}

export default App
