import '/imports/ui/jqBootstrapValidation'

Template.contactForm.onRendered(function() {
  $("#contactForm input,#contactForm textarea").jqBootstrapValidation({
    preventSubmit: true,
    submitError: function($form, event, errors) {
      // additional error messages or events
    },
    submitSuccess: function($form, event) {
      event.preventDefault(); // prevent default submit behaviour
    },
    filter: function() {
      return $(this).is(":visible")
    },
  })
})

Template.contactForm.events({
  'submit #contactForm'(event) {
    console.log('form submitted')

    // get values from FORM
    var name = $("input#name").val()
    var email = $("input#email").val()
    var phone = $("input#phone").val()
    var message = $("textarea#message").val()

    data = {
        name: name,
        phone: phone,
        email: email,
        message: message
    }

    Meteor.call('contactForm.sendEmail', data, (err, res) => {
      if (err) {
        // Fail message
        $('#success').html("<div class='alert alert-danger'>")
        $('#success > .alert-danger').html("<button type='button' class='close' data-dismiss='alert' aria-hidden='true'>&times;")
          .append("</button>")
        $('#success > .alert-danger').append($("<strong>").text("Sorry, it seems that my mail server is not responding. Please try again later!"))
        $('#success > .alert-danger').append('</div>')
     } else {
        // Success message
        $('#success').html("<div class='alert alert-success'>")
        $('#success > .alert-success').html("<button type='button' class='close' data-dismiss='alert' aria-hidden='true'>&times;")
          .append("</button>")
        $('#success > .alert-success')
          .append("<strong>Your message has been sent. </strong>")
        $('#success > .alert-success')
          .append('</div>')
     }
     //clear all fields
     $('#contactForm').trigger("reset")
   })

  },
})
