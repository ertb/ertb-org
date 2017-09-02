function newLink(template, url, text) {
  Meteor.call( "links.insert", url, text, ( error ) => {
    if ( error ) {
      console.log(error);
      console.log('db error ' + error.reason);
      Bert.alert( error.reason, "warning" );
    } else {
      Bert.alert( "Link added!", "success" );
      template.find('form').reset()
    }
    if (typeof next === 'function') next();
  });
}

Template.newLink.events({
  'submit form' ( event, template ) {
    event.preventDefault()
    var url = Template.instance().$('input#url').val()
    var linkText = Template.instance().$('input#linkText').val()
    newLink(template, url, linkText)
  }
});
