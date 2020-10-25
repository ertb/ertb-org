// Example: S3='{"s3":{"key": "xxx", "secret": "xxx", "bucket": "xxx", "region": "xxx""}}' meteor
if (process.env.S3) {
  Meteor.settings.s3 = JSON.parse(process.env.S3).s3
}

const s3Conf = Meteor.settings.s3 || {}
