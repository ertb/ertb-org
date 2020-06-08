Meteor.publish( 'members', function(){
  var data = Members.find({});

  if ( data ) {
    return data;
  }

  return this.ready();
});
