import { useClientConfig } from "@/contexts/client-config-context"

export const AppFooter = () => {
  const {version, commit} = useClientConfig()

  return (
    <footer className="py-2 flex justify-between px-4 mt-auto text-white bg-slate-900 text-sm">
      <span></span>
      <span className='text-center'>Copyright © Electronic Recording Technology Board 2017-2024</span>
      <span className='text-right'>{version}{commit?`(${commit})`:''}</span>
    </footer>
  )
}