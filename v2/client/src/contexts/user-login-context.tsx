import { fetchJSON } from "@/lib/fetch-json"
import { GoogleOAuthProvider, TokenResponse, googleLogout, useGoogleLogin } from "@react-oauth/google"
import { ReactNode, createContext, useContext, useEffect, useState } from "react"
import { toast } from "sonner"
import { useSessionStorage } from "usehooks-ts"

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
  login: ()=>void
  logout: ()=>void
  fetchJSON: typeof fetchJSON
  loading: boolean
}
const UserLoginContext = createContext({
  profile: undefined,
  login: ()=>toast('Login not implemented'),
  logout: ()=>toast('Logout not implemented'),
  fetchJSON,
  loading: false
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
  const [creds, setCreds] = useSessionStorage<Credentials|undefined>('creds', undefined)
  const [profile, setProfile] = useState<Profile>()
  const [loading, setLoading] = useState(false)

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

  useEffect(()=>{
    if (creds) {
      setLoading(true)
      fetchUserProfile(creds, setProfile)
      .catch(err=>toast.error(err))
      .finally(()=>setLoading(false))
    }
  }, [creds])

  useEffect(()=>{
    // refresh user profile upon expiration
    if (creds && profile) {
      const fiveMinutes = 5 * 60 * 1000
      const tillExp = profile.expires ? profile.expires * 1000 - Date.now() : fiveMinutes
      if (tillExp <= 0) console.warn('Authorization has bad expiration')
      const to = tillExp <= 0 ? undefined : setTimeout(()=>{
        setLoading(true)
        fetchUserProfile(creds, setProfile)
        .catch(err=>toast.error(err))
        .finally(()=>setLoading(false))
      }, tillExp)
      return ()=>clearTimeout(to)
    }
  }, [creds, profile])

  const withAuth:(typeof fetchJSON) = (input, init) => {
    const headers = {...init?.headers, authorization: profile?.authorization } as HeadersInit
    return fetchJSON(input, {...init, headers})
  }

  const value:Context = { profile, login, logout, fetchJSON: withAuth, loading }
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