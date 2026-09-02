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
    const baseInit = {...(options||{}), headers, signal: controller.signal} as RequestInit
    delete (baseInit as Record<string, unknown>).errorHandler

    const [fetchInput, fetchInit] = onPreFetch ? onPreFetch(input, baseInit) : [input, baseInit]
    fetch(fetchInput, fetchInit)
    .then(res=>{
      if (!res.ok) throw new Error(`Unexpected server error: ${res.status} ${res.statusText}`)
      return res.json()
    })
    .then((json:T) => setData(json))
    .catch((err:Error) => {
      // this request was superseded (eg. React StrictMode's double-invoke, or input/options
      // changing before the previous fetch resolved) - a newer effect run owns the state now
      if (controller.signal.aborted) return
      if (errorHandler) errorHandler(err)
      setError(err)
    })
    .finally(() => {
      if (controller.signal.aborted) return
      setLoading(false)
    })

    return () => controller.abort()
  }, [input, options, refreshFlag])

  return { data, loading, error, refresh }
}