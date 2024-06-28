import { JSONPatch } from "./json-patch"

export class RestClientResponseError extends Error {
  res: Response
  constructor(res:Response) {
    super(`${res.status} ${res.statusText}`)
    this.res = res
  }
  isAuthError() {return this.res.status == 401 || this.res.status == 403}
  isClientError() {return (this.res.status/100|0) == 4}
  isServerError() {return (this.res.status/100|0) == 5}
}

const get = async <T>(input: string | URL | Request, init?: RequestInit | undefined) => {
  const headers = {...init?.headers, 'accept': 'application/json'}
  init = { ...init, headers }
  console.log(`${init.method || 'GET'}`, input, init)
  const res = await fetch(input, init)
  if (!res.ok) throw new RestClientResponseError(res)
  return await res.json() as T
}

const post = <T>(input: string | URL | Request, payload: unknown, init?: RequestInit | undefined) => {
  const headers = {...init?.headers, 'content-type': 'application/json'}
  console.log(`${init?.method || 'POST'}`, input, init)
  init = {method:'POST', ...init, headers, body: JSON.stringify(payload)}
  console.log(`${init.method || 'POST'}`, input, init)
  return get<T>(input, init)
}
const put = <T>(input:string|URL|Request, payload: unknown, options?:RequestInit) => {
  return post<T>(input, payload, {method: 'PUT', ...options})
}

const patch = <T>(input:string|URL|Request, payload?: JSONPatch[], options?:RequestInit) => {
  return post<T>(input, payload, {method: 'PATCH', ...options})
}

const deleteF = <T>(input:string|URL|Request, payload?: unknown, options?:RequestInit) => {
  if (payload == undefined)
    return get<T>(input, {method: 'DELETE', ...options})
  return post<T>(input, payload, {method: 'DELETE', ...options})
}

/**
 * Convenience wrapper around fetch to get, post, put, and delete JSON
 * 
 * @example
 * interface Profile {email:string, name:string}
 *
 * restClient.get<Profile>('/api/v1/userprofile')
 * .then(profile=>setProfile(profile))
 * .catch(err=>console.log(err))
 * 
 * @throws ResponseError that with full response as `res` if !res.ok
 */
export const restClient = { get, post, put, patch, delete: deleteF }