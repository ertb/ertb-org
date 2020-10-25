import { Members } from '/lib/collections'

Meteor.methods({
  'members.insert': function( name, title, details) {
    check( name, String );
    check( title, String );
    check( details, String );

    var exists = Members.findOne( { "name": name}, { fields: { "_id": 1 } } );
    if (exists) {
       throw Meteor.Error( "member-error", "Sorry, this name is already listed!");
    }

    Members.insert({
      name: name,
      title: title,
      details: details,
      added: new Date()
    });
  },

  'members.remove': function (id) {
    check( id, String );
    Members.remove(id);
  },

  'members.tag': function (id, tag) {
    check( id, String );
    check( tag, String );
    Members.update(id, { $set: { tag: tag } });
  },

  'members.top': function (id) {
    check( id, String );
    Members.update(id, { $set: { added: new Date()} });
  },

  'members.edit': function (id, name, title, details) {
    check( id, String );
    check( name, String );
    check( title, String );
    check( details, String );

    var exists = Members.findOne( { "name": name}, { fields: { "_id": 1 } } );
    if (exists && exists._id != id) {
       throw Meteor.Error( "member-error", "Sorry, this name is already listed!");
    }
    Members.update(id, { $set: { name: name, title: title, details, details }});
  }
});
