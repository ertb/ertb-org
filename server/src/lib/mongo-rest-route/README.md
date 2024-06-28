
# Mongo REST Route

The **MongoRestRoute** function exposes a Mongo collection via a REST API. 

> **Note**: I plan to open-source the mongo-rest-route implementation, but it needs unit tests first!

## An example

The following let's you expose a mongo collection **members** as a REST API.

1. Ensure the `MONGO_URL` is set as an env var (that's what the `withDb` middleware uses). For example: `mongodb://user:pass@localhost:27017/db`.

   An alternative is to call **MongoRestRoute** with an **options.db** defined.

2. define a schema using JSON Schema syntax:

   **members.ts**
   ```
   export interface Member {
     _id: string
     name: string
     email: string
     address?: string
     phone?: string
   }
   
   export const memberSchema:JSONSchemaType<Member> = {
     type: 'object',
     properties: {
       _id: {type: 'string'},
       name: {type: 'string'},
       email: {type: 'string', format: 'email'},
       address: {type: 'string', nullable: true},
       phone: {type: 'string', nullable: true},
     },
     required: ['_id', 'name', 'email'],
     additionalProperties: false,
   }
   ```

3. Add the route to the express app

   **routes.ts**
   ```
   import express from 'express'
   import { MongoRestRoute, withDb } from 'mongo-rest-route'
   import { membersSchema } from './members.ts'
   
   const app = express()
   app.use('/api/v1/members', withDb, MongoRestRoute('members', membersSchema))
   
   const port = 3000
   app.listen(port, () => {
     console.info(`Example app listening on port ${port}`)
   })
   ```

4. (Optional) You could add middleware to check read/write/delete authorizations.

   It might looks something like this:

   ```
   const validateAccess = (req:Request) => {
     const [type, jwt] = req.headers.authorization.split(' ')
     if (type.toLowerCase() != 'bearer') throw new Error('')
     // TODO: validate jwt signature...
     const decoded = JSON.parse(atob(jwt.split('.')[1]))
     return decoded
   }
   const checkAuth = (req:Request, res:Response, next:NextFunction) => {
     const accessToken = validateAccessToken(req)

     let hasPermission = false
     switch (req.method) {
       case 'GET': hasPermission = access.; break
       case 'POST': hasPermission = hasWritePermission(req); break
       case 'PUT': hasPermission = hasWritePermission(req); break
       case 'PATCH': hasPermission = hasWritePermission(req); break
       case 'DELETE': hasPermission = hasWritePermission(req); break
     }
   }
   ```

   The middleware would be added to the `app.use()` method:
   ```
   app.use('/api/v1/members', checkAuth, withDb, MongoRestRoute('members', membersSchema))
   ```

Your express app will provide the following routes:

- **GET /api/v1/members** - List members. Uses [query-to-mongo]{https://www.npmjs.com/package/query-to-mongo} to turn query parameters into search criteria.
- **GET /api/v1/members/:id** - Retrieve a member.
- **POST /api/v1/members** - Store a new member or bulk store a list of members. Response includes **insertedId** or **insertedIds** respectively.
- **PUT /api/v1/members/:id** - Update a member.
- **PATCH /api/v1/members/:id** - Update parts of a member using [JSON Patch](https://jsonpatch.com/).
- **DELETE /api/v1/members/:id** - Delete a member. Set's the deletedOn property, moving it to the archive.

As well as the following _archive_ related routes. Deleted members are put in the archive (marked with a `deletedOn` field), not deleted immediately.

- **GET /api/v1/members/archive** - List archived members. Uses [query-to-mongo]{https://www.npmjs.com/package/query-to-mongo} to turn query parameters into search criteria.
- **GET /api/v1/members/archive/:id** - Retrieve an archived member.
- **PATCH /api/v1/members/archive/:id** - Modify an archived member. Useful for removing the deletedOn property, restoring the member entry.
- **DELETE /api/v1/members/archive/:id** - Delete a member permanently.

## API

### MongoRestRoute

**Parameters**
- **collection** `string` name of collection
- **schema** `JSONSchemaType` a JSON Schema definition
- **options.Db** `mongodb.Db` (Optional) Mongo database. Uses req.db if unset.
- **options.methods** `string[]` (Optional) List of methods to provide. List can include any of: `'GET'`, `'POST'`, `'PUT'`, `'PATCH'`, and `'DELETE'`. Provides all if unset.
- **options.noGetSearch** `boolean` (Optional) Do not provide the GET / route for searching.
- **options.noPostBulk** `boolean` (Optional) Do not allow an array to be provided to the POST method.
- **options.resultsField** `string` (Optional) Use this instead of the collection name as the search result field.
- **options.noArchive** `boolean` (Optional) Don't set the deletedOn property upon DELETE, remove it immediately.
- **options.dateFields.createdOn** `string` (Optional) Use this instead of 'createdOn' for tracking the POST operations.
- **options.dateFields.modifiedOn** `string` (Optional) Use this instead of 'modifiedOn' for tracking PUT and PATCH operations.
- **options.dateFields.deletedOn** `string` (Optional) Use this instead of 'deletedOn' for tracking DELETE operations.

**Returns**
- an `express.Router` that exposes the collection via a REST API.

### withDb

A middleware function that attaches a Mongo database instance (`mongodb.Db`) to the request
context. The database connection is defined by the env var `MONGO_URL`.

**Parameters**

The parameters are the typical express middleware parameters.

- `express.Request` The request context.
- `express.Response` The response context.
- `express.NextFunction` (Optional) A function to proceed to next processing step for route.