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

    try {
      Files.insert({
        url: url,
        added: new Date() 
      });
    } catch (e) {
      return e;
    }
  },

  'files.remove': function (url) {
    check( url, String );

    var s3 = knox.createClient({
      key: s3conf.key,
      secret: s3conf.secret,
      region: s3conf.region,
      bucket: s3conf.bucket
    });

    try {
      Meteor.wrapAsync(s3.deleteFile, s3)(url);
      Files.remove({ url: url });
    } catch (e) {
      return e
    }
  },

  'files.tag': function (url, tag) {
    check( url, String );
    check( tag, String );

    try {
      Files.update({ url: url }, { $set: { tag: tag } });
    } catch (e) {
      return e
    }
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

    try {
      Meteor.wrapAsync(s3.copyFile, s3)(from, to);
      Meteor.wrapAsync(s3.deleteFile, s3)(url);
      Files.update({ url: url }, { $set: { url: newUrl }});
    } catch (e) {
      return e
    }
  }
});

