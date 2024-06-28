import { Router } from 'express'
import { userprofile } from './userprofile'
import { MongoRestRouter } from '@/lib/mongo-rest-route'
import { memberSchema } from '@/model/members'
import { fileSchema } from '@/model/files'
import { postMessage } from './messages/post-message'
import { uploadFilesRouter } from './files/upload-files-router'
import { checkUser } from '../check-user'
import { userSchema } from '@/model/users'
import { messageSchema } from '@/model/messages'

const router = Router()
export const v1 = router

const sortOrder = {order:1}
const sortNewest = {added:-1}

// public
router.get('/userprofile', userprofile)
router.use('/files', MongoRestRouter('files', fileSchema, {methods:['GET'], sort: sortNewest}))
router.use('/members', MongoRestRouter('members', memberSchema, {methods:['GET'], sort: sortOrder}))
router.post('/messages', postMessage)

// admin
router.use('/users', checkUser('admin'), MongoRestRouter('users', userSchema))
router.use('/members', checkUser('admin'), MongoRestRouter('members', memberSchema, {methods: ['POST', 'PUT', 'PATCH', 'DELETE']}))
router.use('/messages', checkUser('admin'), MongoRestRouter('messages', messageSchema, {methods:['GET', 'DELETE'], sort: sortNewest}))

// since files also needs to manage s3 we can't use MongoRestRouter directly
router.use('/files', checkUser('admin'), uploadFilesRouter) // POST, PATCH, and DELETE