Meteor.publish( 'links', function(){
  var data = Links.find({});

  if ( data ) {
    return data;
  }

  return this.ready();
});
