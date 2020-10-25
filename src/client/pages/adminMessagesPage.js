import moment from 'moment'

import { Messages } from '/lib/collections'

Template.adminMessagesPage.onCreated(function() {
  Meteor.subscribe('contactForm.messages')
})

Template.adminMessagesPage.helpers({
  hasMessages() { return Messages.find().count() > 0; },
  messages() { return Messages.find({}, {sort: {date: -1}}); },
  archivedCount(s, multipleSuffix) {
    var c = Counts.get('archivedCount')
    if (c == 0) return ''
    if (c == 1) return '' + c + ' ' + s
    return '' + c + ' ' + s + multipleSuffix
  },
})

Template.adminMessagesPage_msg.helpers({
  localDate(d) { return moment(d).format('l LT'); },
})

Template.adminMessagesPage_msg.events({
  'click #remove'() {
    Meteor.call('contactForm.messages.archive', this._id, function (err,res) {
      if (err) {
        console.log(err)
      }
    })
  }
})
