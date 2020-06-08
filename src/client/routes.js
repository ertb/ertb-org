FlowRouter.route('/', {
  name: 'home',
  action: function(params, queryParams) {
    $("html, body").scrollTop(0)
    BlazeLayout.render('appLayout', { main: 'landingPage' });
  }
});

FlowRouter.route('/downloads', {
  name: 'downloads',
  action: function(params, queryParams) {
    $("html, body").scrollTop(0)
    BlazeLayout.render('appLayout', { main: 'downloadsPage' });
  }
});

FlowRouter.route('/admin', {
  name: 'admin',
  action: function(params, queryParams) {
    BlazeLayout.render('appLayout', { main: 'adminPage' });
  }
});

FlowRouter.route('/admin/members', {
  name: 'admin.members',
  action: function(params, queryParams) {
    BlazeLayout.render('appLayout', { main: 'adminMembersPage' });
  }
});

FlowRouter.route('/admin/files', {
  name: 'admin.files',
  action: function(params, queryParams) {
    BlazeLayout.render('appLayout', { main: 'adminFilesPage' });
  }
});

FlowRouter.route('/admin/links', {
  name: 'admin.links',
  action: function(params, queryParams) {
    BlazeLayout.render('appLayout', { main: 'adminLinksPage' });
  }
});

FlowRouter.route('/admin/messages', {
  name: 'admin.messages',
  action: function(params, queryParams) {
    BlazeLayout.render('appLayout', { main: 'adminMessagesPage' });
  }
});

FlowRouter.notFound = {
  action: function() {
    BlazeLayout.render('appLayout', { main: 'notFoundPage' });
  }
};
