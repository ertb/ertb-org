import { GoogleOAuthProvider, TokenResponse, googleLogout, useGoogleLogin } from "@react-oauth/google"
import { ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { useSessionStorage } from "usehooks-ts"
import { useClientConfig } from "./client-config-context"
import { Skeleton } from "@/components/ui/skeleton"

interface Credentials extends Omit<TokenResponse, 'error' | 'error_description' | 'error_uri'> {
  expires?: number
}

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
  loading: boolean
  /**
   * Re-fetches the profile (and a new authorization token) using the stored Google credentials.
   * Concurrent calls share one request, and calls within a few seconds of the last refresh return
   * the current profile, so callers can't loop. Resolves to undefined if the user must sign in.
   */
  refreshProfile: ()=>Promise<Profile|undefined>
}
const UserLoginContext = createContext({
  profile: undefined,
  login: ()=>toast('Login not implemented'),
  logout: ()=>toast('Logout not implemented'),
  loading: false,
  refreshProfile: async ()=>undefined,
} as Context)

const MIN_REFRESH_INTERVAL = 10_000 // ms

const fetchUserProfile = (creds:Credentials, setProfile:(profile:Profile)=>void):Promise<Profile|undefined> => {
  const headers = {
    Authorization: `Bearer ${creds?.access_token}`,
    Accept: 'application/json',
  }

  return fetch('/api/v1/userprofile', {headers})
  .then((res) => {
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    return res.json()
  })
  .then((profile:Profile) => {
    setProfile(profile)
    return profile
  })
  .catch((e)=>{
    console.error(e)
    return undefined
  })
}

interface Props {
  children: ReactNode
}
const Inner = ({children}:Props) => {
  const [creds, setCreds, removeCreds] = useSessionStorage<Credentials|undefined>('creds', undefined)

  const [profile, setProfile] = useState<Profile>()
  const [loading, setLoading] = useState(false)

  const logout = () => {
    removeCreds()
    setProfile(undefined)
    googleLogout()
  }

  const login = useGoogleLogin({
    onSuccess:(creds)=>{
      console.log('creds', creds)
      setCreds({...creds, expires: Date.now() + (creds.expires_in * 1000)})
    },
    onError:(err)=>{
      console.log('err', err)
      toast.error('Sign in failed')
    }
  })

  useEffect(()=>{
    if (creds) {
      if ((creds.expires || 0) < Date.now()) {
        removeCreds()
        return
      }
      setLoading(true)
      fetchUserProfile(creds, setProfile)
      .catch(err=>toast.error(err))
      .finally(()=>setLoading(false))
    }
  }, [creds, removeCreds])

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

  const profileRef = useRef(profile)
  profileRef.current = profile
  const refreshing = useRef<Promise<Profile|undefined>>()
  const lastRefresh = useRef(0)

  const refreshProfile = useCallback(() => {
    if (refreshing.current) return refreshing.current
    if (!creds || (creds.expires || 0) < Date.now()) return Promise.resolve(undefined)
    if (Date.now() - lastRefresh.current < MIN_REFRESH_INTERVAL) return Promise.resolve(profileRef.current)

    lastRefresh.current = Date.now()
    refreshing.current = fetchUserProfile(creds, setProfile)
      .then((refreshed) => {
        // don't wait for a re-render; a throttled call right after this must see the new token
        if (refreshed) profileRef.current = refreshed
        return refreshed
      })
      .finally(() => { refreshing.current = undefined })
    return refreshing.current
  }, [creds])

  const value:Context = { profile, login, logout, loading, refreshProfile }
  return (
    <UserLoginContext.Provider value={value}>{children}</UserLoginContext.Provider>
  )
}

export const UserLoginProvider = ({children}:Props) => {
  const { clientId } = useClientConfig()
  if (!clientId) return <Skeleton/>
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <Inner>{children}</Inner>
    </GoogleOAuthProvider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useUserProfile = () => useContext(UserLoginContext)