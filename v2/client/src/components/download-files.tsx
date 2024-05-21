import { useFetch } from "@/hooks/use-fetch"
import { DownloadLink } from "../pages/home/download-link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ReactNode, useState } from "react"
import { FilesResponse } from "@/lib/api-schema"

interface Props {
  tag: string
  title?: ReactNode
  limit?: number
  full?: boolean
  all?: boolean
}
export const DownloadFiles = ({title, tag, limit=12, full, all}:Props) => {
  const [showAll, setShowAll]= useState(false)
  const {data} = useFetch<FilesResponse>(`/api/v1/files?tag=${tag}&limit=${showAll ? 0 : limit}`)
  const count = data?.count || 0

  return (<>
    <div className={cn("text-center space-y-2 w-full", !full && "md:w-80")}>
      {title}
      {data?.files.map(({url})=><DownloadLink key={url} url={url}/>)}
      {(!showAll && count > limit)
        ? all ? <Button onClick={()=>setShowAll(true)} variant="outline" className="w-full">Show {count-limit} more</Button> : <div className="mt-4">{count-limit} more in <a className="italic" href="/downloads">Downloads</a></div>
        : undefined }
    </div>
  </>)
}