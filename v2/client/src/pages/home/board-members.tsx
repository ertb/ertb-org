import { useFetch } from "@/hooks/use-fetch"
import './board-members.css'

interface Member {
  name: string
  title: string
  details: string
  tag: string
}
interface MemberResponse {
  count: number
  members: Member[]
}
export const BoardMembers = () => {
  const {data} = useFetch<MemberResponse>(`/api/v1/members`)
  const board = data?.members.filter(m=>m.tag == 'board')
  const support = data?.members.filter(m=>m.tag == 'support')

  return (<>
    <div className="flex flex-wrap justify-center gap-8 board-members">
      {board?.map(({name, title, details})=>(
        <div key={name} className='text-center w-80'>
          <h3 className="member">{name}</h3>
          <p>{title}<br/>{details}</p>
        </div>
      ))}

    </div>
    <h3 className='text-center mt-6'>Support</h3>
    <div className="flex flex-wrap justify-center gap-8">
      {support?.map(({name, title, details})=>(
        <div key={name} className='text-center w-80'>
          <h4 className="member">{name}</h4>
          <p>{title}<br/>{details}</p>
        </div>
      ))}
    </div>
  </>)
}