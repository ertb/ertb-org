Template.manageLinks.onCreated( () => Template.instance().subscribe( 'links' ) );

Template.manageLinks.helpers({
  links() {
    var links = Links.find({}, {sort: {added: -1}});
    if ( links ) {
      return links;
    }
  }
});
