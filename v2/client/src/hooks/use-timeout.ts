import { useEffect, useRef } from 'react'

export const useTimeout = (callback:()=>void, ms?:number) => {
  const cbRef = useRef(callback)
  useEffect(() => cbRef.current = callback, [callback])

  useEffect(() => {
    const id = setTimeout(cbRef.current, ms)
    return () => clearTimeout(id)
  }, [ms])
}