import { useUserProfile } from "@/contexts/user-login-context"

export const AdminPage = () => {
  const {profile, LoginButton} = useUserProfile()

  return (<main>
    <LoginButton/>

    <h1>Welcome to the Admin Page</h1>
    <pre className='text-left'>{JSON.stringify(profile,null,2)}</pre>
  </main>)
}