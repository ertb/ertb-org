import s3conf from '../s3-conf'
import knox from 'knox'
import Future from 'fibers/future'

Meteor.methods({
  'files.insert': function( url ) {
    check( url, String );

    var exists = Files.findOne( { "url": url }, { fields: { "_id": 1 } } );
    if (exists) {
       throw Meteor.Error( "file-error", "Sorry, this file already exists!");
    }

    Files.insert({
      url: url,
      added: new Date() 
    });
  },

  'files.remove': function (url) {
    check( url, String );

    var s3 = knox.createClient({
      key: s3conf.key,
      secret: s3conf.secret,
      region: s3conf.region,
      bucket: s3conf.bucket
    });

    var filename = url.substring(url.lastIndexOf('/'));
    Meteor.wrapAsync(s3.deleteFile, s3)(filename);
    Files.remove({ url: url });
  },

  'files.tag': function (url, tag) {
    check( url, String );
    check( tag, String );

    Files.update({ url: url }, { $set: { tag: tag } });
  },

  'files.top': function (url) {
    check( url, String );

    Files.update({ url: url }, { $set: { added: new Date()} });
  },

  'files.rename': function (url, filename) {
    check( url, String );
    check( filename, String );

    var s3 = knox.createClient({
      key: s3conf.key,
      secret: s3conf.secret,
      region: s3conf.region,
      bucket: s3conf.bucket
    });

    var from = url.substring(url.lastIndexOf('/'));
    var to = '/' + filename;
    var newUrl = url.substring(0, url.lastIndexOf('/')) + to;

    Meteor.wrapAsync(s3.copyFile, s3)(from, to, { 'x-amz-acl': 'public-read' });
    Meteor.wrapAsync(s3.deleteFile, s3)(from);
    Files.update({ url: url }, { $set: { url: newUrl }});
  }
});

