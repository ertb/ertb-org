import { useClientConfig } from "@/contexts/client-config-context"
import { BookmarkIcon } from "@radix-ui/react-icons"
import { useToast } from "./ui/use-toast"

export const AppFooter = () => {
  const {version, commit} = useClientConfig()
  const {toast} = useToast()

  const showVersion = () => (version||commit) && toast({
    title: `Version: ${version} ${commit.slice(0,7)}`.trim(),
    className: 'dark'
})

  return (
    <footer className="py-2 flex justify-between px-4 mt-auto text-white bg-slate-900 text-sm">
      <span></span>
      <span className='text-center'>Copyright © Electronic Recording Technology Board 2017-2024</span>
      <button className='text-right text-slate-600' onClick={showVersion}>
        <span className="sr-only">Show Version</span>
        <BookmarkIcon/>
      </button>
    </footer>
  )
}