Template.footer.helpers({
  version() {
    if (Meteor.settings.public.source_version) {
      return "Build " + Meteor.settings.public.source_version.substr(0,7)
    }
  }
})
