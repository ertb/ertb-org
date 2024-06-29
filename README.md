Electronic Recording Technology Board
=====================================

This is the source code for the [ertb.org](https://ertb.org) website.

## Developer Quick-start

### Prerequisites

1. [Node.js](https://nodejs.org/) needs to be installed
2. A docker environment needs to be available. I recommend [Rancher Desktop](https://rancherdesktop.io/).
3. Google Oath 2.0 Client ID using [Google API Console > Credentials][1]
4. Amazon Simple Email Server (Amazon SES) using [these instructions][2]

[1]: https://console.cloud.google.com/apis/credentials
[2]: https://docs.aws.amazon.com/ses/latest/DeveloperGuide/setting-up-email.html

The **Google API credentials** are required for authenticating admin users. It's a bit
difficult to get around this if you need to work on the admin pages.

The **Amazon Simple Email Server** is required for _emailing_ the content-us messages. If this
is not setup the messages are still stored in the Mongo Database.

Everything else can be mimic'd using local docker images.

### Configuring the environment

```sh
git clone git@github.com:ertb/ertb-org.git
cd ertb-org
npm install
```

After the depencencies are isntalled, setup the environment variable files

```
cp server/.env-example server/.env
```

And update the following lines (the rest are match the local development)

**server/.env**
```sh
GOOGLE_API_CLIENT_ID=<your-google-api-client-id>
ADMIN_EMAILS=<a-comma-separated-list-to-start>
SMTP_URL=smtps://<user>:<pass>@<host>:465
CONTACT_EMAIL=<where-to-send-contact-us-messages>
```

### Starting up the development servers

In separate terminal windows:

- `docker compose up`
- `npm run dev`

Then, visit [http://localhost:3000](http://localhost:3000)

### Configuring Google OAuth for local development

In order to test Google OAuth using localhost you need to add both `http://localhost;3000`
_and_ `http://localhost` to the list of Authorized Origins for the Client ID
in [Google API Console > Credentials][1]
