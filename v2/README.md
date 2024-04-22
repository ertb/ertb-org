
----

New version of ertb.org

- primary objective is to add accessiblity framework that will add a11y.js to the linter to adhere to WCAG 2.2 recommendations.

## Features

- public facing features:
  - present background/vision/mission/goals/objectives
  - download Senate Bills
  - show board members + support
  - download notice/agenda, minutes, reports, financials, audio, grants rfp
  - contact us form w/ email forwarding

- admin features
  - login - would be nice to move to OAuth for "sign-in with google"
  - edit members/support
  - files upload/delete/reorder
  - audio links 
  - messages

  - [nice to have] modify content: background/vision/mission/goals/objectives
  - [nice to have] modify content: download Senate Bills

- bug fixes:
  - some of the audio links are bad (start with file://)
  - don't allow shareing a file:// link!


## Architecture

### Frontend

The previous version was used Meteor+JQuery+S3+Mongo+Heroku. Unfortunately the need to add
accessibility auditing means that JQuery is not going to be useful.

Since react has some well-regarded approaces, such as axe-core/react and eslint-plugin-jsx-a11y,
and I'm most comfortable with React at this point, React will be a good way to go for the front-end.

- axe-core/react will log problems to the browser console
- eslint-plugins-jsx-a11y will report problems in the IDE (I use VSCode) and upon `npm run lint`.

### Backend

Unfortunately, Meteor has been stuck on Node v14 a while. There are plans this year to move it to
Node v20, but that will not be available in the short term.

I'm planning on implementing a Node server using express as descibed in the Heroku docs here:
https://devcenter.heroku.com/articles/getting-started-with-nodejs

I'm very familiar with Node and express. The part that will be new to me is the web-sockets integration,
but I think that is an optional feature since there is only one administrator and updates don't _have_
to be immediate. I'll skip that feature for the initial move from JQuery/Meteor to React/Node.

Additionally we need to support uploading and downloading of documents to and from S3, as well as
recording them in MongoDb.

There are Node clients for both MongoDb and S3 available. I'll likely be implementing an API for
uploading and downloading from our current MongoDb and S3 instances.

## Developer Notes

In order to test Google OAuth using localhost, edit /etc/host (use `sudo vi /etc/host`) and add this line:

```
127.0.0.1	ertb.org
```

Run a local S3 server (Minio) and MongoDB:

```
docker compose up
```

The credentials in _server/.env-example_ match the _docker-compose.yaml_ and _mongo-init.js_ files.
