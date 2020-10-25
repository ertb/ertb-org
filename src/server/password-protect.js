import { Meteor } from 'meteor/meteor'
import HttpBasicAuth from './http-basic-auth'

//var basicAuth = new HttpBasicAuth("guest", "ertb-preview")
//basicAuth.protect()

if (process.env.ADMIN_USERNAME) {
  Meteor.settings.adminCredentials = {
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD
  }
} else if (! Meteor.settings.adminCredentials) {
  console.log("No admin credentials, try running\nmeteor --settings settings.json\n OR \n" +
    "ADMIN_USERNAME='xxx' ADMIN_PASSWORD='xxx' meteor")
}

var adminAuth = new HttpBasicAuth(Meteor.settings.adminCredentials.username, Meteor.settings.adminCredentials.password)
adminAuth.protect(['/admin', '/admin/messages', '/admin/files'])
