import { Mongo } from 'meteor/mongo'

const Files = new Mongo.Collection('files')
const Links = new Mongo.Collection('links')
const Members = new Mongo.Collection('members')
const Messages = new Mongo.Collection('messages')

export { Files, Links, Members, Messages }