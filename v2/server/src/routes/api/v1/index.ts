import { Router } from 'express'
import { files } from './files'
import { userinfo } from './userinfo'

const router = Router()
router.use('/files', files)
router.use('/userinfo', userinfo)

export const v1 = router