import { DialogClose, DialogDescription, DialogTitle } from "@radix-ui/react-dialog"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter } from "./ui/dialog"
import { ReactNode, useCallback } from "react"

import pdfIcon from '@/assets/pdf_icon.svg'
import wordIcon from '@/assets/word_icon.svg'
import { LinkButton } from "./link-button"
import { DownloadIcon } from "@radix-ui/react-icons"

interface Props {
   href: string
   variant?: 'link'|'download'
   children?: ReactNode
   doctype?: 'pdf'|'doc'|'docx'
}
export const ConfirmDocumentLink = ({href, variant='link', children, doctype}:Props) => {
  const u = new URL(href)
  const pathname = u.pathname
  const filename = decodeURIComponent(pathname.split('/',-1).pop() || pathname)
  children = children || filename

  const dotIndex = filename.lastIndexOf('.')
  const ext = dotIndex >= 0 ? filename.slice(dotIndex + 1) : (doctype || '')
  const {type, icon, reader} = {
    'pdf': {type: 'an Adobe PDF', reader: 'Adobe Reader', icon: pdfIcon},
    'doc': {type: 'a Microsoft Word', reader: 'Microsoft Word', icon: wordIcon},
    'docx': {type: 'a Microsoft Word', reader: 'Microsoft Word', icon: wordIcon},
  }[ext] || {type:'', icons:''}

  const autoFocus = useCallback((e:HTMLElement | null) => { if (e) e.focus() }, [])

  return (
    <Dialog>
    <DialogTrigger asChild>
      { variant == 'download' ?
      <button className="text-sm text-left justify-between w-full px-3 py-2 flex rounded-md border border-input bg-background ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-accent">
        {children}
        <DownloadIcon className="float-right"/>
      </button>
      :
      <button className='link'>{children}</button>
      }
    </DialogTrigger>
    <DialogContent className="sm:max-w-[425px] md:min-w-[525px]">
      <DialogHeader>
        <DialogTitle>
          <b>Continue to {type} document?</b>
        </DialogTitle>
      </DialogHeader>

      <DialogDescription asChild>
        <div>
          <div className='mb-2 text-gray-500'><b>{filename}</b></div>
          <img className='h-20 float-right' src={icon} alt={`${type} icon`}/>
          <div className='mb-2'>This is a link to {type} document.</div>
          <div className='mb-2'> Depending on your browser support, this may show a file reader or download the document.</div>
          <div>If the file is downloaded, you can view it using <b>{reader}</b>.</div>
        </div>
      </DialogDescription>

      <DialogFooter>
        <DialogClose asChild>
          <LinkButton href={href} download={filename} ref={autoFocus}>Continue</LinkButton>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  )
}