const jobs = [
  require('./sendEmailReminders.js'),
]

module.exports = () => jobs.forEach(start=>start())
