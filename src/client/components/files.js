Template.files.onCreated( () => Template.instance().subscribe( 'files' ) );

Template.files.helpers({
  files() {
    var files = Files.find({tag: this.tag}, {sort: {added: -1}});
    if ( files ) {
      return files;
    }
  }
});
