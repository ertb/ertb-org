Meteor.publish( 'files', function(){
  var data = Files.find({});

  if ( data ) {
    return data;
  }

  return this.ready();
});
