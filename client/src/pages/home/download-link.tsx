import { cn } from "@/lib/utils"
import { DownloadIcon } from "@radix-ui/react-icons"

interface Props {
  url: string
  iconOnly?: boolean
}
export const DownloadLink = ({url, iconOnly}:Props) => {
  const u = new URL(url)
  const n = u.pathname.split('/')
  const filename = decodeURIComponent(n[n.length-1])

  return (
    <a href={url} download target="_blank"
      className={cn(iconOnly ? "w-10 shrink-0 justify-center items-center" : "text-sm text-left justify-between w-full px-3 py-2", "flex rounded-md border border-input bg-background ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50")}
    >{iconOnly ? undefined : <span>{filename}</span>}
    <DownloadIcon className={cn(!iconOnly && "float-right")}/>
    </a>
  )
}