import { Request, Response, Router } from "express"
import { withDb } from "../with-db"

const router = Router()
export const members = router

router.use(withDb)

router.get('/', async (req: Request, res: Response) => {
  const defaultLimit = 25
  const {tag, limit:limitStr=defaultLimit.toString()} = req.query

  let limit = parseInt(limitStr.toString())
  if (isNaN(limit) || limit < 0) limit = defaultLimit

  const members = req.db.collection('members')
  const query = tag ? {tag} : {}
  let find = members.find(query).sort({added:-1})
  if (limit > 0) find = find.limit(limit)

  res.send({
    count: await members.countDocuments(query),
    members: await find.toArray()
  })
})