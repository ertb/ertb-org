import { ConfirmDeleteButton } from "@/components/confirm-delete-button"
import { FileDropZone } from "@/components/file-drop-zone/file-drop-zone"
import { uploadFile } from "@/components/file-drop-zone/upload-file"
import { OptionSelect } from "@/components/option-select"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { FilesResponse, FilesEntry } from "@/lib/api-schema"
import { FileRejection } from "react-dropzone"
import { DocumentLink } from "./document-link"
import { useGet } from "@/lib/rest-client/use-get"
import { useAuthRestClient } from "@/contexts/auth-rest-client-context"
import { useUserProfile } from "@/contexts/user-login-context"
import { useEffect, useState } from "react"
import { useDebounceValue } from "usehooks-ts"
import { RestClientResponseError } from "@/lib/rest-client/rest-client"

const fileTags = [
  { value: 'agenda', label: 'Agenda'},
  { value: 'reports', label: 'Reports'},
  { value: 'minutes', label: 'Minutes'},
  { value: 'financials', label: 'Financials'},
  { value: 'grants', label: 'Grants'},
  { value: 'rfp', label: 'RFP'},
  { value: 'hidden', label: 'Hidden'},
]

interface FilesPatchResponse {
  modifiedCount: number
  url: string
}

interface FileItemProps {
  file: FilesEntry
  onDelete?: (file:FilesEntry)=>void
}

const getFilename = (file:FilesEntry) => {
  const n = new URL(file.url).pathname.split('/')
  const filename = decodeURIComponent(n[n.length-1])
  return filename
}

const FileItem = ({file, onDelete}:FileItemProps) => {
  const { authPatch, authDelete } = useAuthRestClient()
  const { toast } = useToast()
  const [ tag, setTag ] = useState<string|undefined>(file.tag)

  const filename = getFilename(file)
  const [ inputFilename, setInputFilename] = useState(filename)
  const [ debouncedFilename, setDebouncedFilename] = useDebounceValue<string>(filename, 750)

  const changeFilename = (filename: string) => {
    setInputFilename(filename)
    setDebouncedFilename(filename)
  }
  // when filename changes after debounce
  useEffect(()=>{
    if (filename == debouncedFilename) return
    authPatch<FilesPatchResponse>(`/api/v1/files/${filename}?rename=${encodeURIComponent(debouncedFilename)}`)
    .then((res)=>{
      file.url = res.url
      toast.success('File renamed')
    })
    .catch((e)=>{
      setInputFilename(filename)
      if (e instanceof RestClientResponseError && e.isClientError()) {
        if (e.isAuthError()) {
          toast.error('Not authorized', 'Your session may have expired. Try refreshing.')
          return
        }
        toast.error('Unexpected error', e.message)
        return
      }
      toast.error(`Couldn't rename file`)
    })
  }, [debouncedFilename, filename])

  const changeTag = (newTag: string) => {
    setTag(newTag)
    authPatch(`/api/v1/files/${filename}?tag=${encodeURIComponent(newTag)}`)
    .then(()=>{
      file.tag = newTag
    })
    .catch((e)=>{
      // force an update
      setTag(file.tag || '')

      if (e instanceof RestClientResponseError && e.isClientError()) {
        if (e.isAuthError()) {
          toast.error('Not authorized', 'Your session may have expired. Try refreshing.')
          return
        }
        toast.error('Unexpected error', e.message)
        return
      }
      toast.error(`Couldn't update tag`)
    })
  }

  const deleteFile = () => {
    authDelete(`/api/v1/files/${filename}`)
    .then(()=>{
      toast.success('File deleted')
      if (onDelete) onDelete(file)
    })
    .catch(()=>toast.error("Couldn't remove file"))
  }

  return (<div className="p-1 gap-1 [&:not(:last-child)]:border-b border-gray-200 hover:[&:not(:focus)]:bg-gray-100 focus-within:bg-gray-200 flex justify-between relative">
    <DocumentLink href={file.url} iconOnly/>
    <Input value={inputFilename} onChange={(e)=>changeFilename(e.target.value)}/>
    <OptionSelect placeholder='' className='w-40' value={tag || undefined} options={fileTags} onValueChange={changeTag}></OptionSelect>
    <ConfirmDeleteButton onDelete={deleteFile}/>
  </div>)
}

export const Files = () => {
  const { data } = useGet<FilesResponse>(`/api/v1/files?limit=0`)
  const { toast } = useToast()
  const { profile } = useUserProfile()

  const [x, setX] = useState(false)
  const updateList = ()=>{setX(!x)}

  const onDrop = (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    acceptedFiles.forEach(f=>uploadFile<FilesEntry>(f, profile?.authorization)
      .then((res:FilesEntry)=>{
        console.log('new file', res)
        if (data) {
          data.files.splice(0,0, res)
          updateList()
        }
        toast.success('File uploaded', f.name)
      })
      .catch(e=>{
        toast.error('Upload failed', f.name)
        console.error(`Upload failed`, e)
      })
    )
    fileRejections.forEach(r=>{
      toast.warn('File rejected', r.file.name)
      console.warn(`File rejected`, r)
    })
  }

  const onDelete = (file:FilesEntry) => {
    if (!data) return
    const index = (data.files.findIndex(x=>x._id == file._id))
    if (index >= 0) {
      data.files.splice(index, 1)
      updateList()
    }
  }

  return (<div className='flex flex-col gap-4'>
    <h2 className="text-center">Files</h2>
    <FileDropZone onDrop={onDrop}/>
    <div className="flex flex-col rounded-lg border border-gray-200 mb-10">
      {data?.files.map(f=><FileItem key={f._id} file={f} onDelete={onDelete}/>)}
    </div>
  </div>)
}