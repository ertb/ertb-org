import moment from 'moment';
var timeTick = new Tracker.Dependency();

Meteor.setInterval(function() {
  timeTick.changed();
}, 60000);

Template.registerHelper('timeAgo', function(datetime) {
  timeTick.depend();
  return moment(datetime).fromNow();
});
