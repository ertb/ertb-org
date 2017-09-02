Meteor.methods({
  'links.insert': function( url, linkText ) {
    check( url, String );
    check( linkText, String );

    var exists = Links.findOne( { "url": url }, { fields: { "_id": 1 } } );
    if (exists) {
       throw Meteor.Error( "link-error", "Sorry, this url is already listed!");
    }

    Links.insert({
      url: url,
      linkText: linkText,
      added: new Date()
    });
  },

  'links.remove': function (id) {
    check( id, String );
    Links.remove(id);
  },

  'links.tag': function (id, tag) {
    check( id, String );
    check( tag, String );
    Links.update(id, { $set: { tag: tag } });
  },

  'links.top': function (id) {
    check( id, String );
    Links.update(id, { $set: { added: new Date()} });
  },

  'links.edit': function (id, url, linkText) {
    check( id, String );
    check( url, String );
    check( linkText, String );

    var exists = Links.findOne( { "url": url }, { fields: { "_id": 1 } } );
    if (exists && exists._id != id) {
       throw Meteor.Error( "link-error", "Sorry, this url is already listed!");
    }
    Links.update(id, { $set: { url: url, linkText: linkText }});
  }
});
