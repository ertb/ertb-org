import { RequireLogin } from "@/components/require-login"
import { Button } from "@/components/ui/button"
import { useUserProfile } from "@/contexts/user-login-context"

export const AdminPage = () => {
  const {logout} = useUserProfile()

  return (
    <RequireLogin withRole='admin'>
      <main>
        <h1>Welcome to the Admin Page</h1>
        <Button onClick={logout}>Logout</Button>
      </main>
    </RequireLogin>
  )
}