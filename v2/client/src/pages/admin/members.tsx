import { ConfirmDeleteButton } from "@/components/confirm-delete-button"
import { OptionSelect } from "@/components/option-select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useAuthRestClient } from "@/contexts/auth-rest-client-context"
import { MembersEntry, MembersResponse } from "@/lib/api-schema"
import { RestClientResponseError } from "@/lib/rest-client/rest-client"
import { useGet } from "@/lib/rest-client/use-get"
import { PlusIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { DebouncedState, useDebounceValue } from "usehooks-ts"

const memberTags = [
  { value: 'board', label: 'Board'},
  { value: 'support', label: 'Support'},
  { value: 'hidden', label: 'Hidden'},
]

interface MemberItemProps {
  member: MembersEntry
  onDelete: (member:MembersEntry)=>void
}
const MemberItem = ({member, onDelete}:MemberItemProps) => {
  const { authPatch, authDelete } = useAuthRestClient()
  const { toast } = useToast()

  const [ name, setName ] = useState(member.name)
  const [ title, setTitle] = useState(member.title)
  const [ details, setDetails] = useState(member.details)
  const [ tag, setTag] = useState(member.tag)

  const [ db_name, db_setName ] = useDebounceValue(member.name, 750)
  const [ db_title, db_setTitle] = useDebounceValue(member.title, 750)
  const [ db_details, db_setDetails] = useDebounceValue(member.details, 750)
  const [ db_tag, db_setTag] = useDebounceValue(member.tag, 750)

  const setField = (field: 'name'|'title'|'details'|'tag', value:string) => {

    type SetF = [
      React.Dispatch<React.SetStateAction<string>>,
      DebouncedState<(value: string) => void>,
    ]
    const setF:{[key:string]:SetF} = {
      name: [setName, db_setName],
      title: [setTitle, db_setTitle],
      details: [setDetails, db_setDetails],
      tag: [setTag, db_setTag],
    }
    setF[field][0](value)
    setF[field][1](value)
  }

  const changeMember = (field: 'name'|'title'|'details'|'tag', value: string) => {
    setField(field, value)
  }

  const applyDelayedChange = (field: 'name'|'title'|'details'|'tag', value: string) => {
    if (member[field] == value) return
    authPatch(`/api/v1/members/${member._id}?${field}=${encodeURIComponent(value)}`)
    .then(()=>{
      member[field] == value
      toast.success('File renamed')
    })
    .catch((e)=>{
      setField(field, member[field] || '')

      if (e instanceof RestClientResponseError && e.isClientError()) {
        if (e.isAuthError()) {
          toast.error('Not authorized', 'Your session may have expired. Try refreshing.')
          return
        }
        toast.error('Unexpected error', e.message)
        return
      }
      toast.error(`Couldn't rename file`)
    })
  }
  useEffect(()=>{applyDelayedChange('name', db_name)}, [db_name, member.name])
  useEffect(()=>{applyDelayedChange('title', db_title)}, [db_title, member.title])
  useEffect(()=>{applyDelayedChange('details', db_details)}, [db_details, member.details])
  useEffect(()=>{applyDelayedChange('tag', db_tag)}, [db_tag, member.tag])

  const deleteMember = () => {
    authDelete(`/api/v1/members/${member._id}`)
    .then(()=>{
      toast.success('Member deleted')
      onDelete(member)
  })
    .catch(()=>{
      toast.error(`Couldn't delete member`)
    })
  }

  return (<div className="p-1 gap-1 [&:not(:last-child)]:border-b border-gray-200 hover:[&:not(:focus)]:bg-gray-100 focus-within:bg-gray-200 flex justify-between relative">
    <Input value={name} onChange={(e)=>changeMember('name', e.target.value)}/>
    <Input value={title} onChange={(e)=>changeMember('title', e.target.value)}/>
    <Input value={details} onChange={(e)=>changeMember('details', e.target.value)}/>
    <OptionSelect className='w-32 shrink-0' value={tag} options={memberTags} onValueChange={value=>changeMember('tag', value)}></OptionSelect>
    <ConfirmDeleteButton onDelete={deleteMember}/>
  </div>)
}

interface AddMemberProps {
  onAdd: (member:MembersEntry)=>void
}
const AddMember = ({onAdd}:AddMemberProps) => {
  const { authPost } = useAuthRestClient()
  const [member, _setMember] = useState({name:'', title:'', details:''} as {[key:string]:string})
  const setMember = (key:string, value:string) => {
    const newMember = {...member}
    newMember[key] = value
    _setMember(newMember)
  }
  const addMember = () => {
    authPost<{insertedId:any}>('/api/v1/members', member)
    .then((res)=>{
      toast.success('Member added')
      member._id = res.insertedId
      const newMember = {_id: res.insertedId, ...member} as MembersEntry
      onAdd(newMember)
    })
    .catch(()=>{toast.error('Failed to add member')})
  }
  return (
    <div className="flex flex-col rounded-lg border border-gray-200 mb-10">
      <div className="p-1 gap-1 [&:not(:last-child)]:border-b border-gray-200 hover:[&:not(:focus)]:bg-gray-100 focus-within:bg-gray-200 flex justify-between relative">
        <Input value={member.name} onChange={(e)=>setMember('name', e.target.value)}/>
        <Input value={member.title} onChange={(e)=>setMember('title', e.target.value)}/>
        <Input value={member.details} onChange={(e)=>setMember('details', e.target.value)}/>
        <OptionSelect className='w-32 shrink-0' value={member.tag} options={memberTags} onValueChange={value=>setMember('tag', value)}></OptionSelect>
        <Button onClick={addMember} variant='ghost' className='p-2 text-gray-400'><PlusIcon/></Button>
      </div>
  </div>)
}

export const Members = () => {
  const {data} = useGet<MembersResponse>(`/api/v1/members`)

  // force the list to re-render
  const [x, setX] = useState(false)
  const updateList = ()=>{setX(!x)}
  
  const onAdd = (member:MembersEntry) => {
    if (!data) return
    data.members.push(member)
    updateList()
  }

  const onDelete = (member:MembersEntry) => {
    if (!data) return
    const index = (data.members.findIndex(x=>x._id == member._id))
    if (index >= 0) {
      data.members.splice(index, 1)
      updateList()
    }
  }

  return <>
    <h2 className="center">Members</h2>
    <div className="flex flex-col rounded-lg border border-gray-200 mb-10">
      {data?.members.map(m=><MemberItem key={m._id} member={m} onDelete={onDelete}/>)}
    </div>
    <AddMember onAdd={onAdd}/>
  </>
}