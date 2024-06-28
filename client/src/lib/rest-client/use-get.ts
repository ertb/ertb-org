import { useState, useEffect, useRef, useMemo } from 'react'
import { deepEqual } from '../deep-equal'

type ErrorHandler = (error:Error)=>void

export interface UseFetchOptions extends RequestInit {
  errorHandler?: ErrorHandler
  onPreFetch?: (input: string | URL | Request, init: RequestInit) => [string | URL | Request, RequestInit]
}

export const useGet = <T>(input:string|URL|Request, options?:UseFetchOptions) => {
  const [data, setData] = useState<T>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error>()
  const [refreshFlag, setRefreshFlag] = useState(true)
  const refresh = ()=>setRefreshFlag(!refreshFlag)

  const lastOptions = useRef(options)
  options = useMemo(()=>{
    if (!deepEqual(lastOptions.current, options)) {
      lastOptions.current = options
      return options
    }
    return lastOptions.current
  }, [options])

  useEffect(() => {
    setLoading(true)
    setData(undefined)
    setError(undefined)

    const {errorHandler, onPreFetch} = options || {}
    const controller = new AbortController()
    const headers = {'accept': 'application/json', ...options?.headers}
    let init = {...(options||{}), headers, signal: controller.signal} as RequestInit
    delete (init as any).errorHandler

    if (onPreFetch) {
      [input, init] = onPreFetch(input, init)
    }
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
  }, [input, options, refreshFlag])

  return { data, loading, error, refresh }
}