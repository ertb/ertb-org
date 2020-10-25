import { Files } from '/lib/collections'

Template.manageFiles.onCreated( () => Template.instance().subscribe( 'files' ) )

Template.manageFiles.helpers({
  files() {
    var files = Files.find({}, {sort: {added: -1}})
    if ( files ) {
      return files
    }
  }
})
