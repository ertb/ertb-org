import moment from 'moment';

Template.link.onRendered(function() {
  this.$('[data-toggle="tooltip"]').tooltip();
});
