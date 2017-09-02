import moment from 'moment';
import { ReactiveDict } from 'meteor/reactive-dict';

Template.manageLink.onCreated(function() {
  this.state = new ReactiveDict();
});

Template.manageLink.onRendered(function() {
});

Template.manageLink_showing.onRendered(function() {
  this.$('[data-toggle="tooltip"]').tooltip();
  this.$('[data-toggle="tooltip"]').on('click', function() {
    $(this).tooltip('hide');
  });
});

Template.manageLink_deleting.onRendered(function() {
  this.$('[data-toggle="tooltip"]').tooltip();
  this.$('[data-toggle="tooltip"]').on('click', function() {
    $(this).tooltip('hide');
  });
  this.$('[data-toggle="tooltip"]').tooltip('show');
});

function editLink(template, link, url, text) {

}

Template.manageLink.events({
  'click .delete'(event, template) {
    event.preventDefault();

    template.state.set('isDeleting', true);
    template.deleteTimeout = setTimeout(function () {

      console.log('template.data._id', template.data._id)
      Meteor.call("links.remove", template.data._id, ( error ) => {
        if ( error ) {
          Bert.alert( error.reason, "warning" );
        } else {
          Bert.alert( "Link removed from Amazon S3!", "success" );
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

  'input #url, input #linkText'(event, template) {
    if (template.inputTimeout) clearTimeout(template.inputTimeout);
    template.inputTimeout = setTimeout(function () {
      var url = template.$('input#url').val()
      var linkText = template.$('input#linkText').val()
      console.log('template: ' + template);
      console.log('url: ' + url);
      console.log('linkText: ' + linkText);
      const target = $(event.target)
      const caret = target.is(":focus") ? target.caret() : false;
      target.prop('disabled', true);
      Meteor.call('links.edit', template.data._id, url, linkText, function (err, res) {
        if (err) {
          Bert.alert(err.message, 'warning');
        }
        else {
          Bert.alert("Link updated!", 'success');
        }
        var otherInputFocused = $('input:focus').length > 0;
        target.prop('disabled', false);
        if (caret && !otherInputFocused) target.caret(caret.start, caret.end);
      });
    }.bind(this), 1000);
  },

  'click .moveToTop'(event, template) {
    event.preventDefault();
    Meteor.call('links.top', template.data._id, function (err, res) {
      if (err) {
        Bert.alert(err.message, 'warning');
      }
      else {
        Bert.alert("Moved to top!", 'success');
      }
    });
  }
});

Template.manageLink.helpers({
  isDeleting() {
    const instance = Template.instance();
    return instance.state.get('isDeleting');
  },
  isImage( url ) {
    const formats = [ 'jpg', 'jpeg', 'png', 'gif' ];
    return _.find( formats, ( format ) => url.indexOf( format ) > -1 );
  },
});

var tags = [
  { name: 'Audio', value: 'audio' },
  { name: 'Hidden', value: 'hidden' },
];

Template.manageLink_linktag.helpers({
  isSelected( tag ) {
    if (this.link.tag === tag) return 'selected';
  },

  selectedTag() {
    if (this.link.tag) {
      for (var i = 0; i < tags.length; i++) {
        if (tags[i].value == this.link.tag) return tags[i].name;
      }
    }
    return 'Select Tag';
  },

  tags: tags
});

Template.manageLink_linktag.events({
  'click .dropdown-item'(event, template) {
    event.preventDefault();
    var tag = $(event.target).data('value');
    Meteor.call('links.tag', template.data.link._id, tag, function (err, res) {
      if (err) {
        Bert.alert(err.message, 'warning');
      }
      else {
        Bert.alert("Tag updated!", 'success');
      }
    });
  }
});
