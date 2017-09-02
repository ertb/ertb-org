FlowRouter.route('/', {
  name: 'home',
  action: function(params, queryParams) {
    BlazeLayout.render('appLayout', { main: 'landingPage' });
  }
});

FlowRouter.route('/admin', {
  name: 'admin',
  action: function(params, queryParams) {
    BlazeLayout.render('appLayout', { main: 'adminPage' });
  }
});

FlowRouter.route('/admin/files', {
  name: 'admin.files',
  action: function(params, queryParams) {
    BlazeLayout.render('appLayout', { main: 'filesPage' });
  }
});

FlowRouter.route('/admin/links', {
  name: 'admin.links',
  action: function(params, queryParams) {
    BlazeLayout.render('appLayout', { main: 'linksPage' });
  }
});

FlowRouter.route('/admin/messages', {
  name: 'admin.messages',
  action: function(params, queryParams) {
    BlazeLayout.render('appLayout', { main: 'messagesPage' });
  }
});

FlowRouter.notFound = {
  action: function() {
    BlazeLayout.render('appLayout', { main: 'notFoundPage' });
  }
};
