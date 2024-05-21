import { FileDropZone } from "@/components/file-drop-zone/file-drop-zone"
import { useFetch } from "@/hooks/use-fetch"
import { FilesResponse } from "@/lib/api-schema"

export const Files = () => {
  const {data} = useFetch<FilesResponse>(`/api/v1/files?limit=0`)
  return (<>
    <FileDropZone/>
    <div className="flex flex-col">
      {data?.files.map(f=><span key={f._id}>{f.url}</span>)}
    </div>
  </>)
}