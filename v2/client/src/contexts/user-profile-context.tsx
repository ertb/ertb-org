import { GoogleOAuthProvider, TokenResponse, useGoogleLogin } from "@react-oauth/google"
import { ReactNode, createContext, useContext, useEffect, useState } from "react"
import { toast } from "sonner"

type Credentials = Omit<TokenResponse, 'error' | 'error_description' | 'error_uri'>
interface Profile {
  name: string
  email: string
  role: string
  expires: number
}

const UserProfileContext = createContext({
  profile: {name:'', email: ''} as Profile|undefined,
  login: ()=>{},
  logout: ()=>{}
})

const fetchUserProfile = (creds:Credentials, setProfile:(profile:Profile)=>void) => {
  const headers = {
    Authorization: `Bearer ${creds?.access_token}`,
    Accept: 'application/json',
  }

  return fetch('/api/v1/userinfo', {headers})
  .then((res) => {
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    return res.json()
  })
  .then(setProfile)
}

interface Props {
  children: ReactNode
}
export const UserProfileProvider = ({children}:Props) => {
  const clientId = import.meta.env.GOOGLE_API_CLIENT_ID
  if (!clientId) throw new Error('GOOGLE_API_CLIENT_ID is not set')

  const [creds, setCreds] = useState<Credentials>()
  const [profile, setProfile] = useState<Profile>()

  const login = useGoogleLogin({
    onSuccess: (creds) => {
      console.debug('creds', creds)
      setCreds(creds)
    },
    onError: (error) => console.log('Login Failed:', error)
  })
  const logout = () => {
    setCreds(undefined)
    setProfile(undefined)
  }

  useEffect(()=>{
    if (creds) {
      fetchUserProfile(creds, setProfile)
      .catch(()=>toast('Authorization failed'))
    }
  }, [creds])
  useEffect(()=>{
    // refresh userInfo upon expiration
    if (creds && profile) {
      const tillExp = profile.expires - Date.now()
      const to = setTimeout(()=>{
        fetchUserProfile(creds, setProfile)
        .catch(()=>toast('Authorization failed'))
      }, tillExp)
      return ()=>clearTimeout(to)
    }
  }, [creds, profile])

  const value = {
    profile, login, logout
  }
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>
    </GoogleOAuthProvider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useUserProfile = () => useContext(UserProfileContext)