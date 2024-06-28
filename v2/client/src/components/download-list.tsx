import { Skeleton } from "./ui/skeleton"
import { toast } from "sonner"
import { DownloadIcon } from "@radix-ui/react-icons"
import { useGet } from "@/lib/rest-client/use-get"

interface File {
  _id: string,   // example: '9n5esnco9gEsL7GxZ'
  url: string,   // exmaple: 'https://ertb-org.s3.amazonaws.com/Notice092719- ERT Board.pdf'
  added: string, // example: '2019-10-10T14:51:33.150+00:00'
  tag: string,   // example: 'agenda'
}

interface DownloadFileProps {
  file: File
}

const DownloadFile = ({file}:DownloadFileProps) => {
  const filepath = new URL(file.url).pathname.slice(1)
  return (
    <a href={file.url} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-4 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">
      {filepath}
      <DownloadIcon/>
    </a>
  )
}

interface Props {
  tag?: string
  limit?: number
}
export const DownloadList = ({tag, limit}:Props) => {
  const {loading, data=[]} = useGet<File[]>(`/api/files?tag=${tag}&limit=${limit}`, {
    errorHandler: (e:Error)=>toast(e.toString())
  })

  return (<>
    {loading && <div className="space-y-2">
      <Skeleton className="h-4 w-[250px]"/>
      <Skeleton className="h-4 w-[250px]"/>
      <Skeleton className="h-4 w-[250px]"/>
    </div>}
    {!loading && data.map(file=><DownloadFile file={file}/>)}
  </>)
}