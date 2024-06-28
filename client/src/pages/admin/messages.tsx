import { ConfirmDeleteButton } from "@/components/confirm-delete-button"
import { useToast } from "@/components/ui/use-toast"
import { useAuthRestClient } from "@/contexts/auth-rest-client-context"
import { MessagesEntry, MessagesResponse } from "@/lib/api-schema"
import { useState } from "react"

interface MessageItemProps {
  message: MessagesEntry
  onDelete: (m:MessagesEntry)=>void
}
const MessageItem = ({message, onDelete}:MessageItemProps) => {
  const { authDelete } = useAuthRestClient()
  const { toast } = useToast()

  const deleteMessage = () => {
    authDelete(`/api/v1/messages/${message._id}`)
    .then(()=>{
      toast.success('Message deleted')
      onDelete(message)
    })
    .catch(()=>{
      toast.error(`Couldn't delete message`)
    })
  }

  const date = new Date(message.date).toLocaleDateString()

  return (<div className="p-1 gap-1 [&:not(:last-child)]:border-b border-gray-200 hover:[&:not(:focus)]:bg-gray-100 focus-within:bg-gray-200 flex justify-between relative">
    <div className="flex w-full p-4 gap-2 flex-col">
      <div className="flex gap-4 w-full text-slate-500 text-sm">
        <span>{date}</span>
        <span>{message.name} &lt;{message.email}&gt;</span>
        <span>{message.phone}</span>
      </div>
      <span>{message.message}</span>
    </div>
    <ConfirmDeleteButton onDelete={deleteMessage}/>
  </div>)
}

export const Messages = () => {
  const { useAuthGet } = useAuthRestClient()
  const {data} = useAuthGet<MessagesResponse>(`/api/v1/messages`)

  // force the list to re-render
  const [x, setX] = useState(false)
  const updateList = ()=>{setX(!x)}
  
  const onDelete = (message:MessagesEntry) => {
    if (!data) return
    const index = (data.messages.findIndex(x=>x._id == message._id))
    if (index >= 0) {
      data.messages.splice(index, 1)
      updateList()
    }
  }

  return <>
    <h2 className="center">Messages</h2>
    <div className="flex flex-col rounded-lg border border-gray-200 mb-10">
      {data?.messages.map(m=><MessageItem key={m._id} message={m} onDelete={onDelete}/>)}
    </div>
  </>
}