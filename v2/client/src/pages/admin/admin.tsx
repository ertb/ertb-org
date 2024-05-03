import { AppFooter } from "@/components/app-footer"
import { NavHeader } from "@/components/nav-header"
import { RequireLogin } from "@/components/require-login"
import { Button } from "@/components/ui/button"
import { UserLoginProvider, useUserProfile } from "@/contexts/user-login-context"

const Inner = () => {
  const {logout, profile} = useUserProfile()
  const links = !profile ? {
    "Members": '/admin/members',
    "Files": '/admin/files',
    "Messages": '/admin/messages'
  } : undefined

  return (<>
    <NavHeader title="Site Admin" links={links}/>
    <RequireLogin withRole='admin'>
      <main className="download-page pt-20">
        <h1 className="sr-only">Downloads</h1>
        <section id="admin" className="w-full px-8 py-16 lg:px-32">
        </section>
      </main>
      <footer className="text-right p-4 bg-slate-200">
        <Button onClick={logout}>Logout</Button>
      </footer>
     </RequireLogin>
    <AppFooter/>
   </>)
}

export const AdminPage = () => {
  return (
    <UserLoginProvider><Inner/></UserLoginProvider>
  )
}