import moment from 'moment';

Template.manageFile.onRendered(function() {
  this.$('[data-toggle="tooltip"]').tooltip();
});

var inputTimeout;
Template.manageFile.events({
  'click .delete'(event, template) {
    event.preventDefault();
    $(event.target).tooltip('hide');
    Modules.client.removeFromAmazonS3({ file: this, event: event, template: template });
  },

  'input #filename'(event, template) {
    if (inputTimeout) clearTimeout(inputTimeout);
    inputTimeout = setTimeout(function () {
      var filename = $(event.target).val();
      console.log('this.url: ' + this.url);
      console.log('filename: ' + filename);
      Modules.client.renameFile({ file: this, filename: filename, event: event, template: template });
    }.bind(this), 500);
  },

  'click .moveToTop'(event, template) {
    event.preventDefault();
    var url = this.url;
    Meteor.call('files.top', url, function (err, res) {
      if (err) {
        Bert.alert(err.message, 'warning');
      }
      else {
        Bert.alert("Moved to top!", 'success');
      }
    });
  }
});

Template.manageFile.helpers({
  isImage( url ) {
    const formats = [ 'jpg', 'jpeg', 'png', 'gif' ];
    return _.find( formats, ( format ) => url.indexOf( format ) > -1 );
  },
  filename() {
    return this.url.substring(this.url.lastIndexOf('/')+1);
  }
});

var tags = [
  { name: 'Agenda', value: 'agenda' },
  { name: 'Reports', value: 'reports' },
  { name: 'Minutes', value: 'minutes' },
  { name: 'Financials', value: 'financials' },
  { name: 'Grants', value: 'grants' },
  { name: 'RFP', value: 'rfp' },
  { name: 'Hidden', value: 'hidden' },
];

Template.filetag.helpers({
  isSelected( tag ) {
    if (this.file.tag === tag) return 'selected';
  },

  selectedTag() {
    if (this.file.tag) {
      for (var i = 0; i < tags.length; i++) {
        if (tags[i].value == this.file.tag) return tags[i].name;
      }
    }
    return 'Select Tag';
  },

  tags: tags
});

Template.filetag.events({
  'click .dropdown-item'(event, template) {
    event.preventDefault();
    var tag = $(event.target).data('value');
    var url = this.file.url;
    Meteor.call('files.tag', url, tag, function (err, res) {
      if (err) {
        Bert.alert(err.message, 'warning');
      }
      else {
        Bert.alert("Tag updated!", 'success');
      }
    });
  }
});
