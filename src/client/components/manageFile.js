import moment from 'moment'
import { ReactiveDict } from 'meteor/reactive-dict'

import renameFile from '../lib/rename-file'

Template.manageFile.onCreated(function() {
  this.state = new ReactiveDict()
})

Template.manageFile.onRendered(function() {
})

Template.manageFile_showing.onRendered(function() {
  this.$('[data-toggle="tooltip"]').tooltip()
  this.$('[data-toggle="tooltip"]').on('click', function() {
    $(this).tooltip('hide')
  })
})

Template.manageFile_deleting.onRendered(function() {
  this.$('[data-toggle="tooltip"]').tooltip()
  this.$('[data-toggle="tooltip"]').on('click', function() {
    $(this).tooltip('hide')
  })
  this.$('[data-toggle="tooltip"]').tooltip('show')
})

Template.manageFile.events({
  'click .delete'(event, template) {
    event.preventDefault()

    template.state.set('isDeleting', true)
    template.deleteTimeout = setTimeout(function () {

      Meteor.call("files.remove", this.url, ( error ) => {
        if ( error ) {
          Bert.alert( error.reason, "warning" )
        } else {
          Bert.alert( "File removed from Amazon S3!", "success" )
        }
        template.state.set('isDeleting', false)
      })
    }.bind(this), 5000)
  },

  'click .undo-delete'(event, template) {
    event.preventDefault()
    if (template.deleteTimeout) clearTimeout(template.deleteTimeout)
    template.state.set('isDeleting', false)
  },

  'input #filename'(event, template) {
    if (template.inputTimeout) clearTimeout(template.inputTimeout)
    template.inputTimeout = setTimeout(function () {
      var filename = $(event.target).val()
      console.log('this.url: ' + this.url)
      console.log('filename: ' + filename)
      const target = $(event.target)
      const caret = target.is(":focus") ? target.caret() : false
      target.prop('disabled', true)
      renameFile({ file: this, filename: filename, event: event, template: template }, function() {
        var otherInputFocused = $('input:focus').length > 0
        target.prop('disabled', false)
        if (caret && !otherInputFocused) target.caret(caret.start, caret.end)
      })
    }.bind(this), 1000)
  },

  'click .moveToTop'(event, template) {
    event.preventDefault()
    var url = this.url
    Meteor.call('files.top', url, function (err, res) {
      if (err) {
        Bert.alert(err.message, 'warning')
      }
      else {
        Bert.alert("Moved to top!", 'success')
      }
    })
  }
})

Template.manageFile.helpers({
  isDeleting() {
    const instance = Template.instance()
    return instance.state.get('isDeleting')
  },
  isImage( url ) {
    const formats = [ 'jpg', 'jpeg', 'png', 'gif' ]
    return _.find( formats, ( format ) => url.indexOf( format ) > -1 )
  },
  filename() {
    return this.url.substring(this.url.lastIndexOf('/')+1)
  }
})

var tags = [
  { name: 'Agenda', value: 'agenda' },
  { name: 'Reports', value: 'reports' },
  { name: 'Minutes', value: 'minutes' },
  { name: 'Financials', value: 'financials' },
  { name: 'Grants', value: 'grants' },
  { name: 'RFP', value: 'rfp' },
  { name: 'Hidden', value: 'hidden' },
]

Template.manageFile_filetag.helpers({
  isSelected( tag ) {
    if (this.file.tag === tag) return 'selected'
  },

  selectedTag() {
    if (this.file.tag) {
      for (var i = 0; i < tags.length; i++) {
        if (tags[i].value == this.file.tag) return tags[i].name
      }
    }
    return 'Select Tag'
  },

  tags: tags
})

Template.manageFile_filetag.events({
  'click .dropdown-item'(event, template) {
    event.preventDefault()
    var tag = $(event.target).data('value')
    var url = this.file.url
    Meteor.call('files.tag', url, tag, function (err, res) {
      if (err) {
        Bert.alert(err.message, 'warning')
      }
      else {
        Bert.alert("Tag updated!", 'success')
      }
    })
  }
})
