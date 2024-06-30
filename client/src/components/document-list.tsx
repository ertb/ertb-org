import { useGet } from "@/lib/rest-client/use-get"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ReactNode, useState } from "react"
import { FilesResponse } from "@/lib/api-schema"
import { ConfirmDocumentLink } from "./confirm-document-link"
import { Skeleton } from "./ui/skeleton"

interface Props {
  tag: string
  title?: ReactNode
  limit?: number
  full?: boolean
  all?: boolean
}
export const DocumentList = ({title, tag, limit=12, full, all}:Props) => {
  const [showAll, setShowAll]= useState(false)
  const {loading, data} = useGet<FilesResponse>(`/api/v1/files?tag=${tag}&limit=${showAll ? 0 : limit}`)
  const count = data?.count || 0

  return (<>
    <div className={cn("text-center space-y-2 w-full", !full && "md:w-80")}>
      {title}
      {loading && <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]"/>
        <Skeleton className="h-4 w-[250px]"/>
        <Skeleton className="h-4 w-[250px]"/>
      </div>}
      {data?.files.map(({_id, url})=><ConfirmDocumentLink variant='download' key={_id} href={url}/>)}
      {(!showAll && count > limit)
        ? all ? <Button onClick={()=>setShowAll(true)} variant="outline" className="w-full">Show {count-limit} more</Button> : <div className="mt-4">{count-limit} more in <a className="italic" href={`/downloads?tag=${tag}`}>Downloads</a></div>
        : undefined }
    </div>
  </>)
}