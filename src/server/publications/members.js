import { Mongo } from 'meteor/mongo'

import { Members } from '/lib/collections'

Meteor.publish( 'members', function(){
  var data = Members.find({})

  if ( data ) {
    return data
  }

  return this.ready()
})