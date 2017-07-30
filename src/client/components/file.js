import moment from 'moment';

Template.file.onRendered(function() {
  this.$('[data-toggle="tooltip"]').tooltip();
});

Template.file.helpers({
  isImage( url ) {
    const formats = [ 'jpg', 'jpeg', 'png', 'gif' ];
    return _.find( formats, ( format ) => url.indexOf( format ) > -1 );
  },
  filename() {
    return this.url.substring(this.url.lastIndexOf('/')+1);
  }
});
