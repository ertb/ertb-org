import { Files } from '/lib/collections'

Template.files.onCreated( () => Template.instance().subscribe( 'files' ) )

Template.files.helpers({
  files() {
    var files = Files.find({tag: this.tag}, {sort: {added: -1}, limit: this.max || 0})
    if ( files ) {
      return files
    }
  },
  more() {
    return Files.find({tag: this.tag}).count() - (this.max || 0)
  },
  hasMore() {
    var count = Files.find({tag: this.tag}).count()
    console.log('count', count, '> this.max', this.max, '?', count > this.max)
    return count > this.max
  }
})
