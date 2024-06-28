import { ReactNode, createContext, useContext } from 'react'
import { toast } from 'sonner'
import { UseFetchOptions, useGet } from '@/lib/rest-client/use-get'
import { useUserProfile } from './user-login-context'
import { restClient } from '@/lib/rest-client/rest-client'

interface Context {
  authGet: typeof restClient.get
  authPost: typeof restClient.post
  authPut: typeof restClient.post
  authPatch: typeof restClient.patch
  authDelete: typeof restClient.get

  useAuthGet: typeof useGet
}
const AuthRestClientContext = createContext({
  authGet: ()=>{toast('authGet not provided'); return {} as any},
  authPost: ()=>{toast('authPost not provided'); return {} as any},
  authPut: ()=>{toast('authPut not provided'); return {} as any},
  authPatch: ()=>{toast('authPatch not provided'); return {} as any},
  authDelete: ()=>{toast('authDelete not provided'); return {} as any},

  useAuthGet: ()=>{toast('useAuthGet not provided'); return {} as any},
} as Context)

interface Props {
  children: ReactNode
}
export const AuthRestClientProvider = ({children}:Props) => {
  const {profile} = useUserProfile()
  if (!profile) {
    console.warn('AuthRestClientProvider must be wrapped by RequireLogin. Expect 403 Unauthorized responses.')
  }

  const authGet:(typeof restClient.get) = (input, init) => {
    const headers = {...init?.headers, authorization: profile?.authorization} as HeadersInit
    return restClient.get(input, {...init, headers})
  }
  const authPost:(typeof restClient.post) = (input, payload, init) => {
    const headers = {...init?.headers, authorization: profile?.authorization} as HeadersInit
    init = {method: 'POST', ...init, headers}
    console.log(`${init?.method || 'POST'}`, input, init)
    return restClient.post(input, payload, init)
  }

  const authPut:(typeof restClient.post) = (input, payload, init) => authPost(input, payload, {method:'PUT', ...init})
  const authPatch:(typeof restClient.post) = (input, payload, init) => authPost(input, payload, {method:'PATCH', ...init})
  const authDelete:typeof restClient.get = (input, init) => authGet(input, {method: 'DELETE', ...init})

  const useAuthGet:(typeof useGet) = (input, init) => {
    const headers = {...init?.headers, authorization: profile?.authorization} as HeadersInit
    return useGet(input, {...init, headers})
  }

  const value:Context = {
    authGet, authPost, authPut, authPatch, authDelete,
    useAuthGet,
  }
  return (
    <AuthRestClientContext.Provider value={value}>{children}</AuthRestClientContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuthRestClient = ()=>useContext(AuthRestClientContext)