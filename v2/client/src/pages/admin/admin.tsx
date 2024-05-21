import { AppFooter } from "@/components/app-footer"
import { NavHeader } from "@/components/nav-header"
import { RequireLogin } from "@/components/require-login"
import { UserLoginProvider, useUserProfile } from "@/contexts/user-login-context"
import { Outlet } from "react-router-dom"

const Inner = () => {
  const {logout, profile} = useUserProfile()
  const links = profile  && profile.role == 'admin' ? {
    "Files": '/admin/files',
    "Members": '/admin/members',
    "Messages": '/admin/messages'
  } : undefined

  return (<>
    <NavHeader title="Site Admin" links={links} logout={profile ? logout : undefined}/>
    <div className="flex flex-col min-h-screen">
    <RequireLogin withRole='admin'>
      <main className="download-page pt-20">
        <h1 className="sr-only">Downloads</h1>
        <section id="admin" className="w-full px-8 py-16 lg:px-32">
          <Outlet/>
        </section>
      </main>
    </RequireLogin>
    <AppFooter/>
    </div>
   </>)
}

export const AdminPage = () => {
  return (
    <UserLoginProvider><Inner/></UserLoginProvider>
  )
}