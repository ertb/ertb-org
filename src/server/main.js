import { Meteor } from 'meteor/meteor';
import '/imports/api/contact-form'

Meteor.startup(() => {
  // code to run on server at startup
});

// env.var example: S3='{"s3":{"key": "xxx", "secret": "xxx", "bucket": "xxx", "region": "xxx""}}'
if (process.env.S3) {
  Meteor.settings.s3 = JSON.parse(process.env.S3).s3;
}

if (process.env.SOURCE_VERSION) {
  console.log("source version: " + process.env.SOURCE_VERSION);
  Meteor.settings.public.source_version = process.env.SOURCE_VERSION;
}
