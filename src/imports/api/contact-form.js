import '/imports/schema/contact-form'

const Messages = new Mongo.Collection('messages');

Meteor.methods({
  'contactForm.messages.archive': function(id) {
    Messages.update(id, { $set: { archive: true }});
  },

  'contactForm.sendEmail': function(data) {
    check(data, Schema.contactForm);

    this.unblock();

    Messages.insert({
      date: new Date(),
      clientAddress: this.connection.clientAddress,
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message
    });

    var text = "Name: " + data.name + "\n"
    + "Phone: " + data.phone + "\n"
    + "Email: " + data.email + "\n\n\n"
    + data.message + "\n\n\n"
    + "clientAddress: " + this.connection.clientAddress;

    // need to setup amazon ses
    // MAIL_URL = smtp://USERNAME:PASSWORD@HOST:PORT
    Email.send({
      to: Meteor.settings.contactForm.emailTo,
      from: data.email,
      subject: "ertb.org Contact Form - Message From " + data.name,
      text: text
    });
  }
});

if (Meteor.isServer) {
  Meteor.publish('contactForm.messages', function() {
    Counts.publish(this, 'archivedCount', Messages.find({archive: true}), {noReady: true});
    return Messages.find({archive: {$ne: true}});
  });
}
