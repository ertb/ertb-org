let template

let _getFileFromInput = ( event ) => {
  return event.target.files[0]
}

let _setPlaceholderText = ( string = "Click or Drag a File Here to Upload" ) => {
  template.find( ".alert span" ).innerText = string
}

let _addUrlToDatabase = ( url, next ) => {
  Meteor.call( "files.insert", url, ( error ) => {
    if ( error ) {
      console.log(error)
      console.log('db error ' + error.reason)
      Bert.alert( error.reason, "warning" )
      _setPlaceholderText()
    } else {
      Bert.alert( "File uploaded to Amazon S3!", "success" )
      _setPlaceholderText()
    }
    if (typeof next === 'function') next()
  })
}

let _uploadFileToAmazon = ( file, next ) => {
  const uploader = new Slingshot.Upload( "uploadToAmazonS3" )

  uploader.send( file, ( error, url ) => {
    if ( error ) {
      console.log(error)
      console.log('upload error ' + error.message)
      Bert.alert( error.message, "warning" )
      _setPlaceholderText()
      if (typeof next === 'function') next()
    } else {
      console.log('upload success')
      _addUrlToDatabase( url, next )
    }
  })
}

let uploadToAmazonS3 = ( options ) => {
  template = options.template
  let file = _getFileFromInput( options.event )

  _setPlaceholderText( `Uploading ${file.name}...` )
  _uploadFileToAmazon( file, () => template.find('form').reset() )
}

export default uploadToAmazonS3
