import { XIcon } from "lucide-react"
import { Button } from "./ui/button"
import { useOnClickOutside } from "usehooks-ts"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"

interface Props {
  onDelete?:()=>void
  left?:boolean
  label?:string
}
export const ConfirmDeleteButton = ({onDelete: onConfirm, left, label='Delete'}:Props) => {
  const [showConfirm, setShowConfirm] = useState(false)
  const ref = useRef<HTMLElement>(null)
  const br = useRef<HTMLButtonElement>(null)
  useEffect(()=>{if (showConfirm) br.current?.focus()}, [showConfirm])
  useOnClickOutside(ref, ()=>{setShowConfirm(false)})
  return (<span ref={ref}>
    <Button onClick={()=>{setShowConfirm(true)}} variant='ghost' className='p-2 text-gray-400'><XIcon/></Button>
    <Button ref={br} onBlur={()=>setShowConfirm(false)} onClick={()=>{setShowConfirm(false); onConfirm && onConfirm()}} className={cn('absolute', left ? 'left-1' : 'right-1', !showConfirm && 'hidden')}  variant='destructive'>{label}</Button>
  </span>)
}