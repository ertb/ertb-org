import { Response } from "express"

export const sendUnexpctedError = (res:Response, err:Error) => {
  console.error(`Unexpected Error: ${err}`)
  if (err.stack) console.error(err.stack)
  res.status(500).send({err: 'Unexpected error encountered. Check server log for details.'})
}