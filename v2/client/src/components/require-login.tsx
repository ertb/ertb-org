import { GoogleOAuthProvider } from '@react-oauth/google'
import { ReactNode } from 'react'
import { SignInWithGoogleButton } from './sign-in-with-google-button'
import { Alert, AlertDescription, AlertTitle } from './ui/alert'
import { ExclamationTriangleIcon } from '@radix-ui/react-icons'
import { Button } from './ui/button'
import { useUserProfile } from '@/contexts/user-login-context'

interface Props {
  role?: string
  children: ReactNode
}

const clientId = import.meta.env.CLIENT_ID

export const RequireLogin = ({role='', children}:Props) => {
  const { login, profile, logout } = useUserProfile()
  const hasRole = (role:string) => profile && (!role || role == profile.role)

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {hasRole(role) ? children : (
        <div className='flex items-center justify-center h-screen dark:bg-gray-800'>
          {!profile ? <SignInWithGoogleButton onClick={login}/> : (
            <Alert variant="destructive">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription className='flex justify-between items-start'>
                You do not have permission to view this page.
                <Button onClick={logout}>Ok</Button>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </GoogleOAuthProvider>
  )
}