import express, { Request, Response, NextFunction } from 'express'
import dotenv from 'dotenv'
import morgan from 'morgan'
import { v1 } from './routes/api/v1'
import { signingKeyRotation } from './routes/api/auth-sign-verify'
import { sendUnexpctedError as unexpectedError } from './lib/unexpected-err-res'

dotenv.config()
signingKeyRotation(process.env.JWKS_ROTATION_TIME)

const app = express()
app.set('json spaces', 2) 
const port = process.env.PORT || 3000

if (process.env.NODE_ENV != 'development') {
  app.use(morgan("common"));
} else {
  app.use(morgan("dev"));
}

app.use('/api/v1', v1)

app.get("/", (_req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
})

// error handler
app.use((err:Error, _req:Request, res:Response, next: NextFunction) => {
  if (res.headersSent) return next(err)
  unexpectedError(res, err)
  console.error(`Unexpected Error: ${err}`)
  res.status(500).send({err: 'Unexpected error encountered. Check server log for details.'})
})

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
})