class ResponseError extends Error {
  res: Response
  constructor(message:string, res:Response) {
    super(message)
    this.res = res
  }
}

/**
 * Convienience wrapper around fetch to retrieve JSON
 * 
 * @example
 * interface Profile {email:string, name:string}
 * fetchJSON<Profile>('/api/v1/userprofile')
 * .then(profile=>setProfile(profile))
 * .catch(err=>console.log(err))
 * 
 * @throws ResponseError that with full response as `res` if !res.ok
 */
export const fetchJSON = <T>(input: string | URL | Request, init?: RequestInit | undefined) => {
  const headers = {...init?.headers, 'accept': 'application/json'}
  return fetch(input, {...init, headers})
  .then(res=>{
    if (!res.ok) throw new ResponseError(`${res.status} ${res.statusText}`, res)
    return res.json()
  })
  .then(json=>json as T)
}