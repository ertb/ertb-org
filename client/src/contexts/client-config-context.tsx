import { ConfigResponse } from "@/lib/api-schema"
import { useGet } from "@/lib/rest-client/use-get"
import { ReactNode, createContext, useContext } from "react"

const unsetConfig:ConfigResponse = {
  version: '',
  commit: '',
  clientId: ''
}
const ClientConfigContext = createContext(unsetConfig)

interface Props {
  children: ReactNode
}
export const ClientConfigProvider = ({children}:Props) => {
  const { data=unsetConfig } = useGet<ConfigResponse>('/api/v1/config')
  
  return (
    <ClientConfigContext.Provider value={data}>{children}</ClientConfigContext.Provider>
  )
}
  
// eslint-disable-next-line react-refresh/only-export-components
export const useClientConfig = () => useContext(ClientConfigContext)