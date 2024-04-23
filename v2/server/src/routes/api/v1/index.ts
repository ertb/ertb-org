import { Router } from 'express'
import { files } from './files'
import { userprofile } from './userprofile'

const router = Router()
router.use('/files', files)
router.use('/userprofile', userprofile)

export const v1 = router