import dotenv from 'dotenv'
dotenv.config()

import express, { Request, Response } from 'express'
import morgan from 'morgan'
import { v1 } from './routes/api/v1'
import { signingKeyRotation } from './routes/api/auth-sign-verify'
import { ErrorHandler } from './lib/http-error'

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

app.use(ErrorHandler)

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
})