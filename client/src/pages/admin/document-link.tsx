import { cn } from "@/lib/utils"
import { DownloadIcon } from "@radix-ui/react-icons"

interface Props {
  href: string
  iconOnly?: boolean
}
export const DocumentLink = ({href, iconOnly}:Props) => {
  const u = new URL(href)
  const pathname = u.pathname
  const filename = decodeURIComponent(pathname.split('/',-1).pop() || pathname)

  return (
    <a href={href} download target="_blank" aria-label="Opens in new window"
      className={cn(iconOnly ? "w-10 shrink-0 justify-center items-center" : "text-sm text-left justify-between w-full px-3 py-2", "flex rounded-md border border-input bg-background ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50")}
    >{iconOnly ? undefined : <span>{filename}</span>}
    <DownloadIcon className={cn(!iconOnly && "float-right")}/>
    </a>
  )
}
