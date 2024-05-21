import { GoogleOAuthProvider } from '@react-oauth/google'
import { ReactNode } from 'react'
import { SignInWithGoogleButton } from './sign-in-with-google-button'
import { Alert, AlertDescription, AlertTitle } from './ui/alert'
import { ExclamationTriangleIcon } from '@radix-ui/react-icons'
import { Button } from './ui/button'
import { useUserProfile } from '@/contexts/user-login-context'
import { Skeleton } from './ui/skeleton'

interface Props {
  withRole?: string
  children: ReactNode
}

const clientId = import.meta.env.CLIENT_ID

export const RequireLogin = ({withRole='', children}:Props) => {
  const { profile, logout, loading } = useUserProfile()
  const hasRole = (role:string) => profile && (!role || role == profile.role)

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {hasRole(withRole) ? children : (
        <div className='mt-auto flex items-center justify-center dark:bg-gray-800'>
          {!profile ? loading ? <Skeleton/> : <SignInWithGoogleButton/> : (
            <Alert variant="destructive" className='w-auto pb-2'>
              <ExclamationTriangleIcon className="h-4 w-4" />
              <div className='flex gap-4 flex-wrap'>
                <div>
                  <AlertTitle className='text-left'>Access Denied</AlertTitle>
                  <AlertDescription className='text-left'>
                    You do not have permission to view this page.
                  </AlertDescription>
                </div>
                <div>
                  <Button variant='destructive' onClick={logout}>Logout</Button>
                </div>
              </div>
            </Alert>
          )}
        </div>
      )}
    </GoogleOAuthProvider>
  )
}