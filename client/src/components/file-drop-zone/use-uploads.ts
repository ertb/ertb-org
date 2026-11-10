import { useCallback, useRef, useState } from 'react'
import { UploadOptions } from './upload-file'

export interface UploadState {
  id: number
  name: string
  loaded: number
  total: number
  cancel: () => void
}

/**
 * Tracks in-progress uploads for display with <UploadProgress>. `track` runs an upload, passing it
 * progress and cancel options, and removes the entry once it settles.
 *
 * @example
 * const {uploads, track} = useUploads()
 * track(file, (options) => uploadFile(file, authorization, options))
 */
export const useUploads = () => {
  const [uploads, setUploads] = useState<UploadState[]>([])
  const nextId = useRef(1)

  const track = useCallback(<T,>(file:File, run:(options:UploadOptions) => Promise<T>) => {
    const id = nextId.current++
    const controller = new AbortController()
    const update = (changes:Partial<UploadState>) =>
      setUploads((all) => all.map((u) => u.id == id ? {...u, ...changes} : u))

    setUploads((all) => [...all, {id, name: file.name, loaded: 0, total: file.size, cancel: () => controller.abort()}])
    return run({
      signal: controller.signal,
      onProgress: (loaded, total) => update({loaded, total}),
    }).finally(() => setUploads((all) => all.filter((u) => u.id != id)))
  }, [])

  return {uploads, track}
}
