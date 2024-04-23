import { SignInWithGoogleButton } from "@/components/sign-in-with-google-button"
import { Button } from "@/components/ui/button"
import { fetchJSON } from "@/lib/fetch-json"
import { GoogleOAuthProvider, TokenResponse, googleLogout, useGoogleLogin } from "@react-oauth/google"
import { ReactNode, createContext, useContext, useEffect, useState } from "react"
import { toast } from "sonner"

type Credentials = Omit<TokenResponse, 'error' | 'error_description' | 'error_uri'>

interface UserInfo {
  id: string
  email: string
  verified_email: boolean
  name: string
  given_name: string
  family_name: string
  picture: string // url
  locale: string
}

interface Profile {
  role: string
  userinfo: UserInfo
  authorization: string
  expires: number
}

interface Context {
  profile: Profile|undefined
  LoginButton: ()=>ReactNode
  logout: ()=>void
  fetchJSON: typeof fetchJSON
}
const UserLoginContext = createContext({
  profile: undefined,
  LoginButton: ()=><Button onClick={()=>toast('Sign in not available')}>Sign in</Button>,
  logout: ()=>toast('Logout not available'),
  fetchJSON,
} as Context)

const fetchUserProfile = (creds:Credentials, setProfile:(profile:Profile)=>void) => {
  const headers = {
    Authorization: `Bearer ${creds?.access_token}`,
    Accept: 'application/json',
  }

  return fetch('/api/v1/userprofile', {headers})
  .then((res) => {
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    return res.json()
  })
  .then(setProfile)
}

interface Props {
  children: ReactNode
}
const Inner = ({children}:Props) => {
  const [creds, setCreds] = useState<Credentials>()
  const [profile, setProfile] = useState<Profile>()

  const logout = () => {
    setCreds(undefined)
    setProfile(undefined)
    googleLogout()
  }

  const login = useGoogleLogin({
    onSuccess:(creds)=>{
      console.log('creds', creds)
      setCreds(creds)
    },
    onError:(err)=>{
      console.log('err', err)
      toast.error('Sign in failed')
    }
  })

  const LoginButton = () => profile ? undefined : 
    <SignInWithGoogleButton onClick={login}/>

  useEffect(()=>{
    if (creds) {
      fetchUserProfile(creds, setProfile)
      .catch(err=>toast.error(err))
    }
  }, [creds])

  useEffect(()=>{
    // refresh user profile upon expiration
    if (creds && profile) {
      const fiveMinutes = 5 * 60 * 1000
      const tillExp = profile.expires ? profile.expires * 1000 - Date.now() : fiveMinutes
      if (tillExp <= 0) console.warn('Authorization has bad expiration')
      const to = tillExp <= 0 ? undefined : setTimeout(()=>{
        fetchUserProfile(creds, setProfile)
        .catch(err=>toast.error(err))
      }, tillExp)
      return ()=>clearTimeout(to)
    }
  }, [creds, profile])

  const withAuth:(typeof fetchJSON) = (input, init) => {
    const headers = {...init?.headers, authorization: profile?.authorization } as HeadersInit
    return fetchJSON(input, {...init, headers})
  }

  const value:Context = { profile, LoginButton, logout, fetchJSON: withAuth }
  return (
    <UserLoginContext.Provider value={value}>{children}</UserLoginContext.Provider>
  )
}

export const UserLoginProvider = ({children}:Props) => {
  const clientId = import.meta.env.VITE_GOOGLE_API_CLIENT_ID
  if (!clientId) throw new Error('VITE_GOOGLE_API_CLIENT_ID is not set')

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <Inner>{children}</Inner>
    </GoogleOAuthProvider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useUserProfile = () => useContext(UserLoginContext)