Template.manageMembers.onCreated( () => Template.instance().subscribe( 'members' ) );

Template.manageMembers.helpers({
  members() {
    var members = Members.find({}, {sort: {added: -1}});
    if ( members ) {
      return members;
    }
  }
});
