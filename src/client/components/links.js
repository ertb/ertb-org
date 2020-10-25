import { Links } from '/lib/collections'

Template.links.onCreated( () => Template.instance().subscribe( 'links' ) )

Template.links.helpers({
  links() {
    var links = Links.find({tag: this.tag}, {sort: {added: -1}, limit: this.max || 0})
    if ( links ) {
      return links
    }
  },
  more() {
    return Links.find({tag: this.tag}).count() - (this.max || 0)
  },
  hasMore() {
    return Links.find({tag: this.tag}).count() > this.max
  }
})
