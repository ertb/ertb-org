//var basicAuth = new HttpBasicAuth("guest", "ertb-preview");
//basicAuth.protect();

if (process.env.ADMIN_USERNAME) {
  Meteor.settings.adminCredentials = {
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD
  }
}

var adminAuth = new HttpBasicAuth(Meteor.settings.adminCredentials.username, Meteor.settings.adminCredentials.password);
adminAuth.protect(['/admin', '/admin/messages', '/admin/files']);
