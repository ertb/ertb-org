import { ReactNode, createContext, useContext, useEffect } from 'react'
import { toast } from 'sonner'
import { useGet } from '@/lib/rest-client/use-get'
import { useUserProfile } from './user-login-context'
import { RestClientResponseError, restClient } from '@/lib/rest-client/rest-client'

type AuthCall = <T>(call: (authorization?: string) => Promise<T>) => Promise<T>

interface Context {
  authGet: typeof restClient.get
  authPost: typeof restClient.post
  authPut: typeof restClient.post
  authPatch: typeof restClient.patch
  authDelete: typeof restClient.get

  useAuthGet: typeof useGet

  /**
   * Calls `call` with the current authorization. If it fails with a 401 (eg., the token expired or
   * the server no longer knows its signing key), fetches a fresh token and calls it once more.
   * Errors must carry the status as `status` or as a RestClientResponseError.
   */
  withAuthRetry: AuthCall
}
const AuthRestClientContext = createContext({
  authGet: ()=>{toast('authGet not provided'); return {} as unknown},
  authPost: ()=>{toast('authPost not provided'); return {} as unknown},
  authPut: ()=>{toast('authPut not provided'); return {} as unknown},
  authPatch: ()=>{toast('authPatch not provided'); return {} as unknown},
  authDelete: ()=>{toast('authDelete not provided'); return {} as unknown},

  useAuthGet: ()=>{toast('useAuthGet not provided'); return {} as unknown},
  withAuthRetry: (call) => call(),
} as Context)

// eslint-disable-next-line react-refresh/only-export-components
export const isUnauthorized = (e: unknown) =>
  (e instanceof RestClientResponseError && e.res.status == 401)
  || (e as {status?: number} | undefined)?.status == 401

interface Props {
  children: ReactNode
}
export const AuthRestClientProvider = ({children}:Props) => {
  const {profile, refreshProfile} = useUserProfile()
  if (!profile) {
    console.warn('AuthRestClientProvider must be wrapped by RequireLogin. Expect 403 Unauthorized responses.')
  }

  const withAuthRetry:AuthCall = async (call) => {
    const authorization = profile?.authorization
    try {
      return await call(authorization)
    } catch (e) {
      if (!isUnauthorized(e)) throw e
      const refreshed = await refreshProfile()
      if (!refreshed?.authorization || refreshed.authorization == authorization) throw e
      return call(refreshed.authorization)
    }
  }

  const withAuth = (init: RequestInit | undefined, authorization?: string) =>
    ({...init, headers: {...init?.headers, authorization}} as RequestInit)

  const authGet:(typeof restClient.get) = (input, init) =>
    withAuthRetry((authorization) => restClient.get(input, withAuth(init, authorization)))
  const authPost:(typeof restClient.post) = (input, payload, init) =>
    withAuthRetry((authorization) => restClient.post(input, payload, {method: 'POST', ...withAuth(init, authorization)}))

  const authPut:(typeof restClient.post) = (input, payload, init) => authPost(input, payload, {method:'PUT', ...init})
  const authPatch:(typeof restClient.post) = (input, payload, init) => authPost(input, payload, {method:'PATCH', ...init})
  const authDelete:typeof restClient.get = (input, init) => authGet(input, {method: 'DELETE', ...init})

  const useAuthGet:(typeof useGet) = <T,>(input: Parameters<typeof useGet>[0], init?: Parameters<typeof useGet>[1]) => {
    const headers = {...init?.headers, authorization: profile?.authorization} as HeadersInit
    const result = useGet<T>(input, {...init, headers})
    // a new token changes the headers, which makes useGet fetch again
    const unauthorized = isUnauthorized(result.error)
    useEffect(() => { if (unauthorized) refreshProfile() }, [unauthorized])
    return result
  }

  const value:Context = {
    authGet, authPost, authPut, authPatch, authDelete,
    useAuthGet, withAuthRetry,
  }
  return (
    <AuthRestClientContext.Provider value={value}>{children}</AuthRestClientContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuthRestClient = ()=>useContext(AuthRestClientContext)
