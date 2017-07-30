Template.file.events({
  'click .delete'(event, template) {
    console.log(this);
    Modules.client.removeFromAmazonS3({ file: this, event: event, template: template });
  }
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
