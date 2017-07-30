
Modules.client.setFileTag = function (options) {
  Meteor.call('files.tag', options.file.url, options.tag, function (err, res) {
    if (err) {
      Bert.alert(err.message, 'warning');
    }
    else {
      Bert.alert("Tag updated!", 'success');
    }
  });
};
