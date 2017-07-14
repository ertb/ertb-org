Template.adminNavbar.events({
  'click #signout': function(evt){
    evt.target.blur();
    console.log('signout!');
  }
});
