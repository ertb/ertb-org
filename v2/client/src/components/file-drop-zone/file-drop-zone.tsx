import { Accept, DropEvent, FileRejection, useDropzone } from 'react-dropzone'
import { AcceptType, acceptMessage, acceptTypes } from './accept-types'
import { formatFileSize, parseFileSize } from './file-size'

type OnDropFunction = <T extends File>(acceptedFiles: T[], fileRejections: FileRejection[], event: DropEvent) => void

interface Props {
  accept?: Accept | AcceptType
  onDrop?: OnDropFunction
  /** bytes or string w/ unit (ie., '10MB') */
  minSize?: number|string
  /** bytes or string w/ unit (ie., '10MB') */
  maxSize?: number|string
  maxFiles?: number
}
export const FileDropZone = ({accept, minSize, maxSize, maxFiles=1, ...props}:Props) => {
  const acceptMsg = acceptMessage(accept, maxFiles)
  if (typeof accept == 'string') accept = acceptTypes[accept]
  maxSize = parseFileSize(maxSize) || Infinity
  minSize = parseFileSize(minSize) || 0
  const {getRootProps, getInputProps} = useDropzone({accept, minSize, maxSize, maxFiles, ...props})
 
  return (
    <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600" {...getRootProps()}>
      <div className="flex flex-col items-center justify-center pt-5 pb-6">
        <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="font-semibold">Click to upload</span> or drag and drop
        </p>
        {(acceptMsg || maxSize)
          ? <p className="text-xs text-gray-500 dark:text-gray-400">
            {acceptMsg} {maxSize ? `(MAX. ${formatFileSize(maxSize, 0)})`: undefined}</p>
          : undefined
        }
      </div>
      <input type="file" className="hidden" {...getInputProps()}/>
   </div>
  )
}
