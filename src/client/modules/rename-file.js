
Modules.client.renameFile = function (options) {
  var url = options.file.url;
  var filename = options.filename;

  Meteor.call('files.rename', url, filename, function (err, res) {
    if (err) {
      Bert.alert(err.message, 'warning');
    }
    else {
      Bert.alert("File renamed!", 'success');
    }
  });
};
