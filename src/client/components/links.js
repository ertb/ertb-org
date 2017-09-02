Template.links.onCreated( () => Template.instance().subscribe( 'links' ) );

Template.links.helpers({
  links() {
    var links = Links.find({tag: this.tag}, {sort: {added: -1}});
    if ( links ) {
      return links;
    }
  }
});
