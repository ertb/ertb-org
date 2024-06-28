db = db.getSiblingDB('db')

db.createUser({
  user: 'user',
  pwd: 'pass',
  roles: [{ role: 'readWrite', db: 'db' }],
});
db.createCollection('files')
db.createCollection('links')
db.createCollection('members')
db.createCollection('messages')
db.createCollection('users')

