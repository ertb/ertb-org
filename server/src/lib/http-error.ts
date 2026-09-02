import { NextFunction, Request, Response } from 'express'
import { STATUS_CODES } from 'http'
import url from 'url'

interface Extras {[key:string]:any}

class HTTPError extends Error {
  statusCode: number
  constructor(code: number, message:string, extras?:Extras) {
    super(message || STATUS_CODES[code])
    if (extras) {
      Object.assign(this, extras)
    }
    this.name = toName(code)
    this.statusCode = code
  }
}
export default HTTPError

/**
 * Converts an HTTP status code to an Error `name`.
 * Ex:
 *   302 => "Found"
 *   404 => "NotFoundError"
 *   500 => "InternalServerError"
 */

export function toName (code: number) {
  const name = (STATUS_CODES[code] || 'Undefined').replace(/ /g, '')
  const suffix = (code >= 400 && code < 600 && !name.endsWith('Error')) ? 'Error' : ''
  return name + suffix
}

/**
 * A few common instances.
 */

export function BadRequestError (message:string, extras?:Extras) {
  return new HTTPError(400, message, extras)
}

export function UnauthorizedError (message:string, extras?:Extras) {
  return new HTTPError(401, message, extras)
}

export function ForbiddenError (message:string, extras?:Extras) {
  return new HTTPError(403, message, extras)
}

export function NotFoundError (message:string, extras?:Extras) {
  return new HTTPError(404, message, extras)
}

interface RedirectExtras {
  headers?: {
    Location?: string
  }
}

export function Redirect (location:URL|string, code=302, extras:RedirectExtras={}) {
  if ('object' === typeof location) {
    location = url.format(location)
  }
  if ('string' !== typeof location) {
    throw new TypeError('A redirection `location` string or object must be given')
  }
  if ((code / 100 | 0) !== 3) {
    throw new TypeError(`\`code\` must be a 3xx redirect status code (i.e. 302), got ${code}`)
  }

  const message = `Redirecting to ${ JSON.stringify(location) }`
  if (!extras.headers) extras.headers = {}
  extras.headers.Location = location
  return new HTTPError(code, message, extras)
}

/**
 * Express error handler. Catches HTTPError and returns status codes otherwise returns 500.
 * 
 * @example
 * app.express()
 * // ... add routes to app
 * app.use(ErrorHandler)
 */
export const ErrorHandler = (error:Error, _req:Request, res:Response, next: NextFunction) => {
  if (res.headersSent) return next(error)
  if (error instanceof HTTPError) {
    res.status(error.statusCode).send({error: error.message})
    return
  }
  console.error(`Unexpected Error: ${error}`)
  if (error.stack) console.error(error.stack)
  res.status(500).send({error: 'Unexpected error encountered. Check server log for details.'})
}