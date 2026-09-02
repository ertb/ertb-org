import { AppFooter } from "@/components/app-footer"
import { NavHeader } from "@/components/nav-header"
import { RequireLogin } from "@/components/require-login"
import { AuthRestClientProvider } from "@/contexts/auth-rest-client-context"
import { UserLoginProvider, useUserProfile } from "@/contexts/user-login-context"
import { Outlet } from "react-router-dom"

const Inner = () => {
  const {logout, profile} = useUserProfile()
  const links = profile  && profile.role == 'admin' ? {
    "About": '/admin/about',
    "Files": '/admin/files',
    "Members": '/admin/members',
    "Messages": '/admin/messages',
    "Users": '/admin/users',
  } : undefined

  return (<div className="min-h-screen flex flex-col bg-slate-200">
    <NavHeader title="Site Admin" links={links} logout={profile ? logout : undefined}/>
    <main className="flex-auto flex flex-col">
      <h1 className="sr-only">Site Administration</h1>
      <RequireLogin withRole='admin'>
        <AuthRestClientProvider>
          <section id="admin" className="w-full px-8 py-4 lg:px-32">
            <Outlet/>
          </section>
        </AuthRestClientProvider>
      </RequireLogin>
    </main>
    <AppFooter/>
   </div>)
}

export const AdminPage = () => {
  return (
    <UserLoginProvider><Inner/></UserLoginProvider>
  )
}