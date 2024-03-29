Electronic Recording Technology Board
=====================================

This is the source code for the ertb.org website.

Making Updates
--------------

One can make updates to the src and preview them using meteor

    cd src
    meteor --settings settings.json

Once updates are made to src files add and commit them to github

    git add .
    git commit -m "Updates made to ..."
    git push

Deployment
----------

The website is hosted on [Heroku](https://heroku.com). Deploy by pushing to the _heroku_ git repository:

    heroku git:remote -a ertb-org-heroku-20
    git push heroku-20 master

The MongoDB instances is hosted on [Mongo Atlas](https://cloud.mongodb.com/).

How This Website Was Created
============================

The rest of this document covers how this website was created and hosted. It is meant to be useful for developing
similar websites.

Setting up a Meteor Skeleton
----------------------------

The website skeleton was created and deployed using the following commands (boiled down from [these][1] [articles][2])

    git init .
    meteor create ertb
    mv ertb src
    git add src
    git commit -m "create meteor skeleton"

### Setup publishing to Heroku and using Mongo Atlas

You'll need to get your Mongo Atlas connection string

_Note: I setup my Mongo Atlas instance using a migration wizard (from mLab which was decommissioned Nov 2020). I haven't configured a sandbox instance in
Mongo Atlas from scratch, but it doesn't look difficult. You'll need a cluster, database, and a user._

1. Navigate to [Mongo Atlas](https://cloud.mongodb.com/) 
2. select **Projects > &lt;Your Project&gt;**, to show your clusters
3. ensure that **Clusters** is selected, then select **&lt;Your Cluster&gt; > CONNECT** to show the connection dialog
4. select **Connect Your Application** to reveal the `mongo+srv` URL
5. copy the `mongodb+srv` URL template, then **Close**. You'll need to get the database and password to complete the string.
   The template should look something like this: `mongodb+srv://user-57ee3050:<password>@cluster-57ee3050.agbbj.mongodb.net/<dbname>?retryWrites=true&w=majority`
6. select **&lt;Your Cluster&gt; > COLLECTIONS** to show the list of databases. Note the dbname to use with your app.
7. select **SECURITY > Database Access** to list your users and their passwords. Note the password for the username in the `mongo+srv` URL.

    export MONGO_URL="mongodb+srv://user-57ee3050:876d-abbca1af4de7@cluster-57ee3050.agbbj.mongodb.net/db-57ee3050?retryWrites=true&w=majority"

    heroku buildpacks:set --app ertb-org https://github.com/AdmitHub/meteor-buildpack-horse.git
    heroku config:add --app ertb-org MONGO_URL="${MONGO_URL}"
    heroku config:add --app ertb-org ROOT_URL=https://ertb-org.herokuapp.com
    heroku config:add --app ertb-org METEOR_APP_DIR=src

    heroku git:remote -a ertb-org
    git push heroku master

[1]: https://medium.com/@leonardykris/how-to-run-a-meteor-js-application-on-heroku-in-10-steps-7aceb12de234
[2]: https://medium.com/@gge/deploy-a-meteor-1-3-application-to-heroku-cda1f68ca20a

Setting up Bootstrap Theme
--------------------------

The website uses the [Start bootstrap Agency][3] theme which uses [Bootstrap 4][4].

Setup Bootstrap following [this article][4] _Note: this may be out of date, I had to upgrade to 1.11.1 recently._

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

[6]: https://devcenter.heroku.com/articles/custom-domains

Then, configure DNS provider to point to the DNS Target returned by the command,
for example: `polar-perch-w4tc5w8qr6m65vuyrjc89sfy.herokudns.com.`.

The **ertb.org** domain is hosted at [Google Domains](https://domains.google.com/).
Here are how the [instructions][6] from heroku break-down for configuring the **ertb.org** domain:

1. Add a CNAME record:

   | Host name | Type  | TTL  | Data
   |-----------|-------|------|-----------------------------------------------------
   | www       | CNAME | 3600 | polar-perch-w4tc5w8qr6m65vuyrjc89sfy.herokudns.com.

   and,

2. Configure the **ertb.org** to forward to `http://www.ertb.org`.


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

    heroku config:add --app ertb-org S3='{"s3":{"key":"xxx", "secret":"xxx", "bucket":"xxx", "region":"xxx"}}'

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

Contact-Form
------------

One of the features of the website is a contact form at the bottom of the home page. Contact messages are stored
in a Mongo collection and are reviewable on the admin page accessible at <http://ertb.org/admin>.

This of course requires an admin user to periodically review the messages. In order to send messages by email
to an admin there are two configuration values that must be set.

### MAIL_URL

The MAIL_URL should be set to the SMTP server that sends the email. I've configured Amazon Simple Email Server
(Amazon SES) using [these instructions](https://docs.aws.amazon.com/ses/latest/DeveloperGuide/setting-up-email.html)
and set the MAIL_URL to the authentication parameters for it.

    heroku config:add --app ertb-org MAIL_URL=smtps://USERNAME:PASSWORD@HOST:465

Note, Amazon SES is ordinarilly configured in __sandbox mode__. This puts a variety of limits on the account such
as only being able to send to and from verified email addressess and domains. Until the website exceeds these
limits (200

[These instruction](https://docs.aws.amazon.com/ses/latest/DeveloperGuide/verify-email-addresses-procedure.html)
describe how to verify the to and from email addresses defined in _METEOR_SETTINGS_ (see below).

### METEOR_SETTINGS

Additionally, the source and destination email addresses need to be configured. These values are stored in the variable
`Meteor.settings.contactForm` which can be set using the `METEOR_SETTINGS` environment variable.

    heroku config:set --app ertb-org METEOR_SETTINGS='{"contactForm":{"emailTo":"user@domain", "emailFrom":"user@domian"}}'

Ideally, the email should be sent from the mail address entered on the form, but when using the _Amazon SES sandbox_
you can only send email from a validated address. To use the address entered on the form, leave the `emailFrom` value
unset.

