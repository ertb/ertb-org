import dotenv from 'dotenv'
dotenv.config()

import express, { NextFunction, Request, Response } from 'express'
import morgan from 'morgan'
import { v1 } from './routes/api/v1'
import { signingKeyRotation } from './routes/api/auth-sign-verify'
import { ErrorHandler } from './lib/http-error'
import path from 'path'

signingKeyRotation(process.env.JWKS_ROTATION_TIME)

const app = express()

// force SSL for Heroku proxy
var forceSSL = function (req:Request, res:Response, next:NextFunction) {
  if (req.headers['x-forwarded-proto'] == 'http') {
    return res.redirect('https://' + req.get('Host') + req.url)
  }
  return next()
}
app.use(forceSSL)

app.set('json spaces', 2) 
const port = process.env.PORT || 3000

if (process.env.NODE_ENV != 'development') {
  app.use(morgan("common"));
} else {
  app.use(morgan("dev"));
}

app.use('/api/v1', v1)
const publicroot = path.join(__dirname, '../public')
app.use(express.static(publicroot))
app.get('*', (_req:Request, res:Response) => res.sendFile('index.html', {root: publicroot}))

app.use(ErrorHandler)

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
})
