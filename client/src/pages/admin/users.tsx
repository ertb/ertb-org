import { PencilOffIcon } from "@/components/PencilOffIcon"
import { ConfirmDeleteButton } from "@/components/confirm-delete-button"
import { OptionSelect } from "@/components/option-select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useAuthRestClient } from "@/contexts/auth-rest-client-context"
import { useUserProfile } from "@/contexts/user-login-context"
import { UsersEntry, UsersResponse } from "@/lib/api-schema"
import { RestClientResponseError } from "@/lib/rest-client/rest-client"
import { cn } from "@/lib/utils"
import { useState, useTransition } from "react"

const userTags = [
  { value: 'admin', label: 'Admin'},
  { value: 'user', label: 'User'},
]

const ReadOnly = ({value, className}:{value:string, className:string}) => {
  const label = userTags.find(x=>x.value == value)?.label || value
  return (
    <div className={cn("input flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground", className)}>
      {label}
    </div>
  )
}

interface UserItemProps {
  user: UsersEntry
  onDelete: (user:UsersEntry)=>void
  isSelf: boolean
}
const UserItem = ({user, onDelete, isSelf}:UserItemProps) => {
  const { authPatch, authDelete } = useAuthRestClient()
  const { toast } = useToast()

  const [ role, setRole] = useState<string>(user.role)

  const changeRole = (newRole:string) => {
    if (isSelf) {
      // force an update
      setRole(user.role || '')
      return
    }
    setRole(newRole)
    authPatch(`/api/v1/users/${user._id}?role=${encodeURIComponent(newRole)}`)
    .then(()=>{
      user.role = newRole
    })
    .catch((e)=>{
      // force an update
      setRole(user.role || '')

      if (e instanceof RestClientResponseError && e.isClientError()) {
        if (e.isAuthError()) {
          toast.error('Not authorized', 'Your session may have expired. Try refreshing.')
          return
        }
        toast.error('Unexpected error', e.message)
        return
      }
      toast.error(`Couldn't update role`)
    })
  }

  const deleteUser = () => {
    authDelete(`/api/v1/users/${user._id}`)
    .then(()=>{
      toast.success('User deleted')
      onDelete(user)
  })
    .catch(()=>{
      toast.error(`Couldn't delete user`)
    })
  }

  return (<div className="p-1 gap-1 [&:not(:last-child)]:border-b border-gray-200 hover:[&:not(:focus)]:bg-gray-100 focus-within:bg-gray-200 flex justify-between relative">
    <ReadOnly value={user.userinfo.name}/>
    <ReadOnly value={user.userinfo.email}/>
    <></>
    {isSelf ? <>
      <ReadOnly className='w-40 shrink-0' value={role}></ReadOnly>
      <Button className='shrink-0 w-10 p-3' variant='ghost' disabled><PencilOffIcon/></Button>
    </>:<>
      <OptionSelect className='w-40 shrink-0' value={role || undefined} options={userTags} onValueChange={value=>changeRole(value)}></OptionSelect>
      <ConfirmDeleteButton onDelete={deleteUser}/>
    </>}
  </div>)
}

export const Users = () => {
  const { profile } = useUserProfile()
  const { useAuthGet } = useAuthRestClient()
  const {data} = useAuthGet<UsersResponse>(`/api/v1/users`)

  const myId = profile?.userinfo.id

  // force the list to re-render
  const [x, setX] = useState(false)
  const updateList = ()=>{setX(!x)}
  
  const onDelete = (user:UsersEntry) => {
    if (!data) return
    const index = (data.users.findIndex(x=>x._id == user._id))
    if (index >= 0) {
      data.users.splice(index, 1)
      updateList()
    }
  }

  return <>
    <h2 className="center">Users</h2>
    <div className="flex flex-col rounded-lg border border-gray-200 mb-10">
      {data?.users.map(m=><UserItem key={m._id} isSelf={m.userinfo.id == myId} user={m} onDelete={onDelete}/>)}
    </div>
  </>
}