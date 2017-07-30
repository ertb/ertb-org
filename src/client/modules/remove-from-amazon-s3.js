let template;

let _deleteFileFromAmazon = ( url ) => {
  Meteor.call("files.remove", url, ( error ) => {
    if ( error ) {
      Bert.alert( error.reason, "warning" );
    } else {
      Bert.alert( "File removed from Amazon S3!", "success" );
    }
  });
};

let deleteFile = ( options ) => {
  file = options.file;
  _deleteFileFromAmazon( file.url );
};

Modules.client.removeFromAmazonS3 = deleteFile;
