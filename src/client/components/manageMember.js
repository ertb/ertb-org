import moment from 'moment';
import { ReactiveDict } from 'meteor/reactive-dict';

Template.manageMember.onCreated(function() {
  this.state = new ReactiveDict();
});

Template.manageMember.onRendered(function() {
});

Template.manageMember_showing.onRendered(function() {
  this.$('[data-toggle="tooltip"]').tooltip();
  this.$('[data-toggle="tooltip"]').on('click', function() {
    $(this).tooltip('hide');
  });
});

Template.manageMember_deleting.onRendered(function() {
  this.$('[data-toggle="tooltip"]').tooltip();
  this.$('[data-toggle="tooltip"]').on('click', function() {
    $(this).tooltip('hide');
  });
  this.$('[data-toggle="tooltip"]').tooltip('show');
});

function editMember(template, member, name, title, details) {

}

Template.manageMember.events({
  'click .delete'(event, template) {
    event.preventDefault();

    template.state.set('isDeleting', true);
    template.deleteTimeout = setTimeout(function () {

      console.log('template.data._id', template.data._id)
      Meteor.call("members.remove", template.data._id, ( error ) => {
        if ( error ) {
          Bert.alert( error.reason, "warning" );
        } else {
          Bert.alert( "Member removed!", "success" );
        }
        template.state.set('isDeleting', false);
      });
    }.bind(this), 5000);
  },

  'click .undo-delete'(event, template) {
    event.preventDefault();
    if (template.deleteTimeout) clearTimeout(template.deleteTimeout);
    template.state.set('isDeleting', false);
  },

  'input #name, input #title, input #details'(event, template) {
    if (template.inputTimeout) clearTimeout(template.inputTimeout);
    template.inputTimeout = setTimeout(function () {
      var name = template.$('input#name').val()
      var title = template.$('input#title').val()
      var details = template.$('input#details').val()
      console.log('name: ' + name);
      console.log('title: ' + title);
      console.log('details: ' + details);
      const target = $(event.target)
      const caret = target.is(":focus") ? target.caret() : false;
      target.prop('disabled', true);
      Meteor.call('members.edit', template.data._id, name, title, details, function (err, res) {
        if (err) {
          Bert.alert(err.message, 'warning');
        }
        else {
          Bert.alert("Member updated!", 'success');
        }
        var otherInputFocused = $('input:focus').length > 0;
        target.prop('disabled', false);
        if (caret && !otherInputFocused) target.caret(caret.start, caret.end);
      });
    }.bind(this), 1000);
  },

  'click .moveToTop'(event, template) {
    event.preventDefault();
    Meteor.call('members.top', template.data._id, function (err, res) {
      if (err) {
        Bert.alert(err.message, 'warning');
      }
      else {
        Bert.alert("Moved to top!", 'success');
      }
    });
  }
});

Template.manageMember.helpers({
  isDeleting() {
    const instance = Template.instance();
    return instance.state.get('isDeleting');
  },
});

var tags = [
  { name: 'Board', value: 'board' },
  { name: 'Support', value: 'support' },
  { name: 'Hidden', value: 'hidden' },
];

Template.manageMember_membertag.helpers({
  isSelected( tag ) {
    if (this.member.tag === tag) return 'selected';
  },

  selectedTag() {
    if (this.member.tag) {
      for (var i = 0; i < tags.length; i++) {
        if (tags[i].value == this.member.tag) return tags[i].name;
      }
    }
    return 'Select Tag';
  },

  tags: tags
});

Template.manageMember_membertag.events({
  'click .dropdown-item'(event, template) {
    event.preventDefault();
    var tag = $(event.target).data('value');
    Meteor.call('members.tag', template.data.member._id, tag, function (err, res) {
      if (err) {
        Bert.alert(err.message, 'warning');
      }
      else {
        Bert.alert("Tag updated!", 'success');
      }
    });
  }
});
