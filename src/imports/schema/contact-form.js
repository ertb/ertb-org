import './schema'

Schema.contactForm = new SimpleSchema({
  name: {
    type: String,
    label: 'Your name',
    max: 64
  },
  email: {
    type: String,
    regEx: SimpleSchema.RegEx.Email,
    label: "Your e-mail"
  },
  phone: {
    type: String,
    label: "Your phone",
    max: 64
  },
  message: {
    type: String,
    label: "Message",
    max: 1024
  }
})

