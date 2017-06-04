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
