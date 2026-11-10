import { X } from 'lucide-react'
import { formatFileSize } from './file-size'
import { UploadState } from './use-uploads'

interface Props {
  uploads: UploadState[]
}

/** Shows a progress bar for each upload from useUploads */
export const UploadProgress = ({uploads}:Props) => {
  if (!uploads.length) return null
  return (
    <ul className="flex flex-col gap-2" aria-label="Uploads">
      {uploads.map((u) => {
        const percent = u.total ? Math.min(100, Math.round(100 * u.loaded / u.total)) : 0
        // the server still saves the file to storage after the browser has sent it all
        const sent = u.total > 0 && u.loaded >= u.total
        const status = sent
          ? 'Saving…'
          : `${formatFileSize(u.loaded, 1)} of ${formatFileSize(u.total, 1)} · ${percent}%`
        return (
          <li key={u.id} className="flex flex-col gap-1 rounded-lg border border-gray-200 p-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="flex-1 truncate font-medium" title={u.name}>{u.name}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">{status}</span>
              {!sent && (
                <button
                  type="button"
                  onClick={u.cancel}
                  className="rounded p-0.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-gray-700 dark:hover:text-gray-100"
                  aria-label={`Cancel upload of ${u.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div
              role="progressbar"
              aria-label={`Uploading ${u.name}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
            >
              <div
                className={`h-full rounded-full bg-primary transition-[width] duration-200 ${sent ? 'animate-pulse' : ''}`}
                style={{width: `${percent}%`}}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
