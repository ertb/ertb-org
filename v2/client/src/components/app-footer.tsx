import { BookmarkIcon } from "@radix-ui/react-icons"
import { toast } from "sonner"

export const AppFooter = () => {
  const gitVersion = import.meta.env.VITE_VERSION
  const gitCommitHash = import.meta.env.VITE_COMMIT_HASH
  const showVersion = () => gitCommitHash && toast(`${gitVersion} ${gitCommitHash}`.trim())
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