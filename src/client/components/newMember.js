function newMember(template, name, title, details) {
  Meteor.call( "members.insert", name, title, details, ( error ) => {
    if ( error ) {
      console.log(error)
      console.log('db error ' + error.reason)
      Bert.alert( error.reason, "warning" )
    } else {
      Bert.alert( "Member added!", "success" )
      template.find('form').reset()
    }
    if (typeof next === 'function') next()
  })
}

Template.newMember.events({
  'submit form' ( event, template ) {
    event.preventDefault()
    var name = Template.instance().$('input#name').val()
    var title = Template.instance().$('input#title').val()
    var details = Template.instance().$('input#details').val()
    newMember(template, name, title, details)
  }
})
