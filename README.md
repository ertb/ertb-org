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
