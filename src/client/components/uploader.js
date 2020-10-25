import uploadToAmazonS3 from '../lib/upload-to-amazon-s3'

Template.uploader.events({
  'change input[type="file"]' ( event, template ) {
    uploadToAmazonS3( { event: event, template: template } )
  }
})
