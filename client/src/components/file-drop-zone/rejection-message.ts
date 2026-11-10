import { ErrorCode, FileRejection } from 'react-dropzone'
import { formatFileSize } from './file-size'

/** A message that explains to the user why a dropped file was not accepted */
export const rejectionMessage = ({file, errors}:FileRejection, maxSize?:number) => {
  const codes = errors.map((e) => e.code)
  if (codes.includes(ErrorCode.FileTooLarge)) {
    const limit = maxSize ? ` The limit is ${formatFileSize(maxSize, 0)}.` : ''
    return `${file.name} is ${formatFileSize(file.size, 1)}, which is too large to upload.${limit}`
  }
  if (codes.includes(ErrorCode.FileInvalidType)) return `${file.name} is not a supported file type.`
  if (codes.includes(ErrorCode.TooManyFiles)) return `${file.name} was not uploaded. Upload one file at a time.`
  return errors[0]?.message ? `${file.name}: ${errors[0].message}` : file.name
}
