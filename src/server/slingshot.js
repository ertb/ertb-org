import s3conf from './s3-conf';

Slingshot.fileRestrictions( "uploadToAmazonS3", {
  allowedFileTypes: [ "image/png", "image/jpeg", "image/gif",
    "application/pdf", //.pdf
    "application/msword", //.doc
    "application/vnd.ms-excel", //.xls
    "application/vnd.ms-powerpoint", //.ppt
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", //.docx
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", //.xlsx
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", //.pptx
  ],
  maxSize: 10 * 1024 * 1024 // 10MB
});

Slingshot.createDirective( "uploadToAmazonS3", Slingshot.S3Storage, {
  acl: "public-read",
  bucket: s3conf.bucket,
  region: s3conf.region,
  AWSAccessKeyId: s3conf.key,
  AWSSecretAccessKey: s3conf.secret,
  authorize: function () {
    let userFileCount = Files.find().count();
    return userFileCount < 500 ? true : false; // Max of 500 files
  },
  key: function ( file ) {
    return file.name;
  }
});

