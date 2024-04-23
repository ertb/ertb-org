// Original copied from https://github.com/pilwon/express-promise-wrap/blob/master/src/index.ts
// License is MIT per package.json

/* eslint-disable @typescript-eslint/no-explicit-any */
import { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from 'express'

export type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>
export type AsyncErrorRequestHandler = (err: any, req: Request, res: Response, next: NextFunction) => Promise<any>

export function wrapAsync(fn: AsyncRequestHandler | AsyncErrorRequestHandler): RequestHandler | ErrorRequestHandler {
  if (fn.length < 4) {
    return (req: Request, res: Response, next: NextFunction): any => {
      return (<AsyncRequestHandler> fn)(req, res, next).catch(next)
    }
  } else {
    return (err: any, req: Request, res: Response, next: NextFunction): any => {
      return (<AsyncErrorRequestHandler> fn)(err, req, res, next).catch(next)
    }
  }
}