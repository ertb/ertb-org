Electronic Recording Technology Board
=====================================

This is the source code for the ertb.org website.

Deployment
----------

The website is hosted on [Heroku](https://heroku.com). Deploy by pushing to the _heroku_ git repository:

    heroku git:remote -a ertb-org
    git push heroku master


Setting up a Meteor Skeleton
-----------------------------

The website skeleton was created and deployed using the following commands (boiled down from [these][1] [articles][2])

    git init .
    meteor create ertb
    mv ertb src
    git add src
    git commit -m "create meteor skeleton"

    heroku buildpacks:set --app ertb-org https://github.com/AdmitHub/meteor-buildpack-horse.git
    heroku addons:create --app ertb-org mongolab:sandbox
    heroku config:add --app ertb-org MONGO_URL=$(heroku config --app ertb-org | grep MONGODB_URI | awk '{print $2}')
    heroku config:add --app ertb-org ROOT_URL=https://ertb-org.herokuapp.com
    heroku config:add --app ertb-org METEOR_APP_DIR=src

    heroku git:remote -a ertb-org
    git push heroku master

[1]: https://medium.com/@leonardykris/how-to-run-a-meteor-js-application-on-heroku-in-10-steps-7aceb12de234
[2]: https://medium.com/@gge/deploy-a-meteor-1-3-application-to-heroku-cda1f68ca20a

Setting up Bootstrap Theme
--------------------------

The website uses the [Start bootstrap Agency][3] theme which uses [Bootstrap 4][4].

Setup Bootstrap following [this article][4]

    meteor remove less
    meteor remove standard-minifier-css
    meteor add fourseven:scss
    meteor add seba:minifiers-autoprefixer

    meteor npm install --save bootstrap@4.0.0-alpha.6
    meteor npm install --save tether

    meteor add mrt:jquery-easing

    mv client/main.css client/main.scss
    echo '@import "{}/node_modules/bootstrap/scss/bootstrap.scss";' >> client/main.scss

Add the following to `client/main.js`

    import tether from 'tether';
    global.Tether = tether;
    bootstrap = require('bootstrap');

Because the Agency theme's JavaScript expects the DOM to be available when it runs, it must be changed to a
callable function that is called on the templates' render call.

[3]: https://startbootstrap.com/template-overviews/agency/
[4]: https://v4-alpha.getbootstrap.com/
[5]: https://medium.com/@g1zmo/bootstrap-4-and-meteor-js-4cec073a4f6c

Configuring the Domain Name
---------------------------

Following the [instructions][6] from heroku

    heroku domains:add --app ertb-org ertb.org

Then, configure Google DNS to point to the DNS Target `ertb.org.herokudns.com`.

[6]: https://devcenter.heroku.com/articles/custom-domains

### Setup SSL

Heroku's [ACM][7] will automatically apply SSL certificates when you upgrade to a paid teir. Enable
the hobby-tier (the hobby-tier costs $7/month) via the Heroku dashboard, under the *resources* tab.

This meteor package redirects insecure connections (HTTP) to a secure URL (HTTPS).

    meteor add force-ssl

[7]: https://devcenter.heroku.com/articles/automated-certificate-management

### Setup S3 access for file upload/download

The file upload/download system was implemented following (these intructions)[https://themeteorchef.com/tutorials/uploading-files-to-amazon-s3] from the Meteor Chef. It relies on the `edgee:slinghot` package:

    meteor add edgee:slingshot

is managed using (the VeliovGroup's Meteor-Files)[https://github.com/VeliovGroup/Meteor-Files] project.

    meteor add ostrio:files
    meteor npm install aws-sdk --save


Instructions for setting up AWS S3 Integration [here](https://github.com/VeliovGroup/Meteor-Files/wiki/AWS-S3-Integration).

    heroku config:add --app ertb-org S3='{"s3":{"key": "xxx", "secret": "xxx", "bucket": "xxx", "region": "xxx"}}'

You can find the region code for your AWS S3 bucket [here](http://docs.aws.amazon.com/general/latest/gr/rande.html).

Instructions for configuring an Access Key for AWS S3 [here](https://aws.amazon.com/blogs/security/wheres-my-secret-access-key/).


Admin Features
--------------

There are two main features that are hidden and only available to admin users:

1. Review of messages submitted by the contact form on the main page.
2. Manage files shown under the 'Administration' section of the main page.

They are accessible at <http://ertb.org/admin> and require admin credentials.

### Set admin credentials

The credentials are set as environment variables. Set them in the heroku deployment with:

    heroku config:add --app ertb-org ADMIN_USERNAME="xxx"
    heroku config:add --app ertb-org ADMIN_PASSWORD="xxx"

Build Version
-------------

The build version is displayed in the footer of the application. The version is determined using a heroku buildpack per [these instructions](https://elements.heroku.com/buildpacks/ianpurvis/heroku-buildpack-version).

    heroku buildpacks:add https://github.com/ianpurvis/heroku-buildpack-version -a ertb-org

Which sets SOURCE_VERSION as an environment variable in the runtime environment.

***Note:*** adding this buildpack made it necessary to also define a Procfile.

Favicon
-------

The website icon was created with (this favicon generator)[https://realfavicongenerator.net].
