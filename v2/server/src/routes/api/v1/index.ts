import { Router } from 'express'
import { files } from './files'
import { userprofile } from './userprofile'
import { members } from './members'
import { messages } from './messages'

const router = Router()
router.use('/files', files)
router.use('/members', members)
router.use('/messages', messages)
router.use('/userprofile', userprofile)

export const v1 = router