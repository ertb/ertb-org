import nodemailer from 'nodemailer'

/**
 * Sends an email message using the SMTP server specified in SMTP_URL
 * @param {string} from 
 * @param {string|string[]} to 
 * @param {string} subject 
 * @param {string} message
 * @param {boolean} html // indicates message is HTML
 * @throws error if cannot send email via smpt server
 */
export const sendEmail = (from:string, to:string, subject:string, message:string, html: boolean=false) => {
  if (Array.isArray(to)) to = to.join(', ')

  if (!process.env.SMTP_URL) {
    throw new Error('SMTP_URL is not set.')
  }

  const smtpUrl = new URL(process.env.SMTP_URL || '')
  if (['smtp:', 'smtps:'].indexOf(smtpUrl.protocol) < 0) {
    throw new Error('Protocol in SMTP_URL is invalid. Expecting "smtps" or "smtp".')
  }

  // create reusable transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    host: smtpUrl.hostname,
    port: parseInt(smtpUrl.port || smtpUrl.protocol == 'smtps:' ? '465' : '25'),
    secure: (smtpUrl.protocol == 'smtps:') || smtpUrl.port === '465',
    auth: {
      user: smtpUrl.username,
      pass: smtpUrl.password,
    }
  })

  // send mail with defined transport object
  return transporter.sendMail({
    from, // sender address
    bcc: process.env.SMTP_TEST_RECIPIENTS || to, // list of receivers
    subject, // Subject line
    text: !html ? message : undefined,
    html: html ? message : undefined,
  })
}
