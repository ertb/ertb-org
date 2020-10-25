import { Members } from '/lib/collections'

Template.members.onCreated( () => Template.instance().subscribe( 'members' ) )

Template.members.helpers({
  members() {
    var members = Members.find({tag: this.tag}, {sort: {added: -1}, limit: this.max || 0})
    if ( members ) {
      return members
    }
  },
  more() {
    return Members.find({tag: this.tag}).count() - (this.max || 0)
  },
  hasMore() {
    return Members.find({tag: this.tag}).count() > this.max
  },
  divClasses() {
    var count = Members.find({tag: this.tag}).count()
    if (count == 1) return "col-lg-12"
    if (count == 2) return "col-lg-6"
    else return "col-md-6 col-lg-4"
  },
})
