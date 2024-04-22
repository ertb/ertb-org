import { useState, useEffect } from 'react'

type ErrorHandler = (error:Error|string)=>void

export interface UseFetchOptions extends RequestInit {
  errorHandler?: ErrorHandler
}

export const useFetch = <T>(input:string|URL|Request, options?:UseFetchOptions) => {
  const [data, setData] = useState<T>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error>()
  const [refreshFlag, setRefreshFlag] = useState(true)
  const refresh = ()=>setRefreshFlag(!refreshFlag)

  const {errorHandler} = options || {}

  useEffect(() => {
    setLoading(true)
    setData(undefined)
    setError(undefined)

    const controller = new AbortController()
    const init = {...(options||{}), signal: controller.signal}
    delete init.errorHandler

    fetch(input, init)
    .then(res=>{
      if (!res.ok) throw new Error(`Unexpected server error: ${res.status} ${res.statusText}`)
      return res.json()
    })
    .then((json:T) => setData(json))
    .catch((err:Error) => {
      if (errorHandler) errorHandler(err)
      setError(err)
    })
    .finally(() => setLoading(false))

    return () => controller.abort()
  }, [input, options, refreshFlag, errorHandler])

  return { data, loading, error, refresh }
}