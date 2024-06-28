const CronJob = require('node-cron')
const { every } = require('./crontime');
const sendPending = require('../controllers/emailReminderController/sendPending');
const config = require('../config/config');
const { DateTime } = require('luxon');

const timezone = config.cronTimezone;

module.exports = () => {
  const job = CronJob.schedule(every().hour(), async () => {
    const now = DateTime.now()
    const yesterday = DateTime.now().minus({days:1}).startOf('day')
    const plus5 = now.plus({minutes:5})
    sendPending(yesterday.toJSDate(), plus5.toJSDate())
  }, {timezone});

  job.start();
}

